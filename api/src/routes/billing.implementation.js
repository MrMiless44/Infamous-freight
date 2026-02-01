/**
 * Stripe Billing Routes
 * Endpoints for payment processing, subscriptions, and billing management
 */

const express = require("express");
const router = express.Router();
const {
    authenticate,
    requireScope,
    limiters,
    auditLog,
} = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const stripeService = require("../services/stripe.service");
const logger = require("../middleware/logger");
const Sentry = require("@sentry/node");
const { ApiResponse, HTTP_STATUS } = require("@infamous-freight/shared");

// Rate limiter for billing operations (stricter due to payment sensitivity)
const billingLimiter = limiters.billing;

/**
 * POST /api/billing/create-payment-intent
 * Create a payment intent for one-time payment
 */
router.post(
    "/create-payment-intent",
    billingLimiter,
    authenticate,
    requireScope("billing:payment"),
    auditLog,
    [
        validateString("amount"),
        validateString("description"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { amount, description, metadata } = req.body;
            const userId = req.user.sub;

            logger.info("Creating payment intent", {
                userId,
                amount,
                description,
            });

            // Get or create Stripe customer
            let user = await prisma.user.findUnique({
                where: { id: userId },
            });

            let stripeCustomerId = user.stripeCustomerId;

            if (!stripeCustomerId) {
                const customer = await stripeService.createCustomer({
                    email: user.email,
                    name: user.name,
                    userId,
                });
                stripeCustomerId = customer.id;
            }

            // Create payment intent
            const intent = await stripeService.createPaymentIntent({
                amount: parseFloat(amount),
                customer: stripeCustomerId,
                description,
                metadata: { userId, ...metadata },
            });

            res.status(HTTP_STATUS.CREATED).json(
                new ApiResponse({
                    success: true,
                    data: {
                        clientSecret: intent.client_secret,
                        paymentIntentId: intent.id,
                        amount: intent.amount,
                        currency: intent.currency,
                    },
                }),
            );
        } catch (error) {
            next(error);
        }
    },
);

/**
 * POST /api/billing/create-subscription
 * Create a subscription plan
 */
router.post(
    "/create-subscription",
    billingLimiter,
    authenticate,
    requireScope("billing:subscription"),
    auditLog,
    [
        validateString("priceId"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { priceId, trialDays = 14 } = req.body;
            const userId = req.user.sub;

            logger.info("Creating subscription", {
                userId,
                priceId,
                trialDays,
            });

            // Get user
            let user = await prisma.user.findUnique({
                where: { id: userId },
            });

            let stripeCustomerId = user.stripeCustomerId;

            if (!stripeCustomerId) {
                const customer = await stripeService.createCustomer({
                    email: user.email,
                    name: user.name,
                    userId,
                });
                stripeCustomerId = customer.id;
            }

            // Create subscription
            const subscription = await stripeService.createSubscription({
                customerId: stripeCustomerId,
                priceId,
                trialDays,
                metadata: { userId },
            });

            // Store subscription in database
            await prisma.subscription.create({
                data: {
                    userId,
                    stripeSubscriptionId: subscription.id,
                    stripePriceId: priceId,
                    status: subscription.status,
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    trialEndsAt: subscription.trial_end
                        ? new Date(subscription.trial_end * 1000)
                        : null,
                },
            });

            res.status(HTTP_STATUS.CREATED).json(
                new ApiResponse({
                    success: true,
                    data: {
                        subscriptionId: subscription.id,
                        status: subscription.status,
                        priceId: subscription.items.data[0].price.id,
                        currentPeriodEnd: new Date(
                            subscription.current_period_end * 1000,
                        ),
                    },
                }),
            );
        } catch (error) {
            next(error);
        }
    },
);

/**
 * POST /api/billing/cancel-subscription
 * Cancel a subscription (effective at period end)
 */
router.post(
    "/cancel-subscription",
    billingLimiter,
    authenticate,
    requireScope("billing:subscription"),
    auditLog,
    [
        validateString("subscriptionId"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { subscriptionId } = req.body;
            const userId = req.user.sub;

            logger.info("Cancelling subscription", {
                userId,
                subscriptionId,
            });

            // Verify subscription belongs to user
            const subscription = await prisma.subscription.findUnique({
                where: { stripeSubscriptionId: subscriptionId },
            });

            if (!subscription || subscription.userId !== userId) {
                return res.status(HTTP_STATUS.FORBIDDEN).json(
                    new ApiResponse({
                        success: false,
                        error: "Unauthorized",
                    }),
                );
            }

            // Cancel subscription
            const cancelled = await stripeService.cancelSubscription(subscriptionId);

            res.json(
                new ApiResponse({
                    success: true,
                    data: {
                        subscriptionId: cancelled.id,
                        status: cancelled.status,
                        cancelAtPeriodEnd: cancelled.cancel_at_period_end,
                    },
                }),
            );
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/billing/invoices
 * Get user's invoices
 */
router.get(
    "/invoices",
    billingLimiter,
    authenticate,
    requireScope("billing:read"),
    auditLog,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const { limit = 10 } = req.query;

            logger.info("Fetching invoices", { userId });

            // Get user
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user.stripeCustomerId) {
                return res.json(
                    new ApiResponse({
                        success: true,
                        data: [],
                    }),
                );
            }

            // Get invoices from Stripe
            const invoices = await stripeService.listInvoices(
                user.stripeCustomerId,
                parseInt(limit),
            );

            const formattedInvoices = invoices.map((inv) => ({
                id: inv.id,
                amount: inv.total,
                status: inv.status,
                created: new Date(inv.created * 1000),
                dueDate: inv.due_date ? new Date(inv.due_date * 1000) : null,
                paidAt: inv.paid_at ? new Date(inv.paid_at * 1000) : null,
                description: inv.description,
                downloadUrl: inv.invoice_pdf,
            }));

            res.json(
                new ApiResponse({
                    success: true,
                    data: formattedInvoices,
                }),
            );
        } catch (error) {
            next(error);
        }
    },
);

/**
 * POST /api/billing/webhook
 * Stripe webhook endpoint
 * Must be publicly accessible
 */
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res, next) => {
        try {
            const signature = req.headers["stripe-signature"];

            if (!signature) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    error: "Missing stripe signature",
                });
            }

            // Handle webhook
            await stripeService.handleWebhook(req.body, signature);

            res.json({ received: true });
        } catch (error) {
            logger.error("Webhook error", { error: error.message });
            Sentry.captureException(error);
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: error.message,
            });
        }
    },
);

/**
 * GET /api/billing/subscription
 * Get current subscription status
 */
router.get(
    "/subscription",
    billingLimiter,
    authenticate,
    requireScope("billing:read"),
    auditLog,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;

            logger.info("Fetching subscription", { userId });

            const subscription = await prisma.subscription.findFirst({
                where: {
                    userId,
                    status: { not: "cancelled" },
                },
            });

            if (!subscription) {
                return res.status(HTTP_STATUS.NOT_FOUND).json(
                    new ApiResponse({
                        success: false,
                        error: "No active subscription",
                    }),
                );
            }

            res.json(
                new ApiResponse({
                    success: true,
                    data: {
                        id: subscription.stripeSubscriptionId,
                        status: subscription.status,
                        priceId: subscription.stripePriceId,
                        currentPeriodEnd: subscription.currentPeriodEnd,
                        trialEndsAt: subscription.trialEndsAt,
                        createdAt: subscription.createdAt,
                    },
                }),
            );
        } catch (error) {
            next(error);
        }
    },
);

module.exports = router;
