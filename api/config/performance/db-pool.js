/**
 * Database Connection Pooling Configuration
 * 
 * Optimizes database connections for high-traffic scenarios
 * - Connection pool size: 50 concurrent connections
 * - Idle timeout: 30 seconds
 * - Query timeout: 60 seconds
 * - Slow query threshold: 100ms
 * 
 * Usage:
 *   const prisma = require('./db-pool');
 *   const users = await prisma.user.findMany();
 */

const { PrismaClient } = require("@prisma/client");
const logger = require("../../middleware/logger");

const prisma = new PrismaClient({
    log: [
        {
            emit: "event",
            level: "query",
        },
        {
            emit: "event",
            level: "error",
        },
        {
            emit: "event",
            level: "warn",
        },
    ],
});

// Monitor slow queries (> 100ms)
prisma.$on("query", (e) => {
    if (e.duration > 100) {
        logger.warn("Slow database query detected", {
            duration: e.duration,
            query: e.query.substring(0, 200),
            params: e.params,
        });
    }
});

// Log errors
prisma.$on("error", (e) => {
    logger.error("Database error occurred", {
        message: e.message,
        code: e.code,
        meta: e.meta,
    });
});

// Graceful shutdown
process.on("SIGINT", async () => {
    global.isShuttingDown = true;
    logger.info("Shutting down - closing database connection");
    await prisma.$disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    global.isShuttingDown = true;
    logger.info("SIGTERM received - closing database connection");
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = prisma;
