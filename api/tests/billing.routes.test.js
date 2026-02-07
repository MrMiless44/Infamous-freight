/**
 * Billing Route Tests
 *
 * Ensures Stripe customer IDs are persisted on first use.
 */

const request = require("supertest");
const express = require("express");

jest.mock("../src/middleware/security", () => ({
    authenticate: (req, res, next) => {
        req.user = { sub: "user-1", scopes: ["billing:payment", "billing:subscription"] };
        next();
    },
    requireScope: () => (req, res, next) => next(),
    limiters: { billing: (req, res, next) => next() },
    auditLog: (req, res, next) => next(),
}));

jest.mock("../src/services/stripe.service", () => ({
    createCustomer: jest.fn(),
    createPaymentIntent: jest.fn(),
    createSubscription: jest.fn(),
}));

jest.mock("../src/db", () => ({
    user: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    subscription: {
        create: jest.fn(),
    },
}));

const stripeService = require("../src/services/stripe.service");
const prisma = require("../src/db");
const billingRouter = require("../src/routes/billing.implementation");

describe("Billing route behavior", () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use("/api/billing", billingRouter);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("persists Stripe customer ID during payment intent creation", async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            name: "User One",
            stripeCustomerId: null,
        });
        prisma.user.update.mockResolvedValue({
            id: "user-1",
            stripeCustomerId: "cus_123",
        });
        stripeService.createCustomer.mockResolvedValue({ id: "cus_123" });
        stripeService.createPaymentIntent.mockResolvedValue({
            id: "pi_123",
            client_secret: "secret_123",
            amount: 1500,
            currency: "usd",
        });

        const response = await request(app)
            .post("/api/billing/create-payment-intent")
            .send({ amount: "15.00", description: "Test" });

        expect(response.status).toBe(201);
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: "user-1" },
            data: { stripeCustomerId: "cus_123" },
        });
    });

    test("does not update Stripe customer ID when already present", async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            name: "User One",
            stripeCustomerId: "cus_existing",
        });
        stripeService.createSubscription.mockResolvedValue({
            id: "sub_123",
            status: "active",
            items: { data: [{ price: { id: "price_123" } }] },
            current_period_end: 1710000000,
            trial_end: null,
        });
        prisma.subscription.create.mockResolvedValue({ id: "sub_123" });

        const response = await request(app)
            .post("/api/billing/create-subscription")
            .send({ priceId: "price_123" });

        expect(response.status).toBe(201);
        expect(prisma.user.update).not.toHaveBeenCalled();
        expect(stripeService.createSubscription).toHaveBeenCalledWith({
            customerId: "cus_existing",
            priceId: "price_123",
            trialDays: 14,
            metadata: { userId: "user-1" },
        });
    });
});
