export type PaymentProvider = "godaddy" | "stripe";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentType =
  | "booking"
  | "dispatch"
  | "reservation"
  | "subscription";

export interface CreateCheckoutSessionInput {
  orgId: string;
  userId?: string;
  loadId: string;
  amountCents: number;
  customerEmail?: string;
  paymentType: PaymentType;
}

export interface PaymentRecord {
  id: string;
  orgId: string;
  userId?: string | null;
  loadId?: string | null;
  provider: PaymentProvider;
  paymentType: PaymentType;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  externalReference?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
