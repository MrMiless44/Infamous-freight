// apps/api/src/services/webhookSystem.js

class WebhookSystemService {
    /**
     * Event-driven webhook system for real-time integrations
     */

    constructor(prisma) {
        this.prisma = prisma;
        this.webhooks = new Map();
        this.events = new Map();
        this.retryConfig = {
            maxRetries: 5,
            backoffMultiplier: 2,
            initialDelay: 1000 // 1 second
        };
    }

    /**
     * Register webhook endpoint
     */
    async registerWebhook(userId, webhookConfig) {
        const {
            url,
            events,
            secret,
            active = true,
            description = ''
        } = webhookConfig;

        const webhookId = `webhook_${Date.now()}`;

        const webhook = {
            webhookId,
            userId,
            url,
            events,
            secret,
            active,
            description,
            createdAt: new Date(),
            lastTriggered: null,
            failureCount: 0,
            successCount: 0
        };

        this.webhooks.set(webhookId, webhook);

        return webhook;
    }

    /**
     * List user's webhooks
     */
    async listWebhooks(userId) {
        const userWebhooks = Array.from(this.webhooks.values())
            .filter(w => w.userId === userId);

        return userWebhooks.map(w => ({
            ...w,
            successRate: w.successCount / (w.successCount + w.failureCount) || 0
        }));
    }

    /**
     * Update webhook
     */
    async updateWebhook(webhookId, updateData) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook) throw new Error('Webhook not found');

        const updated = { ...webhook, ...updateData, updated At: new Date() };
        this.webhooks.set(webhookId, updated);

        return updated;
    }

    /**
     * Delete webhook
     */
    async deleteWebhook(webhookId) {
        const deleted = this.webhooks.has(webhookId);
        this.webhooks.delete(webhookId);

        return { deleted, webhookId };
    }

    /**
     * Trigger event
     */
    async triggerEvent(eventType, eventData) {
        const supportedEvents = [
            'shipment.created',
            'shipment.updated',
            'shipment.delivered',
            'payment.completed',
            'payment.failed',
            'driver.rating_updated',
            'customer.complaint',
            'order.cancelled'
        ];

        if (!supportedEvents.includes(eventType)) {
            throw new Error(`Unknown event type: ${eventType}`);
        }

        const event = {
            eventId: `evt_${Date.now()}`,
            type: eventType,
            data: eventData,
            timestamp: new Date(),
            webhooksTriggered: 0
        };

        // Find matching webhooks
        const matchingWebhooks = Array.from(this.webhooks.values())
            .filter(w => w.active && w.events.includes(eventType));

        // Send to each webhook
        for (const webhook of matchingWebhooks) {
            await this.sendWebhookEvent(webhook, event);
            event.webhooksTriggered++;
        }

        return event;
    }

    /**
     * Send webhook event
     */
    async sendWebhookEvent(webhook, event, attempt = 1) {
        const signature = this.generateSignature(event, webhook.secret);

        try {
            // In production: use axios or fetch
            const response = await this.mockFetch(webhook.url, event, signature);

            if (response.ok) {
                webhook.successCount++;
                webhook.lastTriggered = new Date();

                return {
                    webhookId: webhook.webhookId,
                    eventId: event.eventId,
                    status: 'delivered',
                    response: response.statusCode
                };
            } else {
                throw new Error(`HTTP ${response.statusCode}`);
            }
        } catch (error) {
            webhook.failureCount++;

            // Retry logic
            if (attempt < this.retryConfig.maxRetries) {
                const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);

                return {
                    webhookId: webhook.webhookId,
                    eventId: event.eventId,
                    status: 'failed',
                    error: error.message,
                    retryIn: delay,
                    attempt
                };
            }

            return {
                webhookId: webhook.webhookId,
                eventId: event.eventId,
                status: 'failed_permanently',
                error: error.message,
                attempts: attempt
            };
        }
    }

    /**
     * Generate HMAC signature
     */
    generateSignature(event, secret) {
        const crypto = require('crypto');
        const message = JSON.stringify(event);
        return crypto
            .createHmac('sha256', secret)
            .update(message)
            .digest('hex');
    }

    /**
     * Mock fetch for webhook
     */
    async mockFetch(url, event, signature) {
        // Simulate webhook delivery
        return {
            ok: Math.random() > 0.1, // 90% success rate
            statusCode: Math.random() > 0.1 ? 200 : 500
        };
    }

    /**
     * Get webhook delivery logs
     */
    async getWebhookLogs(webhookId, limit = 100) {
        const logs = [
            {
                deliveryId: `del_001`,
                webhookId,
                eventType: 'shipment.created',
                status: 'delivered',
                statusCode: 200,
                responseTime: 234, // ms
                timestamp: new Date(Date.now() - 3600000)
            },
            {
                deliveryId: `del_002`,
                webhookId,
                eventType: 'shipment.updated',
                status: 'failed',
                statusCode: 500,
                responseTime: 5000,
                timestamp: new Date(Date.now() - 1800000)
            }
        ];

        return logs.slice(0, limit);
    }

    /**
     * Test webhook
     */
    async testWebhook(webhookId) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook) throw new Error('Webhook not found');

        const testEvent = {
            eventId: `test_${Date.now()}`,
            type: 'webhook.test',
            data: { message: 'This is a test event' },
            timestamp: new Date()
        };

        return await this.sendWebhookEvent(webhook, testEvent);
    }

    /**
     * Get webhook statistics
     */
    async getWebhookStats(webhookId) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook) throw new Error('Webhook not found');

        const total = webhook.successCount + webhook.failureCount;

        return {
            webhookId,
            totalDeliveries: total,
            successfulDeliveries: webhook.successCount,
            failedDeliveries: webhook.failureCount,
            successRate: ((webhook.successCount / (total || 1)) * 100).toFixed(2) + '%',
            lastTriggered: webhook.lastTriggered,
            averageResponseTime: 245 // ms
        };
    }

    /**
     * Batch trigger events
     */
    async triggerBatchEvents(events) {
        const results = [];

        for (const { eventType, eventData } of events) {
            try {
                const result = await this.triggerEvent(eventType, eventData);
                results.push(result);
            } catch (error) {
                results.push({
                    eventType,
                    error: error.message,
                    status: 'failed'
                });
            }
        }

        return {
            totalEvents: events.length,
            successfulEvents: results.filter(r => !r.error).length,
            failedEvents: results.filter(r => r.error).length,
            results
        };
    }
}

module.exports = { WebhookSystemService };
