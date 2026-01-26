export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export enum EnforcementLevel {
  Notice = "notice",
  Restriction = "restriction",
  Suspension = "suspension",
  Termination = "termination",
}

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
