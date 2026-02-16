/**
 * Cohort Analysis & Segmentation Service
 *
 * Customer behavior analysis and targeted insights
 *
 * Features:
 * - Customer cohort creation (by signup, activity, spending)
 * - Lifetime value (LTV) calculation
 * - Churn prediction and analysis
 * - Retention analysis (cohort retention curves)
 * - Feature adoption tracking
 * - Behavioral segmentation
 * - RFM analysis (Recency, Frequency, Monetary)
 * - Lookalike audience creation
 *
 * Target Performance:
 * - Cohorts created: 50+
 * - Segmentation accuracy: 90%
 * - Actionable insights ratio: 80%
 */

const prisma = require("../lib/prisma");
const { logger } = require("../middleware/logger");

/**
 * Cohort types
 */
const COHORT_TYPES = {
    SIGNUP_DATE: "signup_date", // By registration date
    FIRST_ORDER: "first_order", // By first purchase date
    SPENDING_TIER: "spending_tier", // By spending level
    ACTIVITY_LEVEL: "activity_level", // By usage frequency
    GEOGRAPHIC: "geographic", // By location
    BEHAVIORAL: "behavioral", // By behavior patterns
    CUSTOM: "custom", // Custom criteria
};

/**
 * RFM score ranges
 */
const RFM_SCORES = {
    RECENCY: { min: 1, max: 5 }, // 5 = most recent
    FREQUENCY: { min: 1, max: 5 }, // 5 = most frequent
    MONETARY: { min: 1, max: 5 }, // 5 = highest value
};

/**
 * Customer segments based on RFM
 */
const CUSTOMER_SEGMENTS = {
    CHAMPIONS: { r: [4, 5], f: [4, 5], m: [4, 5], description: "Best customers" },
    LOYAL: { r: [3, 5], f: [3, 5], m: [3, 5], description: "Consistent purchasers" },
    POTENTIAL_LOYALIST: {
        r: [3, 5],
        f: [1, 3],
        m: [1, 3],
        description: "Recent customers with potential",
    },
    NEW_CUSTOMERS: { r: [4, 5], f: [1, 1], m: [1, 1], description: "Recent first-time buyers" },
    PROMISING: { r: [3, 4], f: [1, 1], m: [1, 1], description: "New with good potential" },
    NEEDS_ATTENTION: {
        r: [2, 3],
        f: [2, 3],
        m: [2, 3],
        description: "Below average, needs engagement",
    },
    AT_RISK: { r: [1, 2], f: [3, 5], m: [3, 5], description: "Was valuable, now inactive" },
    HIBERNATING: { r: [1, 2], f: [1, 2], m: [1, 2], description: "Lowest activity" },
    LOST: { r: [1, 1], f: [4, 5], m: [4, 5], description: "Lost high-value customers" },
};

/**
 * Cohort Analysis Engine
 */
class CohortAnalyzer {
    constructor() {
        this.cohortCache = new Map();
        this.cacheTTL = 3600000; // 1 hour cache
    }

    /**
     * Create cohort based on criteria
     */
    async createCohort(cohortDefinition) {
        const startTime = Date.now();

        try {
            const { name, type, criteria, dateRange } = cohortDefinition;

            // Build query based on cohort type
            let customers;
            switch (type) {
                case COHORT_TYPES.SIGNUP_DATE:
                    customers = await this.getCohortBySignupDate(criteria, dateRange);
                    break;

                case COHORT_TYPES.FIRST_ORDER:
                    customers = await this.getCohortByFirstOrder(criteria, dateRange);
                    break;

                case COHORT_TYPES.SPENDING_TIER:
                    customers = await this.getCohortBySpending(criteria);
                    break;

                case COHORT_TYPES.ACTIVITY_LEVEL:
                    customers = await this.getCohortByActivity(criteria);
                    break;

                case COHORT_TYPES.GEOGRAPHIC:
                    customers = await this.getCohortByGeography(criteria);
                    break;

                case COHORT_TYPES.BEHAVIORAL:
                    customers = await this.getCohortByBehavior(criteria);
                    break;

                default:
                    throw new Error(`Unknown cohort type: ${type}`);
            }

            // Save cohort definition
            const cohort = await prisma.customerCohort.create({
                data: {
                    name,
                    type,
                    criteria,
                    customer_count: customers.length,
                    customer_ids: customers.map((c) => c.id),
                    date_range: dateRange,
                    created_at: new Date(),
                },
            });

            const processingTime = Date.now() - startTime;
            logger.info("Cohort created", {
                cohortId: cohort.id,
                customerCount: customers.length,
                processingTime,
            });

            return {
                cohort,
                customers,
                statistics: await this.calculateCohortStats(customers),
                processingTime,
            };
        } catch (error) {
            logger.error("Failed to create cohort", { error: error.message });
            throw error;
        }
    }

