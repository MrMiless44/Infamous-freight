import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Use the API version configured in your Stripe account where possible.
  apiVersion: "2024-06-20",
});
