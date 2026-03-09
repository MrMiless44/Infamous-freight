import { describe, it, expect } from "vitest";
import { EtaRiskService } from "./eta-risk.service.js";

describe("EtaRiskService", () => {
  const service = new EtaRiskService();

  describe("predict", () => {
    it("returns a LOW risk band for ideal conditions", () => {
      const result = service.predict({
        distanceRemainingMiles: 200,
        averageSpeedMph: 60,
        weatherRisk: 0.1,
        trafficRisk: 0.1,
        carrierReliability: 0.95,
      });

      expect(result.riskBand).toBe("LOW");
      expect(result.delayProbability).toBeGreaterThanOrEqual(0.03);
      expect(result.delayProbability).toBeLessThan(0.3);
      expect(result.estimatedArrivalHours).toBeGreaterThan(0);
    });

    it("returns a MEDIUM risk band for moderate disruption", () => {
      const result = service.predict({
        distanceRemainingMiles: 300,
        averageSpeedMph: 55,
        weatherRisk: 0.4,
        trafficRisk: 0.4,
        carrierReliability: 0.75,
      });

      expect(result.riskBand).toBe("MEDIUM");
      expect(result.delayProbability).toBeGreaterThanOrEqual(0.3);
      expect(result.delayProbability).toBeLessThan(0.6);
    });

    it("returns a HIGH risk band for severe conditions", () => {
      const result = service.predict({
        distanceRemainingMiles: 400,
        averageSpeedMph: 45,
        weatherRisk: 0.9,
        trafficRisk: 0.85,
        carrierReliability: 0.3,
      });

      expect(result.riskBand).toBe("HIGH");
      expect(result.delayProbability).toBeGreaterThanOrEqual(0.6);
    });

    it("clamps delay probability to minimum 0.03", () => {
      const result = service.predict({
        distanceRemainingMiles: 100,
        averageSpeedMph: 60,
        weatherRisk: 0,
        trafficRisk: 0,
        carrierReliability: 1,
      });

      expect(result.delayProbability).toBeGreaterThanOrEqual(0.03);
    });

    it("clamps delay probability to maximum 0.95", () => {
      const result = service.predict({
        distanceRemainingMiles: 500,
        averageSpeedMph: 55,
        weatherRisk: 1,
        trafficRisk: 1,
        carrierReliability: 0,
      });

      expect(result.delayProbability).toBeLessThanOrEqual(0.95);
    });

    it("uses minimum safe speed of 20 mph when averageSpeedMph is very low", () => {
      const slowResult = service.predict({
        distanceRemainingMiles: 100,
        averageSpeedMph: 5,
        weatherRisk: 0.1,
        trafficRisk: 0.1,
        carrierReliability: 0.9,
      });

      const safeSpeedResult = service.predict({
        distanceRemainingMiles: 100,
        averageSpeedMph: 20,
        weatherRisk: 0.1,
        trafficRisk: 0.1,
        carrierReliability: 0.9,
      });

      // Both should produce the same result since 5 is clamped to 20
      expect(slowResult.estimatedArrivalHours).toBe(safeSpeedResult.estimatedArrivalHours);
    });

    it("rounds estimatedArrivalHours to 2 decimal places", () => {
      const result = service.predict({
        distanceRemainingMiles: 123,
        averageSpeedMph: 58,
        weatherRisk: 0.2,
        trafficRisk: 0.15,
        carrierReliability: 0.88,
      });

      const decimals = result.estimatedArrivalHours.toString().split(".")[1];
      expect(decimals === undefined || decimals.length <= 2).toBe(true);
    });

    it("rounds delayProbability to 2 decimal places", () => {
      const result = service.predict({
        distanceRemainingMiles: 250,
        averageSpeedMph: 60,
        weatherRisk: 0.33,
        trafficRisk: 0.27,
        carrierReliability: 0.82,
      });

      const decimals = result.delayProbability.toString().split(".")[1];
      expect(decimals === undefined || decimals.length <= 2).toBe(true);
    });

    it("computes estimatedArrivalHours correctly for a known input", () => {
      // distance=60, speed=60 => rawHours=1
      // disruptionFactor = 1 + 0*0.22 + 0*0.18 + (1-1)*0.2 = 1
      // estimatedArrivalHours = 1 * 1 = 1
      const result = service.predict({
        distanceRemainingMiles: 60,
        averageSpeedMph: 60,
        weatherRisk: 0,
        trafficRisk: 0,
        carrierReliability: 1,
      });

      expect(result.estimatedArrivalHours).toBe(1);
    });
  });
});
