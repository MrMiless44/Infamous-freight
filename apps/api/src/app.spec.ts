import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.ts";

const app = createApp();

describe("App integration tests", () => {
  describe("GET /health", () => {
    it("returns 200 with ok:true", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.service).toBe("infamous-freight-api");
    });

    it("includes uptime in the response", async () => {
      const res = await request(app).get("/health");

      expect(typeof res.body.uptime).toBe("number");
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("POST /api/shipments/eta-risk", () => {
    const validBody = {
      distanceRemainingMiles: 300,
      averageSpeedMph: 60,
      weatherRisk: 0.2,
      trafficRisk: 0.15,
      carrierReliability: 0.9,
    };

    it("returns 200 with ETA risk prediction for valid input", async () => {
      const res = await request(app)
        .post("/api/shipments/eta-risk")
        .send(validBody);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty("estimatedArrivalHours");
      expect(res.body.data).toHaveProperty("delayProbability");
      expect(res.body.data).toHaveProperty("riskBand");
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app)
        .post("/api/shipments/eta-risk")
        .send({ distanceRemainingMiles: 300 });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe("Validation error");
    });

    it("returns 400 for negative distanceRemainingMiles", async () => {
      const res = await request(app)
        .post("/api/shipments/eta-risk")
        .send({ ...validBody, distanceRemainingMiles: -1 });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("returns 400 for zero averageSpeedMph", async () => {
      const res = await request(app)
        .post("/api/shipments/eta-risk")
        .send({ ...validBody, averageSpeedMph: 0 });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("returns 400 when weatherRisk exceeds 1", async () => {
      const res = await request(app)
        .post("/api/shipments/eta-risk")
        .send({ ...validBody, weatherRisk: 1.5 });

      expect(res.status).toBe(400);
    });

    it("returns 400 for non-numeric fields", async () => {
      const res = await request(app)
        .post("/api/shipments/eta-risk")
        .send({ ...validBody, weatherRisk: "high" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/carriers/rank", () => {
    const validBody = {
      lane: {
        origin: "Dallas",
        destination: "Atlanta",
        distanceMiles: 781,
      },
      equipmentType: "VAN",
      carriers: [
        {
          id: "c1",
          name: "Atlas Freight",
          onTimeRate: 0.94,
          tenderAcceptanceRate: 0.91,
          safetyScore: 0.96,
          priceCompetitiveness: 0.84,
          serviceRating: 0.92,
          equipmentTypes: ["VAN"],
          activeLanes: ["Dallas->Atlanta"],
        },
      ],
    };

    it("returns 200 with ranked carriers", async () => {
      const res = await request(app)
        .post("/api/carriers/rank")
        .send(validBody);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("returns 400 for missing lane", async () => {
      const { lane: _ignored, ...noLane } = validBody;
      const res = await request(app)
        .post("/api/carriers/rank")
        .send(noLane);

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("returns 400 for invalid equipmentType", async () => {
      const res = await request(app)
        .post("/api/carriers/rank")
        .send({ ...validBody, equipmentType: "TRUCK" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when carriers array is missing", async () => {
      const { carriers: _ignored, ...noCarriers } = validBody;
      const res = await request(app)
        .post("/api/carriers/rank")
        .send(noCarriers);

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/rates/predict", () => {
    const validBody = {
      lane: {
        origin: "Dallas",
        destination: "Atlanta",
        distanceMiles: 781,
      },
      equipmentType: "VAN",
      fuelPriceUsdPerGallon: 3.49,
      seasonalityIndex: 1.04,
      marketCapacityIndex: 1.07,
      demandIndex: 1.05,
      historicalSpotRatePerMile: 2.11,
    };

    it("returns 200 with rate prediction", async () => {
      const res = await request(app)
        .post("/api/rates/predict")
        .send(validBody);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty("predictedRatePerMile");
      expect(res.body.data).toHaveProperty("confidenceScore");
      expect(res.body.data).toHaveProperty("estimatedLinehaul");
      expect(res.body.data).toHaveProperty("marginSuggestedPct");
    });

    it("returns 400 for missing fuelPriceUsdPerGallon", async () => {
      const { fuelPriceUsdPerGallon: _ignored, ...body } = validBody;
      const res = await request(app).post("/api/rates/predict").send(body);

      expect(res.status).toBe(400);
    });

    it("returns 400 for non-positive distanceMiles", async () => {
      const res = await request(app)
        .post("/api/rates/predict")
        .send({ ...validBody, lane: { ...validBody.lane, distanceMiles: 0 } });

      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid equipmentType", async () => {
      const res = await request(app)
        .post("/api/rates/predict")
        .send({ ...validBody, equipmentType: "CARGO" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/ai/command", () => {
    it("returns 200 for a valid price load command", async () => {
      const res = await request(app)
        .post("/api/ai/command")
        .send({ command: "price load from Dallas to Atlanta" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty("action");
    });

    it("returns 200 for an unknown command (graceful fallback)", async () => {
      const res = await request(app)
        .post("/api/ai/command")
        .send({ command: "do something weird please" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.action).toBe("UNKNOWN");
    });

    it("returns 400 when command is too short (< 3 chars)", async () => {
      const res = await request(app)
        .post("/api/ai/command")
        .send({ command: "hi" });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("returns 400 when command field is missing", async () => {
      const res = await request(app)
        .post("/api/ai/command")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("404 handler", () => {
    it("returns 404 for an unknown route", async () => {
      const res = await request(app).get("/api/does-not-exist");

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe("Route not found");
    });
  });
});
