import { Router } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { markPaymentSucceeded } from "../services/payment.service.js";

const router = Router();

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

router.post("/", async (req, res) => {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).json({ ok: false, error: "Stripe webhook is not configured" });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).json({ ok: false, error: "Missing stripe-signature header" });
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const updated = await markPaymentSucceeded({
        stripePaymentIntentId: paymentIntent.id,
        rawEvent: event,
      });

      logger.info(
        {
          eventType: event.type,
          paymentIntentId: paymentIntent.id,
          internalPaymentId: updated?.id,
          tenantId: updated?.tenantId,
        },
        "Stripe payment succeeded; load marked paid and dispatch trigger ready",
      );
    }

    res.json({ received: true });
  } catch (error) {
    logger.error({ err: error }, "Failed to process Stripe webhook");
    res.status(400).json({ ok: false, error: "Invalid webhook request" });
  }
});

export default router;
