import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY environment variable. Please set it in your environment configuration.",
  );
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-01-27.acacia",
});
