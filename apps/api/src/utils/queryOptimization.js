/**
 * Database Query Optimization Utilities
 * Provides best practices for efficient Prisma queries
 */

/**
 * Batch process queries for better performance
 * Useful for processing large datasets
 */
async function batchQueries(queries, batchSize = 10) {
  const results = [];

  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    try {
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    } catch (err) {
      console.error(`Batch query failed at index ${i}:`, err);
      throw err;
    }
  }

  return results;
}

/**
 * Common optimized query patterns
 */
const OptimizedQueries = {
  /**
   * Get shipment with minimal fields (uses index)
   */
  getShipment: (prisma, id) =>
    prisma.shipment.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
        trackingId: true,
        status: true,
        origin: true,
        destination: true,
        driverId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

  /**
   * Get shipment with driver info
   */
  getShipmentWithDriver: (prisma, id) =>
    prisma.shipment.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
        status: true,
        createdAt: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
      },
    }),

  /**
   * Get active shipments (paginated)
   */
  getActiveShipments: (prisma, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return Promise.all([
      prisma.shipment.count({ where: { status: { not: "completed" } } }),
      prisma.shipment.findMany({
        where: { status: { not: "completed" } },
        select: {
          id: true,
          reference: true,
          status: true,
          driverId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]).then(([total, data]) => ({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }));
  },

  /**
   * Get shipments by status with aggregation
   */
  getShipmentStats: (prisma) =>
    prisma.shipment.groupBy({
      by: ["status"],
      _count: true,
      orderBy: { _count: { status: "desc" } },
    }),

  /**
   * Get shipments created in last N days
   */
  getRecentShipments: (prisma, days = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.shipment.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        reference: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get driver performance metrics
   */
  getDriverMetrics: (prisma, driverId) =>
    Promise.all([
      prisma.shipment.count({ where: { driverId } }),
      prisma.shipment.count({
        where: {
          driverId,
          status: "delivered",
        },
      }),
      prisma.shipment.findMany({
        where: { driverId },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
    ]).then(([total, delivered, recent]) => ({
      totalShipments: total,
      deliveredShipments: delivered,
      completionRate: total > 0 ? ((delivered / total) * 100).toFixed(2) + "%" : "0%",
      lastShipmentDate: recent[0]?.createdAt || null,
    })),

  /**
   * Get payment aggregations
   */
  getPaymentStats: (prisma) =>
    prisma.payment
      .aggregate({
        _count: true,
        _sum: { amount: true },
        where: { status: "succeeded" },
      })
      .then((result) => ({
        totalTransactions: result._count,
        totalRevenue: result._sum.amount || 0,
        averageTransaction: result._count > 0 ? (result._sum.amount / result._count).toFixed(2) : 0,
      })),
};

/**
 * Helper to generate efficient WHERE clauses
 */
function buildWhereClause(filters) {
  const where = {};

  // Filter by status
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      where.status = { in: filters.status };
    } else {
      where.status = filters.status;
    }
  }

  // Filter by date range
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }

  // Filter by reference (search)
  if (filters.search) {
    where.reference = { contains: filters.search, mode: "insensitive" };
  }

  return where;
}

/**
 * Connection pooling configuration recommendation
 * Add to DATABASE_URL: ?connection_limit=20
 *
 * Example:
 * postgresql://user:pass@host/db?schema=public&connection_limit=20
 */
const PoolingRecommendations = {
  development: "connection_limit=5",
  staging: "connection_limit=10",
  production: "connection_limit=20",
};

module.exports = {
  batchQueries,
  OptimizedQueries,
  buildWhereClause,
  PoolingRecommendations,
};
