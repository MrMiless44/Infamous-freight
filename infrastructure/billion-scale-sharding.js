/**
 * Billion-User Database Sharding Strategy
 * Supports 1B+ users with consistent hashing and automatic rebalancing
 */

const crypto = require('crypto');

class BillionScaleShardingService {
    constructor(config = {}) {
        this.shardCount = config.shardCount || 12;
        this.replicationFactor = config.replicationFactor || 3;
        this.consistentHashRing = new ConsistentHashRing(this.shardCount);
        this.shardConnections = new Map();
        this.rebalancingInProgress = false;
    }

    /**
     * Get shard for user using consistent hashing
     * Ensures same user always maps to same shard
     */
    getShardForUser(userId) {
        const hash = this.hashUserId(userId);
        const shardId = this.consistentHashRing.getNode(hash);
        return {
            shardId,
            primary: `shard-${shardId}`,
            replicas: this.getReplicaShards(shardId),
            region: this.getShardRegion(shardId),
        };
    }

    /**
     * Hash user ID consistently
     */
    hashUserId(userId) {
        return crypto
            .createHash('sha256')
            .update(userId.toString())
            .digest('hex');
    }

    /**
     * Get replica shards for disaster recovery
     */
    getReplicaShards(primaryShardId) {
        const replicas = [];
        const offset = Math.floor(this.shardCount / this.replicationFactor);

        for (let i = 1; i < this.replicationFactor; i++) {
            const replicaId = (primaryShardId + i * offset) % this.shardCount;
            replicas.push(`shard-${replicaId}`);
        }

        return replicas;
    }

    /**
     * Get region for shard (for locality)
     */
    getShardRegion(shardId) {
        const regionMap = {
            0: 'us-east',      // Shard 0-1
            2: 'us-west',      // Shard 2-3
            4: 'eu-central',   // Shard 4-5
            6: 'ap-southeast', // Shard 6-7
            8: 'ap-northeast', // Shard 8-9
            10: 'in-central',  // Shard 10-11
        };

        const regionShardId = Math.floor(shardId / 2) * 2;
        return regionMap[regionShardId] || 'us-east';
    }

    /**
     * Write to primary shard with async replication
     */
    async writeUser(userId, data) {
        const shard = this.getShardForUser(userId);
        const primaryConn = this.shardConnections.get(shard.primary);

        // Write to primary
        const result = await primaryConn.query(
            `INSERT INTO users (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = $2
       RETURNING *`,
            [userId, JSON.stringify(data)]
        );

        // Async replication to replicas
        shard.replicas.forEach(replicaShard => {
            this.replicateAsync(userId, data, replicaShard).catch(err => {
                console.error(`Replication to ${replicaShard} failed:`, err);
            });
        });

        return result.rows[0];
    }

    /**
     * Async replication to replica shards
     */
    async replicateAsync(userId, data, replicaShard) {
        const replicaConn = this.shardConnections.get(replicaShard);
        await replicaConn.query(
            `INSERT INTO users_replica (user_id, data, synced_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET data = $2, synced_at = NOW()`,
            [userId, JSON.stringify(data)]
        );
    }

    /**
     * Read from nearest replica with fallback to primary
     */
    async readUser(userId) {
        const shard = this.getShardForUser(userId);

        try {
            // Try replica first (local read)
            const replicaConn = this.shardConnections.get(shard.replicas[0]);
            const result = await replicaConn.query(
                'SELECT * FROM users_replica WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length > 0) {
                return result.rows[0];
            }
        } catch (err) {
            console.warn(`Replica read failed for ${userId}, trying primary`);
        }

        // Fallback to primary
        const primaryConn = this.shardConnections.get(shard.primary);
        const result = await primaryConn.query(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );

        return result.rows[0] || null;
    }

