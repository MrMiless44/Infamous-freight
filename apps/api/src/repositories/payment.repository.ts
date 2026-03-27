type CreatePaymentParams = {
  id: string;
  orgId: string;
  userId?: string | null;
  loadId?: string | null;
  provider: "godaddy" | "stripe";
  paymentType: string;
  amountCents: number;
  currency: string;
  status: string;
  externalReference?: string | null;
  metadata?: Record<string, unknown>;
};

export class PaymentRepository {
  async createPayment(params: CreatePaymentParams) {
    // Replace with Prisma or your db client
    return params;
  }

  async markPaidByExternalReference(externalReference: string) {
    // Replace with Prisma/db update
    return { externalReference, status: "paid" };
  }

  async createPaymentEvent(params: {
    paymentId?: string;
    provider: string;
    eventType: string;
    externalEventId?: string;
    payload: unknown;
  }) {
    // Replace with Prisma/db insert
    return params;
  }

  async linkLoadToPayment(loadId: string, paymentId: string) {
    return { loadId, paymentId };
  }

  async findByExternalReference(externalReference: string) {
    return {
      id: "mock-payment-id",
      externalReference,
      status: "pending",
    };
  }
}
