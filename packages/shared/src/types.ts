export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ShipmentStatus =
  | 'CREATED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Shipment {
  id: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  weightKg: number;
  createdAt: string;
}

export enum PaymentEventType {
  CHARGEBACK = "CHARGEBACK",
}

export interface PaymentEvent {
  id: string;
  type: PaymentEventType;
  userId: string;
  payload: Record<string, unknown>;
}
