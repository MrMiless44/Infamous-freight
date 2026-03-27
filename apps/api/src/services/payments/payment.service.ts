import crypto from "node:crypto";
import { stripe } from "../../lib/stripe.js";
import { PaymentRepository } from "../../repositories/payment.repository.js";

const paymentRepository = new PaymentRepository();

export class PaymentService {
  async createCheckoutSession(input: {
    orgId: string;
    userId?: string;
    loadId: string;
    amountCents: number;
    customerEmail?: string;
    paymentType: "booking" | "dispatch" | "reservation" | "subscription";
  }) {
    const paymentId = crypto.randomUUID();

    await paymentRepository.createPayment({
      id: paymentId,
      orgId: input.orgId,
      userId: input.userId ?? null,
      loadId: input.loadId,
      provider: "stripe",
      paymentType: input.paymentType,
      amountCents: input.amountCents,
      currency: "usd",
      status: "pending",
      externalReference: paymentId,
      metadata: {
        source: "checkout-session",
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Infamous Freight ${input.paymentType} payment`,
              description: `Load ${input.loadId}`,
            },
            unit_amount: input.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/payments/cancel`,
      metadata: {
        orgId: input.orgId,
        userId: input.userId ?? "",
        loadId: input.loadId,
        paymentId,
        paymentType: input.paymentType,
      },
    });

    return session;
  }

  async handleCheckoutCompleted(session: {
    id: string;
    payment_status?: string;
    metadata?: Record<string, string>;
  }) {
    const paymentId = session.metadata?.paymentId;
    const loadId = session.metadata?.loadId;

    if (!paymentId) {
      throw new Error("Missing paymentId in Stripe session metadata");
    }

    await paymentRepository.markPaidByExternalReference(paymentId);

    await paymentRepository.createPaymentEvent({
      paymentId,
      provider: "stripe",
      eventType: "checkout.session.completed",
      externalEventId: session.id,
      payload: session,
    });

    if (loadId) {
      await paymentRepository.linkLoadToPayment(loadId, paymentId);
    }

    // Add your actual domain actions here:
    // - mark load paid
    // - emit audit log
    // - send notifications
    // - assign carrier if business rules allow

    return { ok: true };
  }
}
