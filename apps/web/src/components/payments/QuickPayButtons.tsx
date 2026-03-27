"use client";

import { openPayLink } from "@/lib/payments/openPayLink";

export default function QuickPayButtons() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <button
        className="rounded-2xl border px-4 py-3"
        onClick={() => openPayLink("BOOKING")}
      >
        Pay Booking Fee
      </button>

      <button
        className="rounded-2xl border px-4 py-3"
        onClick={() => openPayLink("DISPATCH")}
      >
        Pay Dispatch Fee
      </button>

      <button
        className="rounded-2xl border px-4 py-3"
        onClick={() => openPayLink("RESERVATION")}
      >
        Pay Reservation Fee
      </button>

      <button
        className="rounded-2xl border px-4 py-3"
        onClick={() => openPayLink("PREMIUM")}
      >
        Upgrade to Premium
      </button>
    </div>
  );
}
