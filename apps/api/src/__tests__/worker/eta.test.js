/**
 * ETA Processor Tests
 * Tests for estimated time arrival calculation and caching
 */

// Mock Prisma before requiring the module
const mockPrisma = {
  job: {
    findUnique: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("../../mapbox/eta", () => ({
  etaToPickupSeconds: jest.fn(),
}));

jest.mock("../../queue/redis", () => ({
  redisConnection: jest.fn(() => mockRedis),
}));

const { processEta } = require("../../worker/processors/eta");
const { etaToPickupSeconds } = require("../../mapbox/eta");

describe("ETA Processor", () => {
  let mockJob;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockRedis.set.mockResolvedValue("OK");
    mockRedis.get.mockResolvedValue(null);

    mockJob = {
      id: "job-1",
      data: {
        jobId: "shipment_123",
        candidateDriverIds: ["driver_1", "driver_2", "driver_3"],
      },
    };

    etaToPickupSeconds.mockResolvedValue([300, 600, 900]);
  });

  describe("Job Processing", () => {
    it("should process ETA job successfully", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        pickupLat: 40.7128,
        pickupLng: -74.006,
      });

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "driver_1",
          driverProfile: { lastLat: 40.715, lastLng: -74.007 },
        },
        {
          id: "driver_2",
          driverProfile: { lastLat: 40.71, lastLng: -74.005 },
        },
        {
          id: "driver_3",
          driverProfile: { lastLat: 40.72, lastLng: -74.01 },
        },
      ]);

      const result = await processEta(mockJob);

      expect(result.ok).toBe(true);
      expect(result.count).toBe(3);
    });

    it("should handle missing job", async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);

      const result = await processEta(mockJob);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("JOB_NOT_FOUND");
    });

    it("should filter inactive drivers", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        pickupLat: 40.7128,
        pickupLng: -74.006,
      });

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "driver_1",
          driverProfile: { lastLat: 40.715, lastLng: -74.007 },
        },
      ]);

      etaToPickupSeconds.mockResolvedValue([300]);

      const result = await processEta(mockJob);

      expect(result.count).toBe(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            driverProfile: expect.objectContaining({
              isActive: true,
            }),
          }),
        }),
      );
    });
  });

  describe("Coordinate Calculation", () => {
    beforeEach(() => {
      mockPrisma.job.findUnique.mockResolvedValue({
        pickupLat: 40.7128,
        pickupLng: -74.006,
      });
    });

    it("should collect driver coordinates", async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "driver_1",
          driverProfile: { lastLat: 40.715, lastLng: -74.007 },
        },
        {
          id: "driver_2",
          driverProfile: { lastLat: 40.71, lastLng: -74.005 },
        },
      ]);

      etaToPickupSeconds.mockResolvedValue([300, 600]);

      await processEta(mockJob);

      expect(etaToPickupSeconds).toHaveBeenCalledWith(
        expect.objectContaining({
          pickup: { lat: 40.7128, lng: -74.006 },
          drivers: expect.arrayContaining([
            { lat: 40.715, lng: -74.007 },
            { lat: 40.71, lng: -74.005 },
          ]),
        }),
      );
    });

    it("should handle no candidate drivers", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await processEta(mockJob);

      expect(result.count).toBe(0);
    });

    it("should handle partial coordinates", async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "driver_1",
          driverProfile: { lastLat: 40.715, lastLng: -74.007 },
        },
      ]);

      etaToPickupSeconds.mockResolvedValue([300]);

      const result = await processEta(mockJob);

      expect(result.ok).toBe(true);
    });
  });

  describe("ETA Caching", () => {
    beforeEach(() => {
      mockPrisma.job.findUnique.mockResolvedValue({
        pickupLat: 40.7128,
        pickupLng: -74.006,
      });

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "driver_1",
          driverProfile: { lastLat: 40.715, lastLng: -74.007 },
        },
      ]);

      etaToPickupSeconds.mockResolvedValue([300]);
    });

    it("should cache ETA results in Redis", async () => {
      await processEta(mockJob);

      expect(mockRedis.set).toHaveBeenCalled();
    });

    it("should use correct Redis key format", async () => {
      await processEta(mockJob);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^eta:job:/),
        expect.any(String),
        "EX",
        expect.any(Number),
      );
    });

    it("should store ETA map as JSON", async () => {
      await processEta(mockJob);

      const callArgs = mockRedis.set.mock.calls[0];
      const jsonData = callArgs[1];

      expect(() => JSON.parse(jsonData)).not.toThrow();
      const data = JSON.parse(jsonData);
      expect(data).toHaveProperty("driver_1", 300);
    });

    it("should set TTL from environment", async () => {
      process.env.MAPBOX_ETA_CACHE_TTL_SECONDS = "60";

      await processEta(mockJob);

      expect(mockRedis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), "EX", 60);
    });

    it("should use default TTL if not configured", async () => {
      delete process.env.MAPBOX_ETA_CACHE_TTL_SECONDS;

      await processEta(mockJob);

      expect(mockRedis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), "EX", 30);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors", async () => {
      mockPrisma.job.findUnique.mockRejectedValue(new Error("Database error"));

      await expect(processEta(mockJob)).rejects.toThrow();
    });

    it("should handle ETA calculation errors", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        pickupLat: 40.7128,
        pickupLng: -74.006,
      });

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "driver_1",
          driverProfile: { lastLat: 40.715, lastLng: -74.007 },
        },
      ]);

      etaToPickupSeconds.mockRejectedValue(new Error("ETA calculation failed"));

      await expect(processEta(mockJob)).rejects.toThrow();
    });

    it("should handle Redis cache errors", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        pickupLat: 40.7128,
        pickupLng: -74.006,
      });

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "driver_1",
          driverProfile: { lastLat: 40.715, lastLng: -74.007 },
        },
      ]);

      etaToPickupSeconds.mockResolvedValue([300]);

      mockRedis.set.mockRejectedValue(new Error("Redis error"));

      await expect(processEta(mockJob)).rejects.toThrow();
    });

    it("should handle invalid coordinates", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        pickupLat: null,
        pickupLng: null,
      });

      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await processEta(mockJob);

      expect(result).toBeDefined();
    });
  });

  describe("Data Mapping", () => {
    it("should create driver to ETA mapping", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        pickupLat: 40.7128,
        pickupLng: -74.006,
      });

      mockPrisma.user.findMany.mockResolvedValue([
        { id: "driver_1", driverProfile: { lastLat: 40.715, lastLng: -74.007 } },
        { id: "driver_2", driverProfile: { lastLat: 40.71, lastLng: -74.005 } },
      ]);

      etaToPickupSeconds.mockResolvedValue([300, 600]);

      await processEta(mockJob);

      const callArgs = mockRedis.set.mock.calls[0];
      const jsonData = JSON.parse(callArgs[1]);

      expect(jsonData).toEqual({
        driver_1: 300,
        driver_2: 600,
      });
    });
  });
});
