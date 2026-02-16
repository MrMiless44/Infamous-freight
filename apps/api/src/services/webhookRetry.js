// apps/api/src/services/webhookRetry.js

const { logger } = require("../middleware/logger");
const axios = require("axios");

class WebhookRetryService {
  /**
   * Enhanced webhook retry with exponential backoff and dead letter queue
   */

  constructor(prisma) {
    this.prisma = prisma;
    this.maxRetries = 5;
    this.initialDelayMs = 1000; // 1 second
    this.maxDelayMs = 3600000; // 1 hour
    this.backoffMultiplier = 2;
  }

  /**
   * Queue webhook for delivery with automatic retry
   */
  async queueWebhook(endpoint, payload, metadata = {}) {
    try {
      // Attempt immediate delivery
      const response = await this.sendWebhook(endpoint, payload);

      logger.info("Webhook delivered successfully", {
        endpoint,
        statusCode: response.status,
        ...metadata,
      });

      return {
        success: true,
        status: "delivered",
        attempt: 0,
        responseStatus: response.status,
      };
    } catch (error) {
      // Failed - queue for retry
      logger.warn("Webhook delivery failed, queuing for retry", {
        endpoint,
        error: error.message,
        ...metadata,
      });

      return this.scheduleRetry(endpoint, payload, 0, metadata);
    }
  }

  /**
   * Schedule retry with exponential backoff
   */
  async scheduleRetry(endpoint, payload, attempt, metadata) {
    if (attempt >= this.maxRetries) {
      logger.error("Webhook failed all retry attempts, moving to dead letter queue", {
        endpoint,
        attempts: attempt,
        ...metadata,
      });

      // Move to dead letter queue
      await this.moveToDeadLetterQueue(endpoint, payload, attempt, metadata);

      return {
        success: false,
        status: "dead-lettered",
        attempt,
        reason: "Max retries exceeded",
      };
    }

    const delayMs = Math.min(
      this.initialDelayMs * Math.pow(this.backoffMultiplier, attempt),
      this.maxDelayMs,
    );

    logger.info("Scheduling webhook retry", {
      endpoint,
      attempt: attempt + 1,
      delayMs,
      ...metadata,
    });

    // Schedule retry after delay
    setTimeout(() => this.retryWebhook(endpoint, payload, attempt + 1, metadata), delayMs);

    return {
      success: false,
      status: "scheduled",
      attempt: attempt + 1,
      nextRetryIn: `${(delayMs / 1000).toFixed(1)}s`,
    };
  }

  /**
   * Retry webhook delivery
   */
  async retryWebhook(endpoint, payload, attempt, metadata) {
    try {
      const response = await this.sendWebhook(endpoint, payload, attempt);

      logger.info("Webhook retry successful", {
        endpoint,
        attempt,
        statusCode: response.status,
        ...metadata,
      });

      return { success: true, status: "delivered", attempt };
    } catch (error) {
      logger.warn("Webhook retry failed", {
        endpoint,
        attempt,
        error: error.message,
        ...metadata,
      });

      // Schedule next retry
      return this.scheduleRetry(endpoint, payload, attempt, metadata);
    }
  }

  /**
   * Send webhook with timeout and error handling
   */
  async sendWebhook(endpoint, payload, attempt = 0) {
    const timeout = 30000; // 30 seconds

    return axios.post(endpoint, payload, {
      timeout,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "InfamousFreight-WebhookService/1.0",
        "X-Webhook-Attempt": attempt + 1,
        "X-Webhook-Signature": this.generateSignature(payload),
      },
      validateStatus: (status) => status >= 200 && status < 300, // Only 2xx is success
    });
  }

  /**
   * Generate HMAC signature for webhook authenticity
   */
  generateSignature(payload) {
    const crypto = require("crypto");
    const secret = process.env.WEBHOOK_SECRET || "default-secret";
    const message = JSON.stringify(payload);

    return crypto.createHmac("sha256", secret).update(message).digest("hex");
  }

  /**
   * Move webhook to dead letter queue after max retries
   */
  async moveToDeadLetterQueue(endpoint, payload, attempts, metadata) {
    try {
      await this.prisma.webhookDeadLetter.create({
        data: {
          endpoint,
          payload: JSON.stringify(payload),
          attempts,
          lastError: "Max retries exceeded",
          metadata: JSON.stringify(metadata),
          status: "failed",
          createdAt: new Date(),
        },
      });
    } catch (error) {
      logger.error("Failed to move webhook to dead letter queue", {
        endpoint,
        error: error.message,
      });
    }
  }

  /**
   * Retry dead lettered webhooks manually
   */
  async retryDeadLetters(limit = 10) {
    try {
      const deadLetters = await this.prisma.webhookDeadLetter.findMany({
        where: { status: "failed" },
        orderBy: { createdAt: "asc" },
        take: limit,
      });

      const results = [];

      for (const dlq of deadLetters) {
        try {
          const payload = JSON.parse(dlq.payload);
          const response = await this.sendWebhook(dlq.endpoint, payload);

          // Success - update status
          await this.prisma.webhookDeadLetter.update({
            where: { id: dlq.id },
            data: { status: "recovered", recoveredAt: new Date() },
          });

          results.push({ id: dlq.id, status: "recovered" });
        } catch (error) {
          // Still failing
          logger.error("Dead letter webhook still failing", {
            dlqId: dlq.id,
            endpoint: dlq.endpoint,
            error: error.message,
          });

          results.push({ id: dlq.id, status: "failed", error: error.message });
        }
      }

      return { retried: deadLetters.length, results };
    } catch (error) {
      logger.error("Failed to retry dead letters", { error: error.message });
      throw error;
    }
  }

  /**
   * Get webhook delivery statistics
   */
  async getWebhookStats() {
    try {
      const total = await this.prisma.webhookDeadLetter.count();
      const failed = await this.prisma.webhookDeadLetter.count({ where: { status: "failed" } });
      const recovered = await this.prisma.webhookDeadLetter.count({
        where: { status: "recovered" },
      });

      return {
        total,
        failed,
        recovered,
        successRate: ((recovered / (recovered + failed)) * 100).toFixed(2),
      };
    } catch (error) {
      logger.error("Failed to get webhook stats", { error: error.message });
      return null;
    }
  }
}

module.exports = { WebhookRetryService };
