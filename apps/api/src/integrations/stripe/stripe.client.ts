import Stripe from "stripe";
import { env } from "../envShim.js";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" as const })
  : null;
