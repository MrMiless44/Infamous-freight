import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrchestrationService } from "./orchestration.service.js";
import { AICommandService } from "./ai-command.service.js";
import { CarrierIntelligenceService } from "./carrier-intelligence.service.js";
import { RatePredictionService } from "./rate-prediction.service.js";
import { EtaRiskService } from "./eta-risk.service.js";

describe("OrchestrationService", () => {
  let service: OrchestrationService;
  let mockAI: AICommandService;
  let mockCarriers: CarrierIntelligenceService;
  let mockRates: RatePredictionService;
  let mockEta: EtaRiskService;

  beforeEach(() => {
    mockAI = new AICommandService();
    mockCarriers = new CarrierIntelligenceService();
    mockRates = new RatePredictionService();
    mockEta = new EtaRiskService();

    service = new OrchestrationService(mockAI, mockCarriers, mockRates, mockEta);
  });

  describe("execute", () => {
    it("handles PRICE_LOAD command and returns rate prediction", () => {
      vi.spyOn(mockAI, "parse").mockReturnValue({
        type: "PRICE_LOAD",
        origin: "dallas",
        destination: "atlanta",
      });

      const rateSpy = vi.spyOn(mockRates, "predict").mockReturnValue({
        predictedRatePerMile: 2.45,
        confidenceScore: 0.9,
        estimatedLinehaul: 1913.45,
        marginSuggestedPct: 0.12,
      });

      const result = service.execute("price load from Dallas to Atlanta");

      expect(result.action).toBe("PRICE_LOAD");
      expect(result).toHaveProperty("lane");
      expect(result).toHaveProperty("result");
      expect(rateSpy).toHaveBeenCalledOnce();
    });

    it("handles FIND_CARRIER command and returns best carrier", () => {
      vi.spyOn(mockAI, "parse").mockReturnValue({
        type: "FIND_CARRIER",
        origin: "dallas",
        destination: "atlanta",
      });

      const carrierSpy = vi
        .spyOn(mockCarriers, "chooseBestCarrier")
        .mockReturnValue(null);

      const result = service.execute("find carrier from Dallas to Atlanta");

      expect(result.action).toBe("FIND_CARRIER");
      expect(result).toHaveProperty("lane");
      expect(carrierSpy).toHaveBeenCalledOnce();
    });

    it("handles PREDICT_DELAY command and returns ETA risk", () => {
      vi.spyOn(mockAI, "parse").mockReturnValue({
        type: "PREDICT_DELAY",
        shipmentId: "sh_123",
      });

      const etaSpy = vi.spyOn(mockEta, "predict").mockReturnValue({
        estimatedArrivalHours: 4.5,
        delayProbability: 0.22,
        riskBand: "LOW",
      });

      const result = service.execute("predict delay for shipment sh_123");

      expect(result.action).toBe("PREDICT_DELAY");
      expect(result).toHaveProperty("shipmentId", "sh_123");
      expect(result).toHaveProperty("result");
      expect(etaSpy).toHaveBeenCalledOnce();
    });

    it("returns UNKNOWN action with examples for unrecognized command", () => {
      vi.spyOn(mockAI, "parse").mockReturnValue({
        type: "UNKNOWN",
        raw: "do something weird",
      });

      const result = service.execute("do something weird");

      expect(result.action).toBe("UNKNOWN");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("examples");
      expect(Array.isArray((result as { examples: unknown[] }).examples)).toBe(true);
    });

    it("uses default injected services when no overrides provided", () => {
      const defaultService = new OrchestrationService();
      const result = defaultService.execute("price load from dallas to atlanta");

      expect(result.action).toBe("PRICE_LOAD");
    });
  });
});
