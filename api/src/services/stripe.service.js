/**
 * Stripe Payment Service
 * Handles all Stripe payment operations including subscriptions, invoicing, and webhooks
 */

const Stripe = require("stripe");
const logger = require("../middleware/logger");
const Sentry = require("@sentry/node");
const prisma = require("../db");

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-15",
    maxNetworkRetries: 3,
});

/**
 * Create a payment intent for one-time charges
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function createPaymentIntent({
    amount,
    currency = "usd",
    customer,
    description,
    metadata = {},
}) {
    try {
        logger.info("Creating payment intent", {
            amount,
            currency,
            customer,
            description,
        });

        const intent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            customer,
            description,
            metadata,
            statement_descriptor: "FREIGHT_ENTERPRISE",
            automatic_payment_methods: {
                enabled: true,
            },
        });

        logger.info("Payment intent created", { id: intent.id });
        return intent;
    } catch (error) {
        logger.error("Failed to create payment intent", {
            error: error.message,
            amount,
        });
        Sentry.captureException(error, {
            tags: { service: "stripe", operation: "createPaymentIntent" },
        });
        throw error;
    }
}

/**
 * Create a customer in Stripe
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function createCustomer({ email, name, metadata = {}, userId }) {
    try {
        logger.info("Creating Stripe customer", { email, name, userId });

        const customer = await stripe.customers.create({
            email,
            name,
            metadata: { userId, ...metadata },
        });

        // Store Stripe customer ID in database
        await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id },
        });

        logger.info("Stripe customer created", { customerId: customer.id });
        return customer;
    } catch (error) {
        logger.error("Failed to create Stripe customer", {
            error: error.message,
            userId,
        });
        Sentry.captureException(error, {
            tags: { service: "stripe", operation: "createCustomer" },
            extra: { userId },
        });
        throw error;
    }
}

/**
 * Create a subscription
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function createSubscription({
    customerId,
    priceId,
    trialDays = 14,
    metadata = {},
}) {
    try {
        logger.info("Creating subscription", {
            customerId,
            priceId,
            trialDays,
        });

        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            trial_period_days: trialDays,
            payment_behavior: "default_incomplete",
            expand: ["latest_invoice.payment_intent"],
            metadata,
        });

        logger.info("Subscription created", { id: subscription.id });
        return subscription;
    } catch (error) {
        logger.error("Failed to create subscription", {
            error: error.message,
            customerId,
            priceId,
        });
        Sentry.captureException(error);
        throw error;
    }
}

/**
 * Cancel a subscription
 * @param {string} subscriptionId
 * @returns {Promise<Object>}
 */
async function cancelSubscription(subscriptionId) {
    try {
        logger.info("Cancelling subscription", { subscriptionId });

        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });

        logger.info("Subscription cancelled", { subscriptionId });
        return subscription;
    } catch (error) {
        logger.error("Failed to cancel subscription", {
            error: error.message,
            subscriptionId,
        });
        Sentry.captureException(error);
        throw error;
    }
}

/**
 * Create an invoice
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function createInvoice({ customerId, description, items = [] }) {
    try {
        logger.info("Creating invoice", { customerId, description });

        const invoice = await stripe.invoices.create({
            customer: customerId,
            description,
            collection_method: "send_invoice",
            days_until_due: 30,
        });

        // Add invoice items
        for (const item of items) {
            await stripe.invoiceItems.create({
                customer: customerId,
                invoice: invoice.id,
                amount: Math.round(item.amount * 100),
                currency: "usd",
                description: item.description,
            });
        }

        // Finalize and send
        await stripe.invoices.finalizeInvoice(invoice.id);

        logger.info("Invoice created and sent", { invoiceId: invoice.id });
        return invoice;
    } catch (error) {
        logger.error("Failed to create invoice", {
            error: error.message,
            customerId,
        });
        Sentry.captureException(error);
        throw error;
    }
}

/**
 * Retrieve payment method
 * @param {string} paymentMethodId
 * @returns {Promise<Object>}
 */
async function getPaymentMethod(paymentMethodId) {
    try {
        const method = await stripe.paymentMethods.retrieve(paymentMethodId);
        return method;
    } catch (error) {
        logger.error("Failed to retrieve payment method", {
            error: error.message,
            paymentMethodId,
        });
        throw error;
    }
}

/**
 * List invoices for a customer
 * @param {string} customerId
 * @returns {Promise<Array>}
 */
async function listInvoices(customerId, limit = 10) {
    try {
        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit,
            expand: ["data.payment_intent"],
        });

        return invoices.data;
    } catch (error) {
        logger.error("Failed to list invoices", {
            error: error.message,
            customerId,
        });
        throw error;
    }
}

