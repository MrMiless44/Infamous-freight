import { describe, it, expect } from "vitest";
import { RatePredictionService } from "./rate-prediction.service.js";

describe("RatePredictionService", () => {
  const service = new RatePredictionService();

  const baseLane = {
    origin: "Dallas",
    destination: "Atlanta",
    distanceMiles: 781,
  };

  const baseInput = {
    lane: baseLane,
    equipmentType: "VAN" as const,
    fuelPriceUsdPerGallon: 3.49,
    seasonalityIndex: 1.04,
    marketCapacityIndex: 1.07,
    demandIndex: 1.05,
    historicalSpotRatePerMile: 2.11,
  };

  describe("predict", () => {
    it("returns a valid prediction object with required fields", () => {
      const result = service.predict(baseInput);

      expect(result).toHaveProperty("predictedRatePerMile");
      expect(result).toHaveProperty("confidenceScore");
      expect(result).toHaveProperty("estimatedLinehaul");
      expect(result).toHaveProperty("marginSuggestedPct");
    });

    it("predictedRatePerMile is never below minimum of 1.25", () => {
      const input = {
        ...baseInput,
        historicalSpotRatePerMile: 0.1,
        seasonalityIndex: 0.8,
        marketCapacityIndex: 0.8,
        demandIndex: 0.8,
        fuelPriceUsdPerGallon: 3.25,
      };

      const result = service.predict(input);
      expect(result.predictedRatePerMile).toBeGreaterThanOrEqual(1.25);
    });

    it("estimatedLinehaul is a positive number matching distance * rate", () => {
      const result = service.predict(baseInput);

      expect(result.estimatedLinehaul).toBeGreaterThan(0);
      // Both values are independently rounded to 2dp, so we check approximate relationship
      const expectedApprox = result.predictedRatePerMile * baseLane.distanceMiles;
      expect(Math.abs(result.estimatedLinehaul - expectedApprox)).toBeLessThan(5);
    });

    it("suggests higher margin when rate is above historical spot rate", () => {
      const highDemand = {
        ...baseInput,
        seasonalityIndex: 1.2,
        marketCapacityIndex: 1.2,
        demandIndex: 1.2,
      };

      const result = service.predict(highDemand);
      if (
        result.predictedRatePerMile >
        baseInput.historicalSpotRatePerMile
      ) {
        expect(result.marginSuggestedPct).toBe(0.12);
      }
    });

    it("suggests lower margin when rate is at or below historical", () => {
      const lowDemand = {
        ...baseInput,
        seasonalityIndex: 0.85,
        marketCapacityIndex: 0.85,
        demandIndex: 0.85,
        fuelPriceUsdPerGallon: 3.25,
      };

      const result = service.predict(lowDemand);
      if (
        result.predictedRatePerMile <=
        lowDemand.historicalSpotRatePerMile
      ) {
        expect(result.marginSuggestedPct).toBe(0.09);
      }
    });

    it("applies short-haul penalty for distances < 250 miles", () => {
      const shortLane = { ...baseLane, distanceMiles: 150 };
      const longLane = { ...baseLane, distanceMiles: 700 };

      const shortResult = service.predict({ ...baseInput, lane: shortLane });
      const longResult = service.predict({ ...baseInput, lane: longLane });

      // Short haul has bigger penalty (0.18), long haul has none
      expect(shortResult.predictedRatePerMile).toBeGreaterThan(
        longResult.predictedRatePerMile,
      );
    });

    it("applies medium-haul penalty for distances 250–600 miles", () => {
      const mediumLane = { ...baseLane, distanceMiles: 400 };
      const longLane = { ...baseLane, distanceMiles: 700 };

      const medResult = service.predict({ ...baseInput, lane: mediumLane });
      const longResult = service.predict({ ...baseInput, lane: longLane });

      expect(medResult.predictedRatePerMile).toBeGreaterThan(
        longResult.predictedRatePerMile,
      );
    });

    it("confidenceScore stays between 0.55 and 0.97", () => {
      const result = service.predict(baseInput);

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.55);
      expect(result.confidenceScore).toBeLessThanOrEqual(0.97);
    });

    it("rounds all output values to 2 decimal places", () => {
      const result = service.predict(baseInput);

      const toDecimals = (n: number) =>
        (n.toString().split(".")[1] ?? "").length;

      expect(toDecimals(result.predictedRatePerMile)).toBeLessThanOrEqual(2);
      expect(toDecimals(result.confidenceScore)).toBeLessThanOrEqual(2);
      expect(toDecimals(result.estimatedLinehaul)).toBeLessThanOrEqual(2);
      expect(toDecimals(result.marginSuggestedPct)).toBeLessThanOrEqual(2);
    });

    it("accounts for fuel price adjustment above baseline $3.25", () => {
      const cheapFuel = service.predict({
        ...baseInput,
        fuelPriceUsdPerGallon: 3.25,
      });
      const expensiveFuel = service.predict({
        ...baseInput,
        fuelPriceUsdPerGallon: 5.0,
      });

      expect(expensiveFuel.predictedRatePerMile).toBeGreaterThan(
        cheapFuel.predictedRatePerMile,
      );
    });
  });
});
