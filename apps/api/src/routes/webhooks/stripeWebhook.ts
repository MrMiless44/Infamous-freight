import type { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe.js";
import { PaymentService } from "../../services/payments/payment.service.js";

const paymentService = new PaymentService();

export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    return res.status(400).send("Missing stripe-signature header");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send("Missing STRIPE_WEBHOOK_SECRET");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Invalid webhook signature", error);
    return res.status(400).send("Invalid webhook signature");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        await paymentService.handleCheckoutCompleted({
          id: session.id,
          payment_status: session.payment_status ?? undefined,
          metadata: (session.metadata ?? {}) as Record<string, string>,
        });

        break;
      }

      default:
        break;
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("stripeWebhook handler error", error);
    return res.status(500).send("Webhook handler failed");
  }
}
