import { describe, expect, it, vi } from "vitest";

type BillingEventRecord = {
  status: "PENDING" | "COMPLETED" | "FAILED";
  result: unknown;
};

type PrismaMock = {
  billingEvent: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

async function loadStore(prismaMock: PrismaMock) {
  vi.resetModules();
  vi.doMock("../db/prisma.js", () => ({
    getPrisma: () => prismaMock,
  }));

  return import("./billingEventStore.js");
}

function makePrismaMock() {
  return {
    billingEvent: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  } satisfies PrismaMock;
}

describe("billingEventStore", () => {
  it("returns new state when event is created", async () => {
    const prismaMock = makePrismaMock();
    prismaMock.billingEvent.create.mockResolvedValue({ status: "PENDING", result: null });

    const { beginBillingEvent } = await loadStore(prismaMock);

    const result = await beginBillingEvent("org_1", "INVOICE_GENERATE", "key-1", { month: "2026-04" });

    expect(result).toEqual({ type: "new" });
    expect(prismaMock.billingEvent.create).toHaveBeenCalledTimes(1);
  });

  it("returns completed state for duplicate completed event", async () => {
    const prismaMock = makePrismaMock();
    prismaMock.billingEvent.create.mockRejectedValue({ code: "P2002" });
    prismaMock.billingEvent.findUnique.mockResolvedValue({
      status: "COMPLETED",
      result: { invoiceId: "inv_1" },
    } satisfies BillingEventRecord);

    const { beginBillingEvent } = await loadStore(prismaMock);

    const result = await beginBillingEvent<{ invoiceId: string }>(
      "org_1",
      "INVOICE_GENERATE",
      "key-2",
      { month: "2026-04" },
    );

    expect(result).toEqual({ type: "completed", result: { invoiceId: "inv_1" } });
  });

  it("returns pending state for duplicate in-flight event", async () => {
    const prismaMock = makePrismaMock();
    prismaMock.billingEvent.create.mockRejectedValue({ code: "P2002" });
    prismaMock.billingEvent.findUnique.mockResolvedValue({
      status: "PENDING",
      result: null,
    } satisfies BillingEventRecord);

    const { beginBillingEvent } = await loadStore(prismaMock);

    const result = await beginBillingEvent("org_1", "SUBSCRIPTION_CREATE", "key-3");

    expect(result).toEqual({ type: "pending" });
  });

  it("disables persistence when billing_events table is missing", async () => {
    const prismaMock = makePrismaMock();
    prismaMock.billingEvent.create.mockRejectedValue({ code: "P2021" });

    const { beginBillingEvent, completeBillingEvent, failBillingEvent } = await loadStore(prismaMock);

    const beginState = await beginBillingEvent("org_1", "INVOICE_GENERATE", "key-4");
    expect(beginState).toEqual({ type: "disabled" });

    await expect(completeBillingEvent("key-4", { ok: true })).resolves.toBeUndefined();
    await expect(failBillingEvent("key-4", "boom")).resolves.toBeUndefined();

    expect(prismaMock.billingEvent.update).not.toHaveBeenCalled();
  });
});
