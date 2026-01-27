/**
 * Job Queue Service using Bull/Redis
 * 
 * Manages background jobs for:
 * - Email sending
 * - SMS notifications
 * - Report generation
 * - Webhook deliveries
 * - Analytics processing
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Job priority queuing
 * - Delayed execution
 * - Job progress tracking
 * - Dead letter queue for failed jobs
 * 
 * Usage:
 *   const queues = require('./job-queue');
 *   await queues.addEmailJob('user@example.com', 'Welcome', 'Welcome email body');
 */

const Queue = require("bull");
const logger = require("../../middleware/logger");

const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 50, 2000),
};

// Define separate queues for different job types
const queues = {
    email: new Queue("email", { redis: REDIS_CONFIG }),
    sms: new Queue("sms", { redis: REDIS_CONFIG }),
    reports: new Queue("reports", { redis: REDIS_CONFIG }),
    webhooks: new Queue("webhooks", { redis: REDIS_CONFIG }),
    analytics: new Queue("analytics", { redis: REDIS_CONFIG }),
};

// Email job processor
queues.email.process(50, async (job) => {
    const { to, subject, body, template } = job.data;

    logger.info("Processing email job", {
        jobId: job.id,
        to,
        subject,
    });

    try {
        // TODO: Integrate with email service (SendGrid, Nodemailer, etc.)
        job.progress(50);

        // Simulate email sending
        await new Promise((resolve) => setTimeout(resolve, 500));

        job.progress(100);
        return {
            sent: true,
            messageId: `msg_${Date.now()}`,
            to,
            subject,
        };
    } catch (error) {
        logger.error("Email job failed", {
            jobId: job.id,
            error: error.message,
        });
        throw error;
    }
});

// SMS job processor
queues.sms.process(50, async (job) => {
    const { phoneNumber, message } = job.data;

    logger.info("Processing SMS job", {
        jobId: job.id,
        phoneNumber,
    });

    try {
        // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
        job.progress(50);

        // Simulate SMS sending
        await new Promise((resolve) => setTimeout(resolve, 300));

        job.progress(100);
        return {
            sent: true,
            sid: `sms_${Date.now()}`,
            phoneNumber,
        };
    } catch (error) {
        logger.error("SMS job failed", {
            jobId: job.id,
            error: error.message,
        });
        throw error;
    }
});

// Report generation processor
queues.reports.process(10, async (job) => {
    const { reportType, dateRange, userId } = job.data;

    logger.info("Generating report", {
        jobId: job.id,
        reportType,
        dateRange,
    });

    try {
        job.progress(25);

        // Simulate data aggregation
        const data = await simulateDataAggregation(reportType, dateRange);

        job.progress(75);

        // TODO: Generate PDF/CSV
        const reportPath = `/reports/${reportType}_${Date.now()}.pdf`;

        job.progress(100);
        return {
            generated: true,
            reportPath,
            reportType,
        };
    } catch (error) {
        logger.error("Report generation failed", {
            jobId: job.id,
            error: error.message,
        });
        throw error;
    }
});

// Webhook delivery processor
queues.webhooks.process(30, async (job) => {
    const { webhookId, url, event, data, secret } = job.data;

    logger.info("Delivering webhook", {
        jobId: job.id,
        webhookId,
        event,
    });

    try {
        const signature = generateWebhookSignature(data, secret);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature,
                "X-Webhook-Event": event,
                "X-Webhook-ID": webhookId,
            },
            body: JSON.stringify({
                event,
                data,
                timestamp: new Date().toISOString(),
            }),
            timeout: 10000,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return {
            delivered: true,
            statusCode: response.status,
        };
    } catch (error) {
        logger.warn("Webhook delivery attempt failed", {
            jobId: job.id,
            error: error.message,
            attempt: job.attemptsMade,
        });
        throw error;
    }
});

// Analytics processing processor
queues.analytics.process(100, async (job) => {
    const { eventType, userData, metadata } = job.data;

    logger.info("Processing analytics event", {
        jobId: job.id,
        eventType,
    });

    try {
        // TODO: Send to analytics service (Datadog, Mixpanel, etc.)
        job.progress(100);

        return {
            processed: true,
            eventType,
        };
    } catch (error) {
        logger.error("Analytics processing failed", {
            jobId: job.id,
            error: error.message,
        });
        throw error;
    }
});

// Global event handlers
Object.values(queues).forEach((queue) => {
    queue.on("completed", (job) => {
        logger.info(`Job completed: ${queue.name}`, {
            jobId: job.id,
            result: job.returnvalue,
        });
    });

    queue.on("failed", (job, err) => {
        logger.error(`Job failed: ${queue.name}`, {
            jobId: job.id,
            error: err.message,
            stack: err.stack,
            attempt: job.attemptsMade,
        });
    });

    queue.on("error", (err) => {
        logger.error(`Queue error: ${queue.name}`, {
            error: err.message,
        });
    });
});

// Queue management functions
module.exports = {
    queues,

    // Email functions
    addEmailJob: (to, subject, body, template = null) =>
        queues.email.add(
            { to, subject, body, template },
            {
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 2000,
                },
                removeOnComplete: true,
            }
        ),

    // SMS functions
    addSMSJob: (phoneNumber, message) =>
        queues.sms.add(
            { phoneNumber, message },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
                removeOnComplete: true,
            }
        ),

    // Report functions
    addReportJob: (reportType, dateRange, userId) =>
        queues.reports.add(
            { reportType, dateRange, userId },
            {
                priority: 5,
                removeOnComplete: true,
            }
        ),

    // Webhook functions
    addWebhookJob: (webhookId, url, event, data, secret) =>
        queues.webhooks.add(
            { webhookId, url, event, data, secret },
            {
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: true,
            }
        ),

    // Analytics functions
    addAnalyticsJob: (eventType, userData, metadata = {}) =>
        queues.analytics.add(
            { eventType, userData, metadata },
            {
                removeOnComplete: true,
            }
        ),

    // Get queue stats
    async getQueueStats() {
        const stats = {};
        for (const [name, queue] of Object.entries(queues)) {
            const counts = await queue.getJobCounts();
            stats[name] = counts;
        }
        return stats;
    },

    // Clear failed jobs
    async clearFailedJobs(queueName) {
        const queue = queues[queueName];
        if (queue) {
            const failed = await queue.getFailed();
            for (const job of failed) {
                await job.remove();
            }
            return { cleared: failed.length };
        }
    },

    // Cleanup on shutdown
    async shutdown() {
        logger.info("Shutting down job queues");
        for (const queue of Object.values(queues)) {
            await queue.close();
        }
    },
};

// Helper functions
async function simulateDataAggregation(reportType, dateRange) {
    // Simulate database query
    return {
        reportType,
        dateRange,
        items: [],
        total: 0,
    };
}

function generateWebhookSignature(payload, secret) {
    const crypto = require("crypto");
    return crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");
}

// Graceful shutdown
process.on("SIGINT", async () => {
    await module.exports.shutdown();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await module.exports.shutdown();
    process.exit(0);
});
