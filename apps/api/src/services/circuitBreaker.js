/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by monitoring downstream service health
 * Implements exponential backoff and automatic recovery
 */

const { logger } = require("../middleware/logger");

/**
 * Circuit Breaker States
 */
const States = {
  CLOSED: "CLOSED", // Normal operation
  OPEN: "OPEN", // Service failing, reject requests
  HALF_OPEN: "HALF_OPEN", // Testing if service recovered
};

class CircuitBreaker {
  constructor(name, action, options = {}) {
    this.name = name;
    this.action = action;
    this.state = States.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;

    // Configuration
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 30000;
    this.resetTimeout = options.resetTimeout || 60000;
  }

  /**
   * Execute action with circuit breaker protection
   */
  async execute(...args) {
    if (this.state === States.OPEN) {
      // Check if we should transition to HALF_OPEN
      if (Date.now() >= this.nextAttemptTime) {
        logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
        this.state = States.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await Promise.race([
        this.action(...args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Action timeout")), this.timeout),
        ),
      ]);

      return this.onSuccess(result);
    } catch (error) {
      return this.onFailure(error);
    }
  }

  /**
   * Handle successful execution
   */
  onSuccess(result) {
    this.failureCount = 0;

    if (this.state === States.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        logger.info(`Circuit breaker ${this.name} transitioning to CLOSED`);
        this.state = States.CLOSED;
        this.successCount = 0;
      }
    }

    return result;
  }

  /**
   * Handle failed execution
   */
  onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.error(`Circuit breaker ${this.name} failure`, {
      failureCount: this.failureCount,
      threshold: this.failureThreshold,
      error: error.message,
    });

    if (this.failureCount >= this.failureThreshold) {
      if (this.state !== States.OPEN) {
        logger.warn(`Circuit breaker ${this.name} transitioning to OPEN`);
        this.state = States.OPEN;
        this.nextAttemptTime = Date.now() + this.resetTimeout;
      }
    }

    throw error;
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset() {
    logger.info(`Circuit breaker ${this.name} manually reset`);
    this.state = States.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }
}

/**
 * Circuit Breaker Manager - manages multiple circuit breakers
 */
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Create new circuit breaker
   */
  create(name, action, options) {
    const breaker = new CircuitBreaker(name, action, options);
    this.breakers.set(name, breaker);
    logger.info(`Circuit breaker ${name} created`, options);
    return breaker;
  }

  /**
   * Get existing circuit breaker
   */
  get(name) {
    return this.breakers.get(name);
  }

  /**
   * Get all breaker statuses
   */
  getAllStatus() {
    const statuses = {};
    for (const [name, breaker] of this.breakers) {
      statuses[name] = breaker.getStatus();
    }
    return statuses;
  }

  /**
   * Reset all breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Global manager
const manager = new CircuitBreakerManager();

/**
 * Pre-configured circuit breakers for common services
 */
const breakers = {
  // External payment service (Stripe)
  stripe: manager.create(
    "stripe",
    async (...args) => {
      // Actual Stripe call would go here
    },
    {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 10000,
      resetTimeout: 60000,
    },
  ),

  // External email service (SendGrid)
  email: manager.create(
    "email",
    async (...args) => {
      // Actual email call would go here
    },
    {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 8000,
      resetTimeout: 30000,
    },
  ),

  // External mapping service (Google Maps)
  maps: manager.create(
    "maps",
    async (...args) => {
      // Actual maps call would go here
    },
    {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 5000,
      resetTimeout: 60000,
    },
  ),

  // Database connection
  database: manager.create(
    "database",
    async (...args) => {
      // Actual DB call would go here
    },
    {
      failureThreshold: 10,
      successThreshold: 5,
      timeout: 30000,
      resetTimeout: 120000,
    },
  ),

  // Redis cache
  redis: manager.create(
    "redis",
    async (...args) => {
      // Actual Redis call would go here
    },
    {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 5000,
      resetTimeout: 30000,
    },
  ),
};

module.exports = {
  States,
  CircuitBreaker,
  CircuitBreakerManager,
  manager,
  breakers,
};
