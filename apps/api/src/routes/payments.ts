import { Router } from "express";
import { z } from "zod";
import { PAYMENT_LINKS } from "@infamous-freight/shared";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  createGoDaddyRedirectPayment,
  createStripePaymentIntent,
} from "../services/payment.service.js";

const router = Router();

const createGoDaddyCheckoutSchema = z.object({
  type: z.enum(Object.keys(PAYMENT_LINKS) as [keyof typeof PAYMENT_LINKS, ...Array<keyof typeof PAYMENT_LINKS>]),
  amount: z.number().positive(),
  loadId: z.string().optional(),
});

const createStripeIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("usd"),
  loadId: z.string().optional(),
});

router.post("/godaddy/checkout", requireAuth, async (req, res, next) => {
  try {
    const { tenantId, id: userId } = (req as AuthenticatedRequest).user;
    const body = createGoDaddyCheckoutSchema.parse(req.body);

    if (!tenantId) {
      res.status(400).json({ ok: false, error: "Missing tenant context" });
      return;
    }

    const result = await createGoDaddyRedirectPayment({
      tenantId,
      userId,
      loadId: body.loadId,
      type: body.type,
      amount: body.amount,
    });

    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/stripe/payment-intent", requireAuth, async (req, res, next) => {
  try {
    const { tenantId, id: userId } = (req as AuthenticatedRequest).user;
    const body = createStripeIntentSchema.parse(req.body);

    if (!tenantId) {
      res.status(400).json({ ok: false, error: "Missing tenant context" });
      return;
    }

    const result = await createStripePaymentIntent({
      tenantId,
      userId,
      loadId: body.loadId,
      amount: body.amount,
      currency: body.currency,
    });

    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
