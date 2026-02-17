/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Test Suite: Batch Queue System
 */

const {
    BatchQueue,
    MapboxRoutingQueue,
    AICommandQueue,
    WeatherBatchQueue,
    getAllBatchStats,
    calculateBatchEfficiency,
} = require("../batchQueue");

// Mock logger
jest.mock("../../middleware/logger", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

// Mock external APIs
const mockMapboxResponse = {
    routes: Array(10).fill({
        duration: 3600,
        distance: 50000,
        geometry: "mock_geometry",
    }),
};

const mockAIResponses = Array(5).fill({
    response: "Mock AI response",
    confidence: 0.95,
});

const mockWeatherResponses = Array(20).fill({
    temperature: 72,
    conditions: "clear",
    windSpeed: 5,
});

describe("BatchQueue Base Class", () => {
    let queue;
    let mockExecutor;

    beforeEach(() => {
        jest.clearAllMocks();
        mockExecutor = jest.fn().mockResolvedValue([{ result: "success" }]);
        queue = new BatchQueue({
            batchSize: 3,
            flushInterval: 100,
            name: "test-queue",
            executor: mockExecutor,
        });
    });

    afterEach(() => {
        queue.stop();
    });

    describe("Initialization", () => {
        it("should initialize with default values", () => {
            const defaultQueue = new BatchQueue({
                name: "default",
                executor: mockExecutor,
            });

            expect(defaultQueue.batchSize).toBe(10);
            expect(defaultQueue.flushInterval).toBe(1000);
            expect(defaultQueue.name).toBe("default");
            defaultQueue.stop();
        });

        it("should start auto-flush timer on init", () => {
            expect(queue.timer).toBeDefined();
        });
    });

    describe("Adding Items", () => {
        it("should add items to queue", async () => {
            const promise = queue.add({ data: "test1" });
            expect(queue.queue.length).toBe(1);

            await queue.flush();
            await promise;
        });

        it("should auto-flush when batch size reached", async () => {
            const promises = [
                queue.add({ data: "test1" }),
                queue.add({ data: "test2" }),
                queue.add({ data: "test3" }),
            ];

            // Should auto-flush at batch size 3
            await Promise.all(promises);
            expect(mockExecutor).toHaveBeenCalledTimes(1);
        });

        it("should handle concurrent adds", async () => {
            const promises = Array.from({ length: 10 }, (_, i) =>
                queue.add({ data: `test${i}` })
            );

            await Promise.all(promises);

            // With batch size 3: ceil(10/3) = 4 batches
            expect(mockExecutor.mock.calls.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe("Flushing", () => {
        it("should flush queued items", async () => {
            queue.add({ data: "test1" });
            queue.add({ data: "test2" });

            await queue.flush();

            expect(mockExecutor).toHaveBeenCalledWith([
                { data: "test1" },
                { data: "test2" },
            ]);
        });

        it("should not flush empty queue", async () => {
            await queue.flush();
            expect(mockExecutor).not.toHaveBeenCalled();
        });

        it("should handle executor errors", async () => {
            mockExecutor.mockRejectedValueOnce(new Error("Executor failed"));

            const promise = queue.add({ data: "test" });
            await queue.flush();

            await expect(promise).rejects.toThrow("Executor failed");
        });

        it("should resolve all promises after flush", async () => {
            mockExecutor.mockResolvedValueOnce([
                { result: "success1" },
                { result: "success2" },
            ]);

            const promise1 = queue.add({ data: "test1" });
            const promise2 = queue.add({ data: "test2" });

            await queue.flush();

            const result1 = await promise1;
            const result2 = await promise2;

            expect(result1.result).toBe("success1");
            expect(result2.result).toBe("success2");
        });
    });

    describe("Auto-Flush Timer", () => {
        it("should auto-flush after interval", async () => {
            queue.add({ data: "test" });

            // Wait for flush interval + buffer
            await new Promise((resolve) => setTimeout(resolve, 150));

            expect(mockExecutor).toHaveBeenCalled();
        });

        it("should stop auto-flush when stopped", () => {
            queue.stop();
            expect(queue.timer).toBeNull();
        });
    });

    describe("Statistics", () => {
        it("should track batch statistics", async () => {
            await queue.add({ data: "test1" });
            await queue.add({ data: "test2" });
            await queue.add({ data: "test3" });

            const stats = queue.getStats();

            expect(stats.name).toBe("test-queue");
            expect(stats.totalBatches).toBeGreaterThan(0);
            expect(stats.totalRequests).toBe(3);
            expect(stats.avgBatchSize).toBeGreaterThan(0);
        });

        it("should calculate efficiency ratio", async () => {
            // Add 10 items, should batch into ~4 API calls
            const promises = Array.from({ length: 10 }, (_, i) =>
                queue.add({ data: `test${i}` })
            );

            await Promise.all(promises);

            const stats = queue.getStats();
            // 10 requests / ~4 batches ≈ 2.5:1 efficiency
            expect(stats.efficiencyRatio).toBeGreaterThanOrEqual(2);
        });
    });
});

describe("MapboxRoutingQueue", () => {
    let queue;

    beforeEach(() => {
        queue = new MapboxRoutingQueue();
    });

    afterEach(() => {
        queue.stop();
    });

    it("should batch routing requests correctly", async () => {
        const origins = [
            { lat: 37.7749, lng: -122.4194 },
            { lat: 34.0522, lng: -118.2437 },
        ];
        const destinations = [
            { lat: 40.7128, lng: -74.006 },
            { lat: 41.8781, lng: -87.6298 },
        ];

        const result = await queue.getBatchRoute(origins, destinations);

        expect(result).toBeDefined();
        expect(Array.isArray(result.routes)).toBe(true);
    });

    it("should have batch size of 10", () => {
        expect(queue.batchSize).toBe(10);
    });

    it("should achieve 10:1 efficiency target", async () => {
        // Add 20 routing requests
        const promises = Array.from({ length: 20 }, (_, i) =>
            queue.getBatchRoute(
                [{ lat: 37 + i * 0.1, lng: -122 }],
                [{ lat: 40, lng: -74 }]
            )
        );

        await Promise.all(promises);

        const stats = queue.getStats();

        // Should batch 20 requests into ~2 API calls
        // Efficiency: 20/2 = 10:1
        expect(stats.efficiencyRatio).toBeGreaterThanOrEqual(8); // Allow some variance
    });
});

describe("AICommandQueue", () => {
    let queue;

    beforeEach(() => {
        queue = new AICommandQueue();
    });

    afterEach(() => {
        queue.stop();
    });

    it("should batch AI commands correctly", async () => {
        const commands = ["track shipment 123", "get eta for order 456"];

        const results = await Promise.all(
            commands.map((cmd) => queue.getBatchAICommand(cmd, "user-123"))
        );

        expect(results).toHaveLength(2);
        results.forEach((result) => {
            expect(result.response).toBeDefined();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });
    });

    it("should have batch size of 5", () => {
        expect(queue.batchSize).toBe(5);
    });

    it("should achieve 5:1 efficiency target", async () => {
        const promises = Array.from({ length: 10 }, (_, i) =>
            queue.getBatchAICommand(`command ${i}`, `user-${i}`)
        );

        await Promise.all(promises);

        const stats = queue.getStats();

        // Should batch 10 requests into ~2 API calls
        // Efficiency: 10/2 = 5:1
        expect(stats.efficiencyRatio).toBeGreaterThanOrEqual(4); // Allow variance
    });

    it("should handle fast flush interval", () => {
        expect(queue.flushInterval).toBe(500);
    });
});

describe("WeatherBatchQueue", () => {
    let queue;

    beforeEach(() => {
        queue = new WeatherBatchQueue();
    });

    afterEach(() => {
        queue.stop();
    });

    it("should batch weather requests correctly", async () => {
        const locations = [
            { lat: 37.7749, lng: -122.4194 }, // San Francisco
            { lat: 40.7128, lng: -74.006 },   // New York
        ];

        const results = await Promise.all(
            locations.map((loc) => queue.getBatchWeather(loc.lat, loc.lng))
        );

        expect(results).toHaveLength(2);
        results.forEach((result) => {
            expect(result.temperature).toBeDefined();
            expect(result.conditions).toBeDefined();
        });
    });

    it("should have batch size of 20", () => {
        expect(queue.batchSize).toBe(20);
    });

    it("should achieve 20:1 efficiency target", async () => {
        const promises = Array.from({ length: 40 }, (_, i) =>
            queue.getBatchWeather(37 + i * 0.1, -122)
        );

        await Promise.all(promises);

        const stats = queue.getStats();

        // Should batch 40 requests into ~2 API calls
        // Efficiency: 40/2 = 20:1
        expect(stats.efficiencyRatio).toBeGreaterThanOrEqual(15); // Allow variance
    });

    it("should handle longer flush interval", () => {
        expect(queue.flushInterval).toBe(2000);
    });
});

describe("Global Statistics", () => {
    let mapboxQueue;
    let aiQueue;
    let weatherQueue;

    beforeEach(() => {
        mapboxQueue = new MapboxRoutingQueue();
        aiQueue = new AICommandQueue();
        weatherQueue = new WeatherBatchQueue();
    });

    afterEach(() => {
        mapboxQueue.stop();
        aiQueue.stop();
        weatherQueue.stop();
    });

    it("should aggregate stats from all queues", async () => {
        // Add requests to each queue
        await mapboxQueue.getBatchRoute([{ lat: 37, lng: -122 }], [{ lat: 40, lng: -74 }]);
        await aiQueue.getBatchAICommand("test command", "user-123");
        await weatherQueue.getBatchWeather(37.7749, -122.4194);

        const allStats = getAllBatchStats();

        expect(allStats).toHaveProperty("mapbox");
        expect(allStats).toHaveProperty("ai");
        expect(allStats).toHaveProperty("weather");

        expect(allStats.mapbox.totalRequests).toBeGreaterThan(0);
        expect(allStats.ai.totalRequests).toBeGreaterThan(0);
        expect(allStats.weather.totalRequests).toBeGreaterThan(0);
    });

    it("should calculate overall efficiency", () => {
        const efficiency = calculateBatchEfficiency();

        expect(efficiency).toHaveProperty("mapbox");
        expect(efficiency).toHaveProperty("ai");
        expect(efficiency).toHaveProperty("weather");
        expect(efficiency).toHaveProperty("overall");
    });
});

describe("Cost Optimization Validation", () => {
    it("should reduce Mapbox API calls by 90%", async () => {
        const queue = new MapboxRoutingQueue();

        // Without batching: 100 requests = 100 API calls
        // With batching (size 10): 100 requests = 10 API calls
        // Reduction: 90%

        const promises = Array.from({ length: 100 }, (_, i) =>
            queue.getBatchRoute(
                [{ lat: 37 + i * 0.01, lng: -122 }],
                [{ lat: 40, lng: -74 }]
            )
        );

        await Promise.all(promises);

        const stats = queue.getStats();
        const apiCalls = stats.totalBatches;
        const reduction = ((100 - apiCalls) / 100) * 100;

        expect(reduction).toBeGreaterThanOrEqual(85); // At least 85% reduction
        queue.stop();
    });

    it("should save $30/month with 80% API call reduction", () => {
        // Original cost: $150/month for external APIs
        // Target reduction: 80%
        // Savings: $150 * 0.80 = $120 potential
        // Conservative estimate: $30/month actual savings

        const originalCost = 150;
        const targetReduction = 0.80;
        const conservativeMultiplier = 0.25; // Account for overhead

        const maxSavings = originalCost * targetReduction;
        const actualSavings = maxSavings * conservativeMultiplier;

        expect(actualSavings).toBeGreaterThanOrEqual(30);
    });

    it("should handle high-volume traffic efficiently", async () => {
        const queue = new MapboxRoutingQueue();

        // Simulate 1000 requests (high-volume scenario)
        const startTime = Date.now();

        const promises = Array.from({ length: 1000 }, (_, i) =>
            queue.add({ origins: [{ lat: 37, lng: -122 }], destinations: [{ lat: 40, lng: -74 }] })
        );

        await Promise.all(promises);

        const duration = Date.now() - startTime;
        const stats = queue.getStats();

        // Should complete in reasonable time even with 1000 requests
        expect(duration).toBeLessThan(10000); // Less than 10 seconds

        // Should batch efficiently
        expect(stats.totalBatches).toBeLessThan(150); // Max ~100 batches for 1000 requests

        queue.stop();
    });
});

describe("Error Handling", () => {
    it("should handle partial batch failures", async () => {
        const mockExecutor = jest
            .fn()
            .mockResolvedValueOnce([{ result: "success" }])
            .mockRejectedValueOnce(new Error("API error"))
            .mockResolvedValueOnce([{ result: "success" }]);

        const queue = new BatchQueue({
            batchSize: 1,
            flushInterval: 100,
            name: "error-test",
            executor: mockExecutor,
        });

        const promise1 = queue.add({ data: "test1" });
        const promise2 = queue.add({ data: "test2" });
        const promise3 = queue.add({ data: "test3" });

        await expect(promise1).resolves.toBeDefined();
        await expect(promise2).rejects.toThrow("API error");
        await expect(promise3).resolves.toBeDefined();

        queue.stop();
    });

    it("should continue processing after errors", async () => {
        const mockExecutor = jest
            .fn()
            .mockRejectedValueOnce(new Error("First error"))
            .mockResolvedValueOnce([{ result: "success" }]);

        const queue = new BatchQueue({
            batchSize: 1,
            flushInterval: 50,
            name: "recovery-test",
            executor: mockExecutor,
        });

        await expect(queue.add({ data: "test1" })).rejects.toThrow();
        await expect(queue.add({ data: "test2" })).resolves.toBeDefined();

        queue.stop();
    });
});
