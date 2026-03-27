"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/lib/payments/createCheckoutSession";

type Props = {
  loadId: string;
  amountCents: number;
  customerEmail?: string;
};

export default function PayAndBookLoadButton({
  loadId,
  amountCents,
  customerEmail,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);

      const { url } = await createCheckoutSession({
        loadId,
        amountCents,
        customerEmail,
        paymentType: "booking",
      });

      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="rounded-2xl border px-4 py-3"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? "Opening Checkout..." : "Pay & Book Load"}
    </button>
  );
}