/**
 * Handle Stripe webhook events
 * @param {string} event - Raw webhook body
 * @param {string} signature - Webhook signature
 * @returns {Promise<void>}
 */
async function handleWebhook(event, signature) {
    try {
        // Verify webhook signature
        const stripeEvent = stripe.webhooks.constructEvent(
            event,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET,
        );

        logger.info("Webhook received", { type: stripeEvent.type });

        switch (stripeEvent.type) {
            case "payment_intent.succeeded":
                await handlePaymentSuccess(stripeEvent.data.object);
                break;

            case "payment_intent.payment_failed":
                await handlePaymentFailed(stripeEvent.data.object);
                break;

            case "customer.subscription.updated":
                await handleSubscriptionUpdated(stripeEvent.data.object);
                break;

            case "customer.subscription.deleted":
                await handleSubscriptionDeleted(stripeEvent.data.object);
                break;

            case "invoice.payment_succeeded":
                await handleInvoicePaid(stripeEvent.data.object);
                break;

            case "invoice.payment_failed":
                await handleInvoiceFailed(stripeEvent.data.object);
                break;

            default:
                logger.warn("Unhandled webhook type", { type: stripeEvent.type });
        }
    } catch (error) {
        logger.error("Webhook processing failed", { error: error.message });
        Sentry.captureException(error, {
            tags: { service: "stripe", operation: "webhook" },
        });
        throw error;
    }
}

/**
 * Handle payment success
 * @param {Object} paymentIntent
 */
async function handlePaymentSuccess(paymentIntent) {
    const customerId = paymentIntent.customer;
    const userId = await getUserIdFromCustomerId(customerId);

    logger.info("Payment succeeded", { userId, customerId });

    // Update user billing status
    await prisma.user.update({
        where: { id: userId },
        data: {
            billingStatus: "active",
            lastPaymentDate: new Date(),
        },
    });

    // Create audit log
    await prisma.auditLog.create({
        data: {
            userId,
            action: "PAYMENT_SUCCEEDED",
            metadata: { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount },
        },
    });
}

/**
 * Handle payment failure
 * @param {Object} paymentIntent
 */
async function handlePaymentFailed(paymentIntent) {
    const customerId = paymentIntent.customer;
    const userId = await getUserIdFromCustomerId(customerId);

    logger.warn("Payment failed", { userId, customerId });

    await prisma.user.update({
        where: { id: userId },
        data: { billingStatus: "payment_failed" },
    });

    Sentry.captureMessage("Stripe payment failed", "warning", {
        extra: { userId, paymentIntentId: paymentIntent.id },
    });
}

/**
 * Handle subscription updated
 * @param {Object} subscription
 */
async function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;
    const userId = await getUserIdFromCustomerId(customerId);

    logger.info("Subscription updated", { userId, status: subscription.status });

    await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
    });
}

/**
 * Handle subscription deleted
 * @param {Object} subscription
 */
async function handleSubscriptionDeleted(subscription) {
    const customerId = subscription.customer;
    const userId = await getUserIdFromCustomerId(customerId);

    logger.info("Subscription cancelled", { userId });

    await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: "cancelled", cancelledAt: new Date() },
    });

    await prisma.user.update({
        where: { id: userId },
        data: { billingStatus: "inactive" },
    });
}

/**
 * Handle invoice paid
 * @param {Object} invoice
 */
async function handleInvoicePaid(invoice) {
    const customerId = invoice.customer;
    const userId = await getUserIdFromCustomerId(customerId);

    logger.info("Invoice paid", { userId, invoiceId: invoice.id });

    await prisma.invoice.update({
        where: { stripeInvoiceId: invoice.id },
        data: { status: "paid", paidAt: new Date() },
    });
}

/**
 * Handle invoice failed
 * @param {Object} invoice
 */
async function handleInvoiceFailed(invoice) {
    const customerId = invoice.customer;
    const userId = await getUserIdFromCustomerId(customerId);

    logger.warn("Invoice payment failed", { userId, invoiceId: invoice.id });

    await prisma.invoice.update({
        where: { stripeInvoiceId: invoice.id },
        data: { status: "failed" },
    });
}

/**
 * Helper: Get user ID from Stripe customer ID
 * @param {string} customerId
 * @returns {Promise<string>}
 */
async function getUserIdFromCustomerId(customerId) {
    const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
    });

    if (!user) {
        throw new Error(`User not found for Stripe customer ${customerId}`);
    }

    return user.id;
}

module.exports = {
    createPaymentIntent,
    createCustomer,
    createSubscription,
    cancelSubscription,
    createInvoice,
    getPaymentMethod,
    listInvoices,
    handleWebhook,
};
