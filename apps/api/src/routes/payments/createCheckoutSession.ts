import type { Request, Response } from "express";
import { PaymentService } from "../../services/payments/payment.service.js";

const paymentService = new PaymentService();

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    // Replace with your real auth / org context
    const orgId = req.headers["x-org-id"] as string;
    const userId = req.headers["x-user-id"] as string | undefined;

    if (!orgId) {
      return res.status(400).json({ error: "Missing org context" });
    }

    const { loadId, amountCents, customerEmail, paymentType } = req.body;

    if (!loadId || !amountCents || !paymentType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await paymentService.createCheckoutSession({
      orgId,
      userId,
      loadId,
      amountCents,
      customerEmail,
      paymentType,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("createCheckoutSession error", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
