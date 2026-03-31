import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })
  : null;

export function getStripeOrThrow(): Stripe {
  if (!stripeClient) {
    throw new Error("Stripe is not configured. Missing STRIPE_SECRET_KEY.");
  }

  return stripeClient;
}

export function getOptionalStripe(): Stripe | null {
  return stripeClient;
}
