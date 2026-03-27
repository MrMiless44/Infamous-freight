"use client";

import { useMemo, useState } from "react";
import type { PaymentLinkType } from "@infamous-freight/shared";
import { openPayment } from "../lib/payments";

type PaymentStatus = "pending" | "paid";

type PaymentBadge = {
  key: PaymentLinkType;
  label: string;
  status: PaymentStatus;
};

const actions: Array<{ key: PaymentLinkType; label: string }> = [
  { key: "BOOKING", label: "Pay & Book Load" },
  { key: "DISPATCH", label: "Dispatch Service Fee" },
  { key: "RESERVATION", label: "Load Reservation Fee" },
  { key: "PREMIUM", label: "Upgrade to Premium" },
];

export function PaymentActions() {
  const [selectedAction, setSelectedAction] = useState<PaymentLinkType | null>(null);

  const badges = useMemo<PaymentBadge[]>(
    () =>
      actions.map((action) => ({
        key: action.key,
        label: action.label,
        status: selectedAction === action.key ? "pending" : "paid",
      })),
    [selectedAction],
  );

  return (
    <section style={{ marginTop: 18, padding: 16, border: "1px solid #333", borderRadius: 16 }}>
      <b>Payments</b>
      <p style={{ margin: 0, opacity: 0.85 }}>Use GoDaddy payment links for instant checkout.</p>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            style={{ padding: 10, textAlign: "left", cursor: "pointer" }}
            onClick={() => {
              setSelectedAction(action.key);
              openPayment(action.key);
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {badges.map((badge) => (
          <span
            key={badge.key}
            style={{
              border: "1px solid #555",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 12,
              background: badge.status === "pending" ? "#3f2f00" : "#0f3a1f",
            }}
          >
            {badge.label}: {badge.status.toUpperCase()}
          </span>
        ))}
      </div>
    </section>
  );
}
