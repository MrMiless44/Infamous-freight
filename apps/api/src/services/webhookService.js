/**
 * Webhook Service & Event Handler
 * Manages subscriptions, event queuing, and delivery
 * Handles: Load events, bid events, assignment events
 */

const axios = require("axios");
const crypto = require("crypto");
const logger = require("../middleware/logger");

class WebhookService {
    constructor() {
        this.subscriptions = new Map(); // userId:event -> subscription
        this.eventQueue = [];
        this.retryConfig = {
            maxRetries: 5,
            initialDelay: 1000, // 1 second
            maxDelay: 60000, // 1 minute
        };
        this.processingInterval = 5000; // Process queue every 5s
        this.startProcessing();
    }

    /**
     * Register webhook subscription
     * Events: loads:new, loads:updated, bid:received, driver:assigned
     */
    async subscribe(userId, event, targetUrl) {
        try {
            if (!["loads:new", "loads:updated", "bid:received", "driver:assigned"].includes(event)) {
                throw new Error(`Invalid event type: ${event}`);
            }

            // Validate URL is reachable with test webhook
            await this.testWebhook(targetUrl);

            const subscription = {
                id: crypto.randomUUID(),
                userId,
                event,
                targetUrl,
                active: true,
                secret: crypto.randomBytes(32).toString("hex"),
                createdAt: new Date(),
                failureCount: 0,
            };

            const key = `${userId}:${event}`;
            this.subscriptions.set(key, subscription);

            logger.info("Webhook: Subscription created", {
                userId,
                event,
                subscriptionId: subscription.id,
            });

            return subscription;
        } catch (err) {
            logger.error("Webhook: Subscription failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Emit webhook event
     * Queues for async delivery with retries
     */
    emit(event, userId, data) {
        try {
            const key = `${userId}:${event}`;
            const subscription = this.subscriptions.get(key);

            if (!subscription || !subscription.active) {
                logger.debug("Webhook: No active subscription", { userId, event });
                return;
            }

            const webhookEvent = {
                id: crypto.randomUUID(),
                event,
                userId,
                subscription,
                data,
                timestamp: new Date(),
                retries: 0,
            };

            this.eventQueue.push(webhookEvent);

            logger.debug("Webhook: Event queued", {
                event,
                userId,
                eventId: webhookEvent.id,
            });
        } catch (err) {
            logger.error("Webhook: Emit failed", { error: err.message });
        }
    }

    /**
     * Process queued webhook events
     * Sends with retries and exponential backoff
     */
    async processQueue() {
        while (this.eventQueue.length > 0) {
            const webhookEvent = this.eventQueue.shift();

            try {
                await this.deliverWebhook(webhookEvent);
            } catch (err) {
                logger.error("Webhook: Delivery failed", {
                    eventId: webhookEvent.id,
                    error: err.message,
                    retries: webhookEvent.retries,
                });

                if (webhookEvent.retries < this.retryConfig.maxRetries) {
                    // Re-queue with backoff
                    const delay = Math.min(
                        this.retryConfig.maxDelay,
                        this.retryConfig.initialDelay * Math.pow(2, webhookEvent.retries)
                    );

                    webhookEvent.retries++;
                    webhookEvent.nextRetry = Date.now() + delay;
                    this.eventQueue.push(webhookEvent);
                } else {
                    logger.error("Webhook: Max retries exceeded", {
                        eventId: webhookEvent.id,
                        targetUrl: webhookEvent.subscription.targetUrl,
                    });
                }
            }
        }
    }

    /**
     * Deliver webhook to target URL with signature
     */
    async deliverWebhook(webhookEvent) {
        const { subscription, event, data, timestamp, id } = webhookEvent;

        // Create signature for verification
        const payload = JSON.stringify({
            id,
            event,
            data,
            timestamp: timestamp.toISOString(),
        });

        const signature = crypto
            .createHmac("sha256", subscription.secret)
            .update(payload)
            .digest("hex");

        try {
            logger.debug("Webhook: Delivering", {
                event,
                targetUrl: subscription.targetUrl,
            });

            const response = await axios.post(subscription.targetUrl, JSON.parse(payload), {
                headers: {
                    "Content-Type": "application/json",
                    "X-Webhook-Signature": signature,
                    "X-Webhook-Event": event,
                    "X-Webhook-Id": id,
                },
                timeout: 10000, // 10 second timeout
            });

            if (response.status >= 200 && response.status < 300) {
                logger.info("Webhook: Delivered successfully", {
                    event,
                    userId: subscription.userId,
                    targetUrl: subscription.targetUrl,
                });

                // Reset failure count on success
                subscription.failureCount = 0;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (err) {
            subscription.failureCount++;

            // Disable subscription after 10 consecutive failures
            if (subscription.failureCount >= 10) {
                subscription.active = false;
                logger.warn("Webhook: Subscription disabled due to repeated failures", {
                    event: subscription.event,
                    userId: subscription.userId,
                });
            }

            throw err;
        }
    }

    /**
     * Test webhook URL is reachable
     */
    async testWebhook(targetUrl) {
        try {
            const testPayload = {
                event: "test",
                data: { test: true },
                timestamp: new Date().toISOString(),
            };

            const response = await axios.post(targetUrl, testPayload, {
                timeout: 5000,
                headers: {
                    "X-Webhook-Event": "test",
                },
            });

            if (response.status >= 200 && response.status < 300) {
                logger.debug("Webhook: Test successful", { targetUrl });
                return true;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (err) {
            logger.error("Webhook: Test failed", { targetUrl, error: err.message });
            throw err;
        }
    }

    /**
     * Start background processing
     */
    startProcessing() {
        this.processingTimer = setInterval(() => {
            this.processQueue().catch((err) => {
                logger.error("Webhook: Processing error", { error: err.message });
            });
        }, this.processingInterval);

        logger.info("Webhook: Processing started", {
            interval: this.processingInterval,
        });
    }

    /**
     * Stop background processing
     */
    stopProcessing() {
        if (this.processingTimer) {
            clearInterval(this.processingTimer);
            logger.info("Webhook: Processing stopped");
        }
    }

    /**
     * Get subscription for user
     */
    getSubscription(userId, event) {
        const key = `${userId}:${event}`;
        return this.subscriptions.get(key);
    }

    /**
     * Unsubscribe from event
     */
    unsubscribe(userId, event) {
        const key = `${userId}:${event}`;
        const subscription = this.subscriptions.get(key);

        if (subscription) {
            this.subscriptions.delete(key);
            logger.info("Webhook: Unsubscribed", { userId, event });
            return true;
        }

        return false;
    }

    /**
     * Get all subscriptions for user
     */
    getUserSubscriptions(userId) {
        const subscriptions = [];

        for (const [key, sub] of this.subscriptions) {
            if (key.startsWith(`${userId}:`)) {
                subscriptions.push(sub);
            }
        }

        return subscriptions;
    }

    /**
     * Get queue status
     */
    getStatus() {
        return {
            queueLength: this.eventQueue.length,
            subscriptionCount: this.subscriptions.size,
            uptime: process.uptime(),
        };
    }
}

// Export singleton
module.exports = new WebhookService();
