export type ShipmentStatus =
  | "created"
  | "scheduled"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "exception";

export interface ShipmentSummary {
  id: string;
  tenantId: string;
  referenceNumber: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  pickupDate?: string | null;
  deliveryDate?: string | null;
}