    /**
     * Cross-shard query (for aggregations, reporting)
     * Results are eventually consistent
     */
    async queryAllShards(query, params = []) {
        const promises = [];

        for (const [shardName, conn] of this.shardConnections.entries()) {
            promises.push(
                conn.query(query, params)
                    .then(result => ({ shard: shardName, data: result.rows }))
                    .catch(err => ({ shard: shardName, error: err }))
            );
        }

        const results = await Promise.all(promises);
        return {
            totalResults: results.reduce((sum, r) => sum + (r.data?.length || 0), 0),
            shardResults: results,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Rebalance shards when adding new capacity
     * Uses minimal data movement (consistent hashing benefit)
     */
    async rebalanceShards(newShardCount) {
        if (this.rebalancingInProgress) {
            throw new Error('Rebalancing already in progress');
        }

        this.rebalancingInProgress = true;

        try {
            const oldRing = this.consistentHashRing;
            const newRing = new ConsistentHashRing(newShardCount);

            // For each user, check if shard assignment changed
            const affectedUsers = [];
            for (let i = 0; i < 1000000; i++) { // Sample check
                const oldShard = oldRing.getNode(i);
                const newShard = newRing.getNode(i);

                if (oldShard !== newShard) {
                    affectedUsers.push(i);
                }
            }

            console.log(`Rebalancing affects ~${affectedUsers.length} users`);

            // Migrate data during off-peak hours
            await this.migrateDataOffPeak(affectedUsers, newRing);

            this.consistentHashRing = newRing;
            this.shardCount = newShardCount;

        } finally {
            this.rebalancingInProgress = false;
        }
    }

    /**
     * Migrate affected users during off-peak hours
     */
    async migrateDataOffPeak(userIds, newRing) {
        // Schedule migration for 2-4 AM
        const now = new Date();
        const migrationTime = new Date(now);
        migrationTime.setHours(3, 0, 0, 0);

        if (migrationTime <= now) {
            migrationTime.setDate(migrationTime.getDate() + 1);
        }

        const delay = migrationTime - now;
        console.log(`Migration scheduled in ${delay / 1000 / 60} minutes`);

        setTimeout(async () => {
            console.log('Starting off-peak migration...');
            for (const userId of userIds) {
                await this.migrateUser(userId, newRing);
            }
            console.log('Migration complete');
        }, delay);
    }

    /**
     * Migrate single user to new shard
     */
    async migrateUser(userId, newRing) {
        const userData = await this.readUser(userId);
        const newShard = newRing.getNode(this.hashUserId(userId));

        // Write to new shard
        const newShardConn = this.shardConnections.get(`shard-${newShard}`);
        await newShardConn.query(
            `INSERT INTO users (id, data) VALUES ($1, $2)`,
            [userId, JSON.stringify(userData)]
        );

        // Delete from old shard
        const oldShard = this.getShardForUser(userId);
        const oldConn = this.shardConnections.get(oldShard.primary);
        await oldConn.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    /**
     * Get shard statistics (for monitoring)
     */
    async getShardStats() {
        const stats = [];

        for (const [shardName, conn] of this.shardConnections.entries()) {
            const result = await conn.query(`
        SELECT 
          COUNT(*) as row_count,
          pg_size_pretty(pg_total_relation_size('users')) as size,
          EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) as max_age_seconds
        FROM users
      `);

            stats.push({
                shard: shardName,
                rowCount: result.rows[0].row_count,
                size: result.rows[0].size,
                maxAge: result.rows[0].max_age_seconds,
            });
        }

        return {
            shards: stats,
            totalUsers: stats.reduce((sum, s) => sum + s.rowCount, 0),
            averageSize: stats.reduce((sum, s) => sum + parseInt(s.size), 0) / stats.length,
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Consistent Hash Ring for balanced shard distribution
 */
class ConsistentHashRing {
    constructor(nodeCount) {
        this.nodeCount = nodeCount;
        this.virtualNodes = 150; // Virtual nodes per shard for better distribution
        this.ring = new Map();
        this.sortedKeys = [];

        this.buildRing();
    }

    buildRing() {
        for (let node = 0; node < this.nodeCount; node++) {
            for (let v = 0; v < this.virtualNodes; v++) {
                const virtualKey = `node-${node}-${v}`;
                const hash = this.hash(virtualKey);
                this.ring.set(hash, node);
            }
        }

        this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
    }

    getNode(hashValue) {
        const hash = typeof hashValue === 'string'
            ? parseInt(hashValue.substring(0, 8), 16)
            : hashValue;

        for (const key of this.sortedKeys) {
            if (key >= hash) {
                return this.ring.get(key);
            }
        }

        // Wrap around
        return this.ring.get(this.sortedKeys[0]);
    }

    hash(key) {
        return parseInt(
            crypto.createHash('md5').update(key).digest('hex').substring(0, 8),
            16
        );
    }
}

/**
 * Metrics and monitoring
 */
class ShardingMetrics {
    constructor(shardingService) {
        this.service = shardingService;
    }

    async recordMetrics() {
        const stats = await this.service.getShardStats();

        return {
            totalUsers: stats.totalUsers,
            shardsBalanced: this.isBalanced(stats.shards),
            maxImbalance: this.calculateImbalance(stats.shards),
            timestamp: new Date().toISOString(),
        };
    }

    isBalanced(shards) {
        const sizes = shards.map(s => s.rowCount);
        const avg = sizes.reduce((a, b) => a + b) / sizes.length;
        const maxDeviation = Math.max(...sizes.map(s => Math.abs(s - avg) / avg));
        return maxDeviation < 0.1; // Allow 10% deviation
    }

    calculateImbalance(shards) {
        const sizes = shards.map(s => s.rowCount);
        const max = Math.max(...sizes);
        const min = Math.min(...sizes);
        return ((max - min) / min * 100).toFixed(2) + '%';
    }
}

module.exports = {
    BillionScaleShardingService,
    ConsistentHashRing,
    ShardingMetrics,
};
