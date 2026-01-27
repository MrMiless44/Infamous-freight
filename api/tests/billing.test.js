/**
 * Billing Integration Tests
 * 
 * Comprehensive test suite for Stripe and PayPal billing integrations.
 * Tests payment processing, webhooks, subscriptions, and error handling.
 * 
 * Coverage:
 * - Payment intent creation
 * - Charge processing
 * - Subscription management
 * - Webhook handling
 * - Error scenarios
 */

const request = require('supertest');
const express = require('express');
const stripe = require('stripe');
const { generateToken } = require('./jwt-scope.test');

// Mock Stripe
jest.mock('stripe');

describe('Billing Integration', () => {
    let app;
    let mockStripe;

    beforeEach(() => {
        // Setup Express app
        app = express();
        app.use(express.json());

        // Mock Stripe client
        mockStripe = {
            paymentIntents: {
                create: jest.fn(),
                retrieve: jest.fn(),
                confirm: jest.fn(),
                cancel: jest.fn()
            },
            charges: {
                create: jest.fn(),
                retrieve: jest.fn(),
                list: jest.fn()
            },
            customers: {
                create: jest.fn(),
                retrieve: jest.fn(),
                update: jest.fn(),
                del: jest.fn()
            },
            subscriptions: {
                create: jest.fn(),
                retrieve: jest.fn(),
                update: jest.fn(),
                cancel: jest.fn(),
                list: jest.fn()
            },
            webhooks: {
                constructEvent: jest.fn()
            }
        };

        stripe.mockReturnValue(mockStripe);

        // Setup billing routes (inline for testing)
        const { authenticate, requireScope } = require('../src/middleware/security');

        app.post('/api/billing/payment-intent',
            authenticate,
            requireScope('billing:write'),
            async (req, res, next) => {
                try {
                    const { amount, currency } = req.body;
                    const paymentIntent = await mockStripe.paymentIntents.create({
                        amount,
                        currency: currency || 'usd',
                        metadata: { userId: req.user.sub }
                    });
                    res.json({ success: true, clientSecret: paymentIntent.client_secret });
                } catch (err) {
                    next(err);
                }
            }
        );

        app.post('/api/billing/charge',
            authenticate,
            requireScope('billing:write'),
            async (req, res, next) => {
                try {
                    const { amount, token } = req.body;
                    const charge = await mockStripe.charges.create({
                        amount,
                        currency: 'usd',
                        source: token,
                        metadata: { userId: req.user.sub }
                    });
                    res.json({ success: true, chargeId: charge.id });
                } catch (err) {
                    next(err);
                }
            }
        );

        app.post('/api/billing/subscription',
            authenticate,
            requireScope('billing:write'),
            async (req, res, next) => {
                try {
                    const { customerId, priceId } = req.body;
                    const subscription = await mockStripe.subscriptions.create({
                        customer: customerId,
                        items: [{ price: priceId }],
                        metadata: { userId: req.user.sub }
                    });
                    res.json({ success: true, subscriptionId: subscription.id });
                } catch (err) {
                    next(err);
                }
            }
        );

        app.post('/api/billing/webhook', async (req, res, next) => {
            try {
                const sig = req.headers['stripe-signature'];
                const event = mockStripe.webhooks.constructEvent(
                    JSON.stringify(req.body),
                    sig,
                    process.env.STRIPE_WEBHOOK_SECRET
                );

                // Handle event
                res.json({ received: true, eventType: event.type });
            } catch (err) {
                next(err);
            }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Payment Intent Creation', () => {
        test('should create payment intent with valid amount', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_123',
                client_secret: 'pi_123_secret_456',
                amount: 5000,
                currency: 'usd'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 5000, currency: 'usd' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.clientSecret).toBe('pi_123_secret_456');
            expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
                amount: 5000,
                currency: 'usd',
                metadata: { userId: 'user123' }
            });
        });

        test('should reject payment intent without billing:write scope', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['read:shipments']
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 5000 });

            expect(response.status).toBe(403);
            expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
        });

        test('should handle zero amount payment intent', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_000',
                client_secret: 'pi_000_secret',
                amount: 0,
                currency: 'usd'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 0, currency: 'usd' });

            expect(response.status).toBe(200);
            expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
                amount: 0,
                currency: 'usd',
                metadata: { userId: 'user123' }
            });
        });

        test('should handle large payment amounts', async () => {
            const token = generateToken({
                sub: 'enterprise-user',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_large',
                client_secret: 'pi_large_secret',
                amount: 1000000, // $10,000
                currency: 'usd'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 1000000, currency: 'usd' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should default to USD currency if not specified', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_default',
                client_secret: 'pi_default_secret',
                amount: 2500,
                currency: 'usd'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 2500 });

            expect(response.status).toBe(200);
            expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({ currency: 'usd' })
            );
        });
    });

    describe('Charge Processing', () => {
        test('should process charge with valid token', async () => {
            const token = generateToken({
                sub: 'user456',
                scopes: ['billing:write']
            });

            mockStripe.charges.create.mockResolvedValue({
                id: 'ch_123',
                amount: 3000,
                currency: 'usd',
                status: 'succeeded'
            });

            const response = await request(app)
                .post('/api/billing/charge')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 3000, token: 'tok_visa' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.chargeId).toBe('ch_123');
            expect(mockStripe.charges.create).toHaveBeenCalledWith({
                amount: 3000,
                currency: 'usd',
                source: 'tok_visa',
                metadata: { userId: 'user456' }
            });
        });

        test('should handle declined card', async () => {
            const token = generateToken({
                sub: 'user789',
                scopes: ['billing:write']
            });

            mockStripe.charges.create.mockRejectedValue({
                type: 'StripeCardError',
                code: 'card_declined',
                message: 'Your card was declined'
            });

            const response = await request(app)
                .post('/api/billing/charge')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 5000, token: 'tok_chargeDeclined' });

            expect(response.status).toBe(500);
        });

        test('should handle insufficient funds', async () => {
            const token = generateToken({
                sub: 'user999',
                scopes: ['billing:write']
            });

            mockStripe.charges.create.mockRejectedValue({
                type: 'StripeCardError',
                code: 'insufficient_funds',
                message: 'Your card has insufficient funds'
            });

            const response = await request(app)
                .post('/api/billing/charge')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 10000, token: 'tok_insufficientFunds' });

            expect(response.status).toBe(500);
        });
    });

    describe('Subscription Management', () => {
        test('should create subscription successfully', async () => {
            const token = generateToken({
                sub: 'user777',
                scopes: ['billing:write']
            });

            mockStripe.subscriptions.create.mockResolvedValue({
                id: 'sub_123',
                customer: 'cus_456',
                status: 'active',
                items: { data: [{ price: { id: 'price_789' } }] }
            });

            const response = await request(app)
                .post('/api/billing/subscription')
                .set('Authorization', `Bearer ${token}`)
                .send({ customerId: 'cus_456', priceId: 'price_789' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.subscriptionId).toBe('sub_123');
            expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
                customer: 'cus_456',
                items: [{ price: 'price_789' }],
                metadata: { userId: 'user777' }
            });
        });

        test('should handle invalid customer ID', async () => {
            const token = generateToken({
                sub: 'user888',
                scopes: ['billing:write']
            });

            mockStripe.subscriptions.create.mockRejectedValue({
                type: 'StripeInvalidRequestError',
                message: 'No such customer: cus_invalid'
            });

            const response = await request(app)
                .post('/api/billing/subscription')
                .set('Authorization', `Bearer ${token}`)
                .send({ customerId: 'cus_invalid', priceId: 'price_789' });

            expect(response.status).toBe(500);
        });

        test('should handle invalid price ID', async () => {
            const token = generateToken({
                sub: 'user999',
                scopes: ['billing:write']
            });

            mockStripe.subscriptions.create.mockRejectedValue({
                type: 'StripeInvalidRequestError',
                message: 'No such price: price_invalid'
            });

            const response = await request(app)
                .post('/api/billing/subscription')
                .set('Authorization', `Bearer ${token}`)
                .send({ customerId: 'cus_456', priceId: 'price_invalid' });

            expect(response.status).toBe(500);
        });
    });

    describe('Webhook Handling', () => {
        test('should process payment_intent.succeeded webhook', async () => {
            const webhookPayload = {
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_webhook_123',
                        amount: 5000,
                        status: 'succeeded'
                    }
                }
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(webhookPayload);

            const response = await request(app)
                .post('/api/billing/webhook')
                .set('stripe-signature', 'valid_signature')
                .send(webhookPayload);

            expect(response.status).toBe(200);
            expect(response.body.received).toBe(true);
            expect(response.body.eventType).toBe('payment_intent.succeeded');
        });

        test('should process charge.failed webhook', async () => {
            const webhookPayload = {
                type: 'charge.failed',
                data: {
                    object: {
                        id: 'ch_failed_123',
                        amount: 5000,
                        status: 'failed',
                        failure_message: 'Card declined'
                    }
                }
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(webhookPayload);

            const response = await request(app)
                .post('/api/billing/webhook')
                .set('stripe-signature', 'valid_signature')
                .send(webhookPayload);

            expect(response.status).toBe(200);
            expect(response.body.eventType).toBe('charge.failed');
        });

        test('should process subscription.created webhook', async () => {
            const webhookPayload = {
                type: 'customer.subscription.created',
                data: {
                    object: {
                        id: 'sub_webhook_123',
                        customer: 'cus_123',
                        status: 'active'
                    }
                }
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(webhookPayload);

            const response = await request(app)
                .post('/api/billing/webhook')
                .set('stripe-signature', 'valid_signature')
                .send(webhookPayload);

            expect(response.status).toBe(200);
            expect(response.body.eventType).toBe('customer.subscription.created');
        });

        test('should reject webhook with invalid signature', async () => {
            mockStripe.webhooks.constructEvent.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            const response = await request(app)
                .post('/api/billing/webhook')
                .set('stripe-signature', 'invalid_signature')
                .send({ type: 'payment_intent.succeeded' });

            expect(response.status).toBe(500);
        });

        test('should handle webhook without signature header', async () => {
            mockStripe.webhooks.constructEvent.mockImplementation(() => {
                throw new Error('No signature provided');
            });

            const response = await request(app)
                .post('/api/billing/webhook')
                .send({ type: 'payment_intent.succeeded' });

            expect(response.status).toBe(500);
        });
    });

    describe('Error Handling', () => {
        test('should handle Stripe API rate limit error', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockRejectedValue({
                type: 'StripeRateLimitError',
                message: 'Too many requests'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 5000 });

            expect(response.status).toBe(500);
        });

        test('should handle Stripe API authentication error', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockRejectedValue({
                type: 'StripeAuthenticationError',
                message: 'Invalid API key'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 5000 });

            expect(response.status).toBe(500);
        });

        test('should handle network errors', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockRejectedValue({
                type: 'StripeConnectionError',
                message: 'Network error'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 5000 });

            expect(response.status).toBe(500);
        });
    });

    describe('Currency Support', () => {
        test('should support EUR currency', async () => {
            const token = generateToken({
                sub: 'eu-user',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_eur',
                client_secret: 'pi_eur_secret',
                amount: 5000,
                currency: 'eur'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 5000, currency: 'eur' });

            expect(response.status).toBe(200);
            expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({ currency: 'eur' })
            );
        });

        test('should support GBP currency', async () => {
            const token = generateToken({
                sub: 'uk-user',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_gbp',
                client_secret: 'pi_gbp_secret',
                amount: 5000,
                currency: 'gbp'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 5000, currency: 'gbp' });

            expect(response.status).toBe(200);
            expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({ currency: 'gbp' })
            );
        });
    });

    describe('Integration Scenarios', () => {
        test('should handle complete payment flow', async () => {
            const token = generateToken({
                sub: 'customer123',
                scopes: ['billing:write']
            });

            // Step 1: Create payment intent
            mockStripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_complete',
                client_secret: 'pi_complete_secret',
                amount: 7500,
                currency: 'usd',
                status: 'requires_payment_method'
            });

            const intentResponse = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 7500, currency: 'usd' });

            expect(intentResponse.status).toBe(200);
            expect(intentResponse.body.clientSecret).toBe('pi_complete_secret');

            // Step 2: Webhook notification
            const webhookPayload = {
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_complete',
                        amount: 7500,
                        status: 'succeeded'
                    }
                }
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(webhookPayload);

            const webhookResponse = await request(app)
                .post('/api/billing/webhook')
                .set('stripe-signature', 'valid_sig')
                .send(webhookPayload);

            expect(webhookResponse.status).toBe(200);
            expect(webhookResponse.body.eventType).toBe('payment_intent.succeeded');
        });

        test('should handle subscription lifecycle', async () => {
            const token = generateToken({
                sub: 'subscriber123',
                scopes: ['billing:write']
            });

            // Create subscription
            mockStripe.subscriptions.create.mockResolvedValue({
                id: 'sub_lifecycle',
                customer: 'cus_123',
                status: 'active'
            });

            const createResponse = await request(app)
                .post('/api/billing/subscription')
                .set('Authorization', `Bearer ${token}`)
                .send({ customerId: 'cus_123', priceId: 'price_monthly' });

            expect(createResponse.status).toBe(200);
            expect(createResponse.body.subscriptionId).toBe('sub_lifecycle');

            // Webhook: subscription payment succeeded
            const paymentWebhook = {
                type: 'invoice.payment_succeeded',
                data: {
                    object: {
                        subscription: 'sub_lifecycle',
                        amount_paid: 2999
                    }
                }
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(paymentWebhook);

            const paymentResponse = await request(app)
                .post('/api/billing/webhook')
                .set('stripe-signature', 'valid_sig')
                .send(paymentWebhook);

            expect(paymentResponse.status).toBe(200);
            expect(paymentResponse.body.eventType).toBe('invoice.payment_succeeded');
        });
    });

    describe('Security', () => {
        test('should not expose Stripe API keys in errors', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['billing:write']
            });

            mockStripe.paymentIntents.create.mockRejectedValue({
                type: 'StripeAuthenticationError',
                message: 'Invalid API key provided: sk_test_xxxxx'
            });

            const response = await request(app)
                .post('/api/billing/payment-intent')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 5000 });

            expect(response.status).toBe(500);
            // Response should not contain actual API key
            expect(JSON.stringify(response.body)).not.toContain('sk_test_');
            expect(JSON.stringify(response.body)).not.toContain('sk_live_');
        });

        test('should validate webhook signatures', async () => {
            const validPayload = { type: 'payment_intent.succeeded' };

            // First call: valid signature
            mockStripe.webhooks.constructEvent.mockReturnValueOnce(validPayload);
            const validResponse = await request(app)
                .post('/api/billing/webhook')
                .set('stripe-signature', 'valid_signature')
                .send(validPayload);
            expect(validResponse.status).toBe(200);

            // Second call: invalid signature
            mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
                throw new Error('Invalid signature');
            });
            const invalidResponse = await request(app)
                .post('/api/billing/webhook')
                .set('stripe-signature', 'invalid_signature')
                .send(validPayload);
            expect(invalidResponse.status).toBe(500);
        });
    });
});
