type CreateCheckoutSessionPayload = {
  loadId: string;
  amountCents: number;
  customerEmail?: string;
  paymentType: "booking" | "dispatch" | "reservation" | "subscription";
};

export async function createCheckoutSession(payload: CreateCheckoutSessionPayload) {
  const res = await fetch("/api/payments/checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create checkout session");
  }

  return (await res.json()) as { url: string };
}
