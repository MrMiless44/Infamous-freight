import { describe, it, expect } from "vitest";
import {
  zTenantId,
  zCreateShipment,
  zCreateLoad,
  zAICommand,
} from "./zod.js";

describe("zTenantId", () => {
  it("accepts a valid tenant ID of 3+ characters", () => {
    expect(zTenantId.safeParse("abc").success).toBe(true);
    expect(zTenantId.safeParse("tenant_001").success).toBe(true);
  });

  it("rejects strings shorter than 3 characters", () => {
    expect(zTenantId.safeParse("").success).toBe(false);
    expect(zTenantId.safeParse("ab").success).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(zTenantId.safeParse(123).success).toBe(false);
    expect(zTenantId.safeParse(null).success).toBe(false);
    expect(zTenantId.safeParse(undefined).success).toBe(false);
  });
});

describe("zCreateShipment", () => {
  const valid = {
    tenantId: "tenant_1",
    ref: "SHP-001",
    originCity: "Dallas",
    originState: "TX",
    destCity: "Atlanta",
    destState: "GA",
    weightLb: 500,
    rateCents: 120000,
  };

  it("accepts a fully valid shipment", () => {
    expect(zCreateShipment.safeParse(valid).success).toBe(true);
  });

  it("accepts rateCents of 0 (free shipment)", () => {
    expect(zCreateShipment.safeParse({ ...valid, rateCents: 0 }).success).toBe(true);
  });

  it("rejects negative rateCents", () => {
    expect(zCreateShipment.safeParse({ ...valid, rateCents: -1 }).success).toBe(false);
  });

  it("rejects zero or negative weightLb", () => {
    expect(zCreateShipment.safeParse({ ...valid, weightLb: 0 }).success).toBe(false);
    expect(zCreateShipment.safeParse({ ...valid, weightLb: -10 }).success).toBe(false);
  });

  it("rejects non-integer weightLb", () => {
    expect(zCreateShipment.safeParse({ ...valid, weightLb: 500.5 }).success).toBe(false);
  });

  it("rejects ref shorter than 3 characters", () => {
    expect(zCreateShipment.safeParse({ ...valid, ref: "AB" }).success).toBe(false);
  });

  it("rejects city/state shorter than 2 characters", () => {
    expect(zCreateShipment.safeParse({ ...valid, originCity: "D" }).success).toBe(false);
    expect(zCreateShipment.safeParse({ ...valid, originState: "T" }).success).toBe(false);
    expect(zCreateShipment.safeParse({ ...valid, destCity: "A" }).success).toBe(false);
    expect(zCreateShipment.safeParse({ ...valid, destState: "G" }).success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { ref: _ignored, ...missingRef } = valid;
    expect(zCreateShipment.safeParse(missingRef).success).toBe(false);

    const { tenantId: _ignored2, ...missingTenant } = valid;
    expect(zCreateShipment.safeParse(missingTenant).success).toBe(false);
  });
});

describe("zCreateLoad", () => {
  const valid = {
    tenantId: "tenant_1",
    originCity: "Houston",
    originState: "TX",
    destCity: "Memphis",
    destState: "TN",
    distanceMi: 490,
    weightLb: 1000,
    rateCents: 75000,
  };

  it("accepts a fully valid load", () => {
    expect(zCreateLoad.safeParse(valid).success).toBe(true);
  });

  it("rejects non-positive distanceMi", () => {
    expect(zCreateLoad.safeParse({ ...valid, distanceMi: 0 }).success).toBe(false);
    expect(zCreateLoad.safeParse({ ...valid, distanceMi: -100 }).success).toBe(false);
  });

  it("rejects non-integer distanceMi", () => {
    expect(zCreateLoad.safeParse({ ...valid, distanceMi: 490.5 }).success).toBe(false);
  });

  it("rejects non-positive weightLb", () => {
    expect(zCreateLoad.safeParse({ ...valid, weightLb: 0 }).success).toBe(false);
  });

  it("accepts rateCents of 0", () => {
    expect(zCreateLoad.safeParse({ ...valid, rateCents: 0 }).success).toBe(true);
  });

  it("rejects missing tenantId", () => {
    const { tenantId: _ignored, ...missing } = valid;
    expect(zCreateLoad.safeParse(missing).success).toBe(false);
  });
});

describe("zAICommand", () => {
  const valid = {
    tenantId: "tenant_1",
    input: "price load from Dallas to Atlanta",
  };

  it("accepts a minimal valid AI command", () => {
    expect(zAICommand.safeParse(valid).success).toBe(true);
  });

  it("accepts an AI command with optional context", () => {
    // context is z.record(z.any()) - test with an empty record
    const withContext = {
      ...valid,
      context: {},
    };
    expect(zAICommand.safeParse(withContext).success).toBe(true);
  });

  it("rejects empty input string", () => {
    expect(zAICommand.safeParse({ ...valid, input: "" }).success).toBe(false);
  });

  it("rejects missing input", () => {
    const { input: _ignored, ...missing } = valid;
    expect(zAICommand.safeParse(missing).success).toBe(false);
  });

  it("rejects short tenantId", () => {
    expect(zAICommand.safeParse({ ...valid, tenantId: "ab" }).success).toBe(false);
  });

  it("context is optional and defaults to undefined when omitted", () => {
    const result = zAICommand.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.context).toBeUndefined();
    }
  });
});
