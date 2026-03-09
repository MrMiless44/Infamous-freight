import { describe, it, expect } from "vitest";
import { AICommandService } from "./ai-command.service.js";

describe("AICommandService", () => {
  const service = new AICommandService();

  describe("parse", () => {
    describe("PRICE_LOAD intent", () => {
      it("parses a price load command with 'from...to' syntax", () => {
        const result = service.parse("price load from Dallas to Atlanta");

        expect(result.type).toBe("PRICE_LOAD");
        if (result.type === "PRICE_LOAD") {
          expect(result.origin).toBe("dallas");
          expect(result.destination).toBe("atlanta");
        }
      });

      it("parses a quote command with arrow syntax", () => {
        const result = service.parse("quote Dallas -> Atlanta");

        expect(result.type).toBe("PRICE_LOAD");
      });

      it("parses a 'quote' keyword as PRICE_LOAD", () => {
        const result = service.parse("quote from Houston to Memphis");

        expect(result.type).toBe("PRICE_LOAD");
        if (result.type === "PRICE_LOAD") {
          expect(result.origin).toBe("houston");
          expect(result.destination).toBe("memphis");
        }
      });

      it("returns UNKNOWN for 'price' with no lane info", () => {
        const result = service.parse("price this shipment");
        expect(result.type).toBe("UNKNOWN");
      });
    });

    describe("FIND_CARRIER intent", () => {
      it("parses a find carrier command", () => {
        const result = service.parse("find carrier from Dallas to Atlanta");

        expect(result.type).toBe("FIND_CARRIER");
        if (result.type === "FIND_CARRIER") {
          expect(result.origin).toBe("dallas");
          expect(result.destination).toBe("atlanta");
        }
      });

      it("parses a 'book' keyword as FIND_CARRIER", () => {
        const result = service.parse("book carrier from Houston to Memphis");

        expect(result.type).toBe("FIND_CARRIER");
      });

      it("returns UNKNOWN for 'carrier' with no lane info", () => {
        const result = service.parse("carrier list");
        expect(result.type).toBe("UNKNOWN");
      });
    });

    describe("PREDICT_DELAY intent", () => {
      it("parses a predict delay command", () => {
        const result = service.parse("predict delay for shipment sh_123");

        expect(result.type).toBe("PREDICT_DELAY");
        if (result.type === "PREDICT_DELAY") {
          expect(result.shipmentId).toBe("sh_123");
        }
      });

      it("parses shipment ID case-insensitively", () => {
        const result = service.parse("Predict Delay for Shipment SH-456");

        expect(result.type).toBe("PREDICT_DELAY");
        if (result.type === "PREDICT_DELAY") {
          expect(result.shipmentId).toBe("sh-456");
        }
      });

      it("returns UNKNOWN for 'delay' with no shipment reference", () => {
        const result = service.parse("delay is expected");
        expect(result.type).toBe("UNKNOWN");
      });
    });

    describe("UNKNOWN intent", () => {
      it("returns UNKNOWN for unrecognized commands", () => {
        const result = service.parse("what is the weather today?");

        expect(result.type).toBe("UNKNOWN");
        if (result.type === "UNKNOWN") {
          expect(result.raw).toBe("what is the weather today?");
        }
      });

      it("preserves original casing in UNKNOWN raw field", () => {
        const command = "List All Shipments";
        const result = service.parse(command);

        expect(result.type).toBe("UNKNOWN");
        if (result.type === "UNKNOWN") {
          expect(result.raw).toBe(command);
        }
      });

      it("returns UNKNOWN for empty-ish command with only spaces", () => {
        const result = service.parse("   ");
        expect(result.type).toBe("UNKNOWN");
      });
    });
  });
});
