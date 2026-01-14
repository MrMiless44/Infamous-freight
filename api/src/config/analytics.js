/**
 * Vercel Web Analytics Configuration
 * Initializes Web Analytics for tracking API usage and performance
 */

const { inject } = require("@vercel/analytics");
const { logger } = require("../middleware/logger");

/**
 * Initialize Vercel Web Analytics
 * This should only be called once in the app
 * Note: This must run in the server/Node.js context
 */
function initializeAnalytics() {
  try {
    // Inject Vercel analytics tracking
    // For Express/Node.js backend, this tracks requests made from the server
    inject({
      mode: process.env.NODE_ENV === "production" ? "production" : "development",
    });
    logger.info("Vercel Web Analytics initialized");
  } catch (error) {
    logger.warn("Failed to initialize Vercel Web Analytics", {
      error: error.message,
    });
  }
}

module.exports = {
  initializeAnalytics,
};
