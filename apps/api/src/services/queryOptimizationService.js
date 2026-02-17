// Database Query Optimization Service
// Identifies N+1 problems, slow queries, and optimization opportunities

const logger = require('./logger');
const { prisma } = require('../config/database');

class QueryOptimizationService {
    constructor() {
        this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || 1000);
        this.enableQueryLogging = process.env.ENABLE_QUERY_LOGGING === 'true';
        this.enablePlanAnalysis = process.env.ENABLE_PLAN_ANALYSIS === 'true';
        this.queryStats = new Map();
    }

    /**
     * Wrap Prisma queries to track performance
     */
    trackQuery(operation, duration, query, result) {
        const key = `${operation}`;

        if (!this.queryStats.has(key)) {
            this.queryStats.set(key, {
                count: 0,
                totalDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                lastExecuted: null,
            });
        }

        const stats = this.queryStats.get(key);
        stats.count++;
        stats.totalDuration += duration;
        stats.minDuration = Math.min(stats.minDuration, duration);
        stats.maxDuration = Math.max(stats.maxDuration, duration);
        stats.lastExecuted = new Date();

        // Log slow queries
        if (duration > this.slowQueryThreshold) {
            logger.warn('Slow query detected', {
                operation,
                duration,
                threshold: this.slowQueryThreshold,
                query: query.substring(0, 200),
            });
        }

        // Log N+1 detection (same query executed multiple times in short interval)
        if (stats.count > 5 && duration < 100) {
            logger.warn('Potential N+1 problem detected', {
                operation,
                executionCount: stats.count,
                averageDuration: stats.totalDuration / stats.count,
            });
        }

        return {
            operation,
            duration,
            average: stats.totalDuration / stats.count,
        };
    }

    /**
     * Get query statistics
     */
    getQueryStats() {
        const stats = {};
        for (const [key, value] of this.queryStats) {
            stats[key] = {
                ...value,
                averageDuration: value.totalDuration / value.count,
            };
        }
        return stats;
    }

    /**
     * Identify slow queries using pg_stat_statements
     */
    async identifySlowQueries() {
        try {
            const result = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          max_time,
          rows,
          (total_time / calls) as avg_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_time DESC
        LIMIT 20;
      `;

            logger.info('Top 20 slow queries identified', {
                count: result.length,
            });

            return result.map((q) => ({
                query: q.query,
                calls: q.calls,
                totalTime: parseFloat(q.total_time),
                meanTime: parseFloat(q.mean_time),
                maxTime: parseFloat(q.max_time),
                rows: q.rows,
                avgTime: parseFloat(q.avg_time),
            }));
        } catch (error) {
            logger.error('Failed to identify slow queries', {
                error: error.message,
            });
            return [];
        }
    }

    /**
     * Analyze query execution plan
     */
    async analyzeQueryPlan(query) {
        try {
            const plan = await prisma.$queryRawUnsafe(`EXPLAIN (FORMAT JSON, ANALYZE) ${query}`);
            return JSON.parse(plan[0][0] || '[]');
        } catch (error) {
            logger.error('Failed to analyze query plan', {
                error: error.message,
            });
            return null;
        }
    }

    /**
     * Get missing indexes recommendations
     */
    async getMissingIndexes() {
        try {
            const result = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          (CAST(n_distinct AS FLOAT) / COUNT(*) OVER (PARTITION BY tablename)) AS selectivity
        FROM pg_stats
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        AND correlation < 0.1
        AND n_distinct > 100
        ORDER BY n_distinct DESC;
      `;

            logger.info('Missing index opportunities identified', {
                count: result.length,
            });

            return result;
        } catch (error) {
            logger.error('Failed to get missing index recommendations', {
                error: error.message,
            });
            return [];
        }
    }

    /**
     * Get table bloat analysis
     */
    async getTableBloat() {
        try {
            const result = await prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
          n_live_tup,
          n_dead_tup,
          (n_dead_tup::FLOAT / (n_live_tup + n_dead_tup)) AS dead_ratio
        FROM pg_stat_user_tables
        WHERE (n_dead_tup::FLOAT / (n_live_tup + n_dead_tup)) > 0.1
        ORDER BY n_dead_tup DESC;
      `;

            logger.info('Table bloat analysis completed', {
                count: result.length,
            });

            return result;
        } catch (error) {
            logger.error('Failed to analyze table bloat', {
                error: error.message,
            });
            return [];
        }
    }

    /**
     * Run VACUUM and ANALYZE
     */
    async optimizeDatabase() {
        try {
            logger.info('Starting database optimization...');

            // Vacuum all tables
            await prisma.$executeRaw`VACUUM ANALYZE;`;

            logger.info('Database optimization completed');

            return {
                optimized: true,
                timestamp: new Date(),
            };
        } catch (error) {
            logger.error('Database optimization failed', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get cache efficiency
     */
    async getCacheEfficiency() {
        try {
            const result = await prisma.$queryRaw`
        SELECT 
          SUM(heap_blks_read) as heap_read,
          SUM(heap_blks_hit) as heap_hit,
          SUM(heap_blks_hit) / (SUM(heap_blks_hit) + SUM(heap_blks_read)) as ratio
        FROM pg_statio_user_tables;
      `;

            const cacheRatio = parseFloat(result[0]?.ratio || 0) * 100;

            logger.info('Cache efficiency calculated', {
                cacheHitRatio: `${cacheRatio.toFixed(2)}%`,
            });

            return {
                heapRead: result[0]?.heap_read,
                heapHit: result[0]?.heap_hit,
                cacheHitRatio: cacheRatio,
            };
        } catch (error) {
            logger.error('Failed to get cache efficiency', {
                error: error.message,
            });
            return null;
        }
    }

    /**
     * Get comprehensive optimization report
     */
    async getOptimizationReport() {
        const report = {
            timestamp: new Date(),
            queryStats: this.getQueryStats(),
            slowQueries: await this.identifySlowQueries(),
            missingIndexes: await this.getMissingIndexes(),
            tableBloat: await this.getTableBloat(),
            cacheEfficiency: await this.getCacheEfficiency(),
        };

        logger.info('Optimization report generated', {
            slowQueriesCount: report.slowQueries.length,
            missingIndexesCount: report.missingIndexes.length,
            bloatedTablesCount: report.tableBloat.length,
        });

        return report;
    }

    /**
     * Generate SQL to create composite indexes
     */
    generateIndexSQL(query, columns = []) {
        const columnList = columns.join(', ');
        const indexName = `idx_${columns.join('_')}`;
        return `CREATE INDEX CONCURRENTLY ${indexName} ON table_name(${columnList});`;
    }

    /**
     * Connection pool statistics
     */
    async getConnectionPoolStats() {
        try {
            const result = await prisma.$queryRaw`
        SELECT
          datname,
          count(*) as connections,
          state,
          wait_event_type
        FROM pg_stat_activity
        GROUP BY datname, state, wait_event_type;
      `;

            return result;
        } catch (error) {
            logger.error('Failed to get connection pool stats', {
                error: error.message,
            });
            return null;
        }
    }
}

module.exports = new QueryOptimizationService();