    /**
     * Calculate customer lifetime value (LTV)
     */
    async calculateLTV(userId, predictionMonths = 12) {
        try {
            // Get customer's historical purchases
            const orders = await prisma.shipments.findMany({
                where: {
                    user_id: userId,
                    status: { in: ["delivered", "completed"] },
                },
                select: {
                    total_cost: true,
                    created_at: true,
                },
                orderBy: { created_at: "asc" },
            });

            if (orders.length === 0) {
                return { ltv: 0, avgOrderValue: 0, orderFrequency: 0, prediction: 0 };
            }

            // Calculate metrics
            const totalRevenue = orders.reduce((sum, o) => sum + (o.total_cost || 0), 0);
            const avgOrderValue = totalRevenue / orders.length;

            // Calculate order frequency (orders per month)
            const firstOrder = new Date(orders[0].created_at);
            const lastOrder = new Date(orders[orders.length - 1].created_at);
            const monthsActive = Math.max(1, (lastOrder - firstOrder) / (1000 * 60 * 60 * 24 * 30));
            const orderFrequency = orders.length / monthsActive;

            // Historical LTV
            const historicalLTV = totalRevenue;

            // Predict future LTV
            const predictedOrders = orderFrequency * predictionMonths;
            const predictedRevenue = predictedOrders * avgOrderValue;
            const predictedLTV = historicalLTV + predictedRevenue;

            // Calculate churn probability
            const daysSinceLastOrder = (new Date() - lastOrder) / (1000 * 60 * 60 * 24);
            const churnProbability = this.calculateChurnProbability(daysSinceLastOrder, orderFrequency);

            logger.info("LTV calculated", { userId, ltv: predictedLTV });

            return {
                ltv: Math.round(predictedLTV * 100) / 100,
                historicalLTV: Math.round(historicalLTV * 100) / 100,
                avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                orderFrequency: Math.round(orderFrequency * 100) / 100,
                totalOrders: orders.length,
                monthsActive: Math.round(monthsActive * 10) / 10,
                prediction: Math.round(predictedRevenue * 100) / 100,
                churnProbability: Math.round(churnProbability * 100) / 100,
            };
        } catch (error) {
            logger.error("Failed to calculate LTV", { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Perform RFM analysis
     */
    async performRFMAnalysis(userIds = null) {
        const startTime = Date.now();

        try {
            // Get all customers or specific subset
            const whereClause = userIds ? { id: { in: userIds } } : { role: "customer" };
            const customers = await prisma.users.findMany({
                where: whereClause,
                include: {
                    shipments: {
                        where: { status: { in: ["delivered", "completed"] } },
                    },
                },
            });

            // Calculate RFM scores for each customer
            const rfmData = [];
            const now = new Date();

            for (const customer of customers) {
                if (customer.shipments.length === 0) continue;

                // Recency: days since last order
                const lastOrder = new Date(
                    Math.max(...customer.shipments.map((s) => new Date(s.created_at).getTime())),
                );
                const daysSinceLastOrder = Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24));

                // Frequency: number of orders
                const frequency = customer.shipments.length;

                // Monetary: total spending
                const monetary = customer.shipments.reduce((sum, s) => sum + (s.total_cost || 0), 0);

                rfmData.push({
                    userId: customer.id,
                    email: customer.email,
                    recency: daysSinceLastOrder,
                    frequency,
                    monetary,
                });
            }

            // Score RFM dimensions (1-5 scale)
            const scoredData = this.scoreRFM(rfmData);

            // Segment customers
            const segmentedData = scoredData.map((customer) => ({
                ...customer,
                segment: this.assignSegment(customer.rScore, customer.fScore, customer.mScore),
            }));

            // Group by segment
            const segmentSummary = this.summarizeSegments(segmentedData);

            const processingTime = Date.now() - startTime;
            logger.info("RFM analysis completed", {
                customerCount: segmentedData.length,
                processingTime,
            });

            return {
                data: segmentedData,
                summary: segmentSummary,
                timestamp: new Date(),
                processingTime,
            };
        } catch (error) {
            logger.error("Failed to perform RFM analysis", { error: error.message });
            throw error;
        }
    }

    /**
     * Analyze customer retention
     */
    async analyzeRetention(cohortId, periodMonths = 12) {
        try {
            // Get cohort definition
            const cohort = await prisma.customerCohort.findUnique({
                where: { id: cohortId },
            });

            if (!cohort) {
                throw new Error("Cohort not found");
            }

            // Analyze retention for each period
            const retentionData = [];
            const cohortStartDate = new Date(cohort.date_range.start);

            for (let month = 0; month < periodMonths; month++) {
                const periodStart = new Date(cohortStartDate);
                periodStart.setMonth(periodStart.getMonth() + month);

                const periodEnd = new Date(periodStart);
                periodEnd.setMonth(periodEnd.getMonth() + 1);

                // Count active customers in this period
                const activeCount = await prisma.shipments.count({
                    where: {
                        user_id: { in: cohort.customer_ids },
                        created_at: {
                            gte: periodStart,
                            lt: periodEnd,
                        },
                    },
                    distinct: ["user_id"],
                });

                const retentionRate = (activeCount / cohort.customer_count) * 100;

                retentionData.push({
                    month,
                    periodStart,
                    periodEnd,
                    activeCustomers: activeCount,
                    retentionRate: Math.round(retentionRate * 100) / 100,
                });
            }

            logger.info("Retention analysis completed", { cohortId, periods: periodMonths });

            return {
                cohortId,
                cohortSize: cohort.customer_count,
                retentionCurve: retentionData,
                avgRetention:
                    retentionData.reduce((sum, d) => sum + d.retentionRate, 0) / retentionData.length,
            };
        } catch (error) {
            logger.error("Failed to analyze retention", { cohortId, error: error.message });
            throw error;
        }
    }

    /**
     * Create lookalike audience
     */
    async createLookalikeAudience(seedUserIds, similarityThreshold = 0.7) {
        try {
            // Get profiles of seed users
            const seedProfiles = await this.getUserProfiles(seedUserIds);

            // Calculate average profile characteristics
            const avgProfile = this.calculateAverageProfile(seedProfiles);

            // Find similar users
            const allCustomers = await prisma.users.findMany({
                where: {
                    role: "customer",
                    id: { notIn: seedUserIds },
                },
            });

            const lookalikes = [];
            for (const customer of allCustomers) {
                const profile = await this.getUserProfile(customer.id);
                const similarity = this.calculateSimilarity(profile, avgProfile);

                if (similarity >= similarityThreshold) {
                    lookalikes.push({
                        userId: customer.id,
                        email: customer.email,
                        similarity: Math.round(similarity * 100) / 100,
                    });
                }
            }

            // Sort by similarity
            lookalikes.sort((a, b) => b.similarity - a.similarity);

            logger.info("Lookalike audience created", {
                seedUsers: seedUserIds.length,
                lookalikes: lookalikes.length,
            });

            return {
                seedUsers: seedUserIds,
                lookalikes,
                avgProfile,
                threshold: similarityThreshold,
            };
        } catch (error) {
            logger.error("Failed to create lookalike audience", { error: error.message });
            throw error;
        }
    }

    // ==================== Helper Methods ====================

    /**
     * Get cohort by signup date
     */
    async getCohortBySignupDate(criteria, dateRange) {
        return await prisma.users.findMany({
            where: {
                role: "customer",
                created_at: {
                    gte: new Date(dateRange.start),
                    lte: new Date(dateRange.end),
                },
            },
        });
    }

    /**
     * Get cohort by first order date
     */
    async getCohortByFirstOrder(criteria, dateRange) {
        const shipments = await prisma.shipments.groupBy({
            by: ["user_id"],
            where: {
                created_at: {
                    gte: new Date(dateRange.start),
                    lte: new Date(dateRange.end),
                },
            },
            _min: { created_at: true },
        });

        const userIds = shipments.map((s) => s.user_id);
        return await prisma.users.findMany({ where: { id: { in: userIds } } });
    }

    /**
     * Get cohort by spending tier
     */
    async getCohortBySpending(criteria) {
        const { minSpending, maxSpending } = criteria;

        // Calculate total spending per user
        const spending = await prisma.shipments.groupBy({
            by: ["user_id"],
            where: { status: { in: ["delivered", "completed"] } },
            _sum: { total_cost: true },
        });

        const userIds = spending
            .filter((s) => s._sum.total_cost >= minSpending && s._sum.total_cost <= maxSpending)
            .map((s) => s.user_id);

        return await prisma.users.findMany({ where: { id: { in: userIds } } });
    }

    /**
     * Get cohort by activity level
     */
    async getCohortByActivity(criteria) {
        const { minOrders, maxOrders } = criteria;

        const orderCounts = await prisma.shipments.groupBy({
            by: ["user_id"],
            _count: { id: true },
        });

        const userIds = orderCounts
            .filter((o) => o._count.id >= minOrders && o._count.id <= maxOrders)
            .map((o) => o.user_id);

        return await prisma.users.findMany({ where: { id: { in: userIds } } });
    }

    /**
     * Get cohort by geography
     */
    async getCohortByGeography(criteria) {
        // Mock implementation - extend based on actual geography data
        return await prisma.users.findMany({
            where: { role: "customer" },
            take: 100,
        });
    }

    /**
     * Get cohort by behavior
     */
    async getCohortByBehavior(criteria) {
        // Mock implementation - extend based on actual behavior tracking
        return await prisma.users.findMany({
            where: { role: "customer" },
            take: 100,
        });
    }

    /**
     * Calculate cohort statistics
     */
    async calculateCohortStats(customers) {
        const customerIds = customers.map((c) => c.id);

        const totalOrders = await prisma.shipments.count({
            where: { user_id: { in: customerIds } },
        });

        const totalRevenue = await prisma.shipments.aggregate({
            where: {
                user_id: { in: customerIds },
                status: { in: ["delivered", "completed"] },
            },
            _sum: { total_cost: true },
        });

        return {
            size: customers.length,
            totalOrders,
            totalRevenue: totalRevenue._sum.total_cost || 0,
            avgOrdersPerCustomer: totalOrders / customers.length,
            avgRevenuePerCustomer: (totalRevenue._sum.total_cost || 0) / customers.length,
        };
    }

    /**
     * Calculate churn probability
     */
    calculateChurnProbability(daysSinceLastOrder, orderFrequency) {
        // Simple churn model - can be replaced with ML model
        const expectedDaysBetweenOrders = 30 / orderFrequency;
        const ratio = daysSinceLastOrder / expectedDaysBetweenOrders;

        // Sigmoid function for smooth probability curve
        return 1 / (1 + Math.exp(-0.1 * (ratio - 10)));
    }

    /**
     * Score RFM dimensions
     */
    scoreRFM(rfmData) {
        // Sort for percentile ranking
        const sortedByRecency = [...rfmData].sort((a, b) => a.recency - b.recency);
        const sortedByFrequency = [...rfmData].sort((a, b) => b.frequency - a.frequency);
        const sortedByMonetary = [...rfmData].sort((a, b) => b.monetary - a.monetary);

        return rfmData.map((customer) => {
            const rRank = sortedByRecency.findIndex((c) => c.userId === customer.userId) + 1;
            const fRank = sortedByFrequency.findIndex((c) => c.userId === customer.userId) + 1;
            const mRank = sortedByMonetary.findIndex((c) => c.userId === customer.userId) + 1;

            const total = rfmData.length;

            return {
                ...customer,
                rScore: Math.ceil((rRank / total) * 5),
                fScore: Math.ceil((fRank / total) * 5),
                mScore: Math.ceil((mRank / total) * 5),
            };
        });
    }

    /**
     * Assign customer segment based on RFM scores
     */
    assignSegment(rScore, fScore, mScore) {
        for (const [segment, rules] of Object.entries(CUSTOMER_SEGMENTS)) {
            if (
                rScore >= rules.r[0] &&
                rScore <= rules.r[1] &&
                fScore >= rules.f[0] &&
                fScore <= rules.f[1] &&
                mScore >= rules.m[0] &&
                mScore <= rules.m[1]
            ) {
                return segment;
            }
        }
        return "UNCATEGORIZED";
    }

    /**
     * Summarize segments
     */
    summarizeSegments(segmentedData) {
        const summary = {};

        for (const segment of Object.keys(CUSTOMER_SEGMENTS)) {
            const customers = segmentedData.filter((c) => c.segment === segment);
            summary[segment] = {
                count: customers.length,
                totalRevenue: customers.reduce((sum, c) => sum + c.monetary, 0),
                avgRevenue:
                    customers.length > 0
                        ? customers.reduce((sum, c) => sum + c.monetary, 0) / customers.length
                        : 0,
                description: CUSTOMER_SEGMENTS[segment].description,
            };
        }

        return summary;
    }

    /**
     * Get user profiles
     */
    async getUserProfiles(userIds) {
        return await Promise.all(userIds.map((id) => this.getUserProfile(id)));
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        const ltv = await this.calculateLTV(userId);

        return {
            userId,
            ltv: ltv.ltv,
            orderFrequency: ltv.orderFrequency,
            avgOrderValue: ltv.avgOrderValue,
            totalOrders: ltv.totalOrders,
        };
    }

    /**
     * Calculate average profile
     */
    calculateAverageProfile(profiles) {
        const count = profiles.length;

        return {
            avgLTV: profiles.reduce((sum, p) => sum + p.ltv, 0) / count,
            avgFrequency: profiles.reduce((sum, p) => sum + p.orderFrequency, 0) / count,
            avgOrderValue: profiles.reduce((sum, p) => sum + p.avgOrderValue, 0) / count,
            avgTotalOrders: profiles.reduce((sum, p) => sum + p.totalOrders, 0) / count,
        };
    }

    /**
     * Calculate similarity between two profiles
     */
    calculateSimilarity(profile1, profile2) {
        // Simple euclidean distance similarity
        const normalize = (value, max) => value / max;

        const ltvDiff = Math.abs(normalize(profile1.ltv, 10000) - normalize(profile2.avgLTV, 10000));
        const freqDiff = Math.abs(
            normalize(profile1.orderFrequency, 10) - normalize(profile2.avgFrequency, 10),
        );
        const orderValueDiff = Math.abs(
            normalize(profile1.avgOrderValue, 1000) - normalize(profile2.avgOrderValue, 1000),
        );

        const distance = Math.sqrt(ltvDiff ** 2 + freqDiff ** 2 + orderValueDiff ** 2);
        return Math.max(0, 1 - distance);
    }
}

// Create singleton instance
const cohortAnalyzer = new CohortAnalyzer();

/**
 * Public API
 */
module.exports = {
    createCohort: (cohortDefinition) => cohortAnalyzer.createCohort(cohortDefinition),
    calculateLTV: (userId, predictionMonths) => cohortAnalyzer.calculateLTV(userId, predictionMonths),
    performRFMAnalysis: (userIds) => cohortAnalyzer.performRFMAnalysis(userIds),
    analyzeRetention: (cohortId, periodMonths) =>
        cohortAnalyzer.analyzeRetention(cohortId, periodMonths),
    createLookalikeAudience: (seedUserIds, threshold) =>
        cohortAnalyzer.createLookalikeAudience(seedUserIds, threshold),

    // Constants
    COHORT_TYPES,
    RFM_SCORES,
    CUSTOMER_SEGMENTS,
};
