import { describe, it, expect } from "vitest";
import { CarrierIntelligenceService } from "./carrier-intelligence.service.js";
import type { CarrierProfile } from "../types/domain.js";

const makeCarrier = (overrides: Partial<CarrierProfile> = {}): CarrierProfile => ({
  id: "c1",
  name: "Test Carrier",
  onTimeRate: 0.9,
  tenderAcceptanceRate: 0.85,
  safetyScore: 0.92,
  priceCompetitiveness: 0.88,
  serviceRating: 0.87,
  equipmentTypes: ["VAN"],
  activeLanes: ["dallas->atlanta"],
  ...overrides,
});

describe("CarrierIntelligenceService", () => {
  const service = new CarrierIntelligenceService();

  const lane = {
    origin: "dallas",
    destination: "atlanta",
    distanceMiles: 781,
  };

  describe("scoreCarrier", () => {
    it("computes a weighted composite score", () => {
      const carrier = makeCarrier({
        onTimeRate: 1,
        tenderAcceptanceRate: 1,
        safetyScore: 1,
        priceCompetitiveness: 1,
        serviceRating: 1,
      });

      expect(service.scoreCarrier(carrier)).toBe(1);
    });

    it("returns 0 for a carrier with all-zero metrics", () => {
      const carrier = makeCarrier({
        onTimeRate: 0,
        tenderAcceptanceRate: 0,
        safetyScore: 0,
        priceCompetitiveness: 0,
        serviceRating: 0,
      });

      expect(service.scoreCarrier(carrier)).toBe(0);
    });

    it("rounds to 4 decimal places", () => {
      const carrier = makeCarrier({
        onTimeRate: 0.94,
        tenderAcceptanceRate: 0.91,
        safetyScore: 0.96,
        priceCompetitiveness: 0.84,
        serviceRating: 0.92,
      });

      const score = service.scoreCarrier(carrier);
      const decimals = score.toString().split(".")[1] ?? "";
      expect(decimals.length).toBeLessThanOrEqual(4);
    });

    it("onTimeRate has the highest weight (0.3)", () => {
      const highOnTime = makeCarrier({ onTimeRate: 1, tenderAcceptanceRate: 0, safetyScore: 0, priceCompetitiveness: 0, serviceRating: 0 });
      const highTender = makeCarrier({ onTimeRate: 0, tenderAcceptanceRate: 1, safetyScore: 0, priceCompetitiveness: 0, serviceRating: 0 });

      expect(service.scoreCarrier(highOnTime)).toBeGreaterThan(service.scoreCarrier(highTender));
    });
  });

  describe("rankCarriersForLane", () => {
    it("filters out carriers that don't serve the lane", () => {
      const carriers = [
        makeCarrier({ id: "c1", activeLanes: ["dallas->atlanta"], equipmentTypes: ["VAN"] }),
        makeCarrier({ id: "c2", activeLanes: ["houston->memphis"], equipmentTypes: ["VAN"] }),
      ];

      const ranked = service.rankCarriersForLane(carriers, lane, "VAN");
      expect(ranked).toHaveLength(1);
      expect(ranked[0].carrier.id).toBe("c1");
    });

    it("filters out carriers that don't have the required equipment type", () => {
      const carriers = [
        makeCarrier({ id: "c1", activeLanes: ["dallas->atlanta"], equipmentTypes: ["VAN"] }),
        makeCarrier({ id: "c2", activeLanes: ["dallas->atlanta"], equipmentTypes: ["REEFER"] }),
      ];

      const ranked = service.rankCarriersForLane(carriers, lane, "VAN");
      expect(ranked).toHaveLength(1);
      expect(ranked[0].carrier.id).toBe("c1");
    });

    it("returns carriers sorted by score descending", () => {
      const carriers = [
        makeCarrier({ id: "low", onTimeRate: 0.5, activeLanes: ["dallas->atlanta"], equipmentTypes: ["VAN"] }),
        makeCarrier({ id: "high", onTimeRate: 0.99, activeLanes: ["dallas->atlanta"], equipmentTypes: ["VAN"] }),
      ];

      const ranked = service.rankCarriersForLane(carriers, lane, "VAN");
      expect(ranked[0].carrier.id).toBe("high");
      expect(ranked[1].carrier.id).toBe("low");
    });

    it("returns an empty array when no carriers match", () => {
      const ranked = service.rankCarriersForLane([], lane, "VAN");
      expect(ranked).toHaveLength(0);
    });

    it("includes score for each ranked carrier", () => {
      const carriers = [
        makeCarrier({ id: "c1", activeLanes: ["dallas->atlanta"], equipmentTypes: ["VAN"] }),
      ];

      const ranked = service.rankCarriersForLane(carriers, lane, "VAN");
      expect(ranked[0]).toHaveProperty("score");
      expect(typeof ranked[0].score).toBe("number");
    });
  });

  describe("chooseBestCarrier", () => {
    it("returns the highest-scored carrier", () => {
      const carriers = [
        makeCarrier({ id: "low", onTimeRate: 0.5, activeLanes: ["dallas->atlanta"], equipmentTypes: ["VAN"] }),
        makeCarrier({ id: "high", onTimeRate: 0.99, activeLanes: ["dallas->atlanta"], equipmentTypes: ["VAN"] }),
      ];

      const best = service.chooseBestCarrier(carriers, lane, "VAN");
      expect(best?.carrier.id).toBe("high");
    });

    it("returns null when no carriers are available", () => {
      const result = service.chooseBestCarrier([], lane, "VAN");
      expect(result).toBeNull();
    });

    it("returns null when no carriers match the lane or equipment", () => {
      const carriers = [
        makeCarrier({ id: "c1", activeLanes: ["houston->memphis"], equipmentTypes: ["VAN"] }),
      ];

      const result = service.chooseBestCarrier(carriers, lane, "VAN");
      expect(result).toBeNull();
    });
  });
});
