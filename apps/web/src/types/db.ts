export type UserRole =
  | "admin"
  | "dispatcher"
  | "shipper"
  | "carrier"
  | "owner_operator";
export type LoadStatus =
  | "draft"
  | "open"
  | "booked"
  | "in_transit"
  | "delivered"
  | "cancelled";
export type BidStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type Profile = {
  id: string;
  role: UserRole;
  display_name: string | null;
  phone: string | null;
  company_id: string | null;
  is_verified: boolean;
};

export type Load = {
  id: string;
  shipper_id: string;
  title: string | null;
  equipment_required: string | null;
  weight_lbs: number | null;
  rate_cents: number | null;
  currency: string;
  status: LoadStatus;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  pickup_at: string | null;
  delivery_at: string | null;
  notes: string | null;
  created_at: string;
};

export type Bid = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount_cents: number;
  status: BidStatus;
  message: string | null;
  created_at: string;
};
