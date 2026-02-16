/**
 * Mobile Offline Sync Service (React Native)
 * Manages local data caching, sync queues, and conflict resolution
 * Enables app functionality without network connection
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";

export class OfflineSyncService {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.db = null;
    this.syncIntervalId = null;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize offline database
   */
  async initializeDatabase() {
    try {
      this.db = await SQLite.openDatabase("infamous_freight.db");

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS cached_loads (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          cached_at INTEGER NOT NULL,
          expiry INTEGER NOT NULL,
          source TEXT
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          retry_count INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS user_profile (
          user_id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          cached_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS driver_stats (
          user_id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          cached_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_cached_loads_expiry ON cached_loads(expiry);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
      `);

      console.log("✅ Offline database initialized");
      return true;
    } catch (err) {
      console.error("❌ Database init failed:", err);
      throw err;
    }
  }

  /**
   * Cache loads locally
   */
  async cacheLoads(loads) {
    try {
      const now = Date.now();
      const expiry = now + this.cacheExpiry;

      for (const load of loads) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO cached_loads (id, data, cached_at, expiry, source)
           VALUES (?, ?, ?, ?, ?)`,
          [load.id, JSON.stringify(load), now, expiry, "api"],
        );
      }

      console.log(`✅ Cached ${loads.length} loads`);
      return { cached: loads.length };
    } catch (err) {
      console.error("❌ Load caching failed:", err);
      throw err;
    }
  }

  /**
   * Get cached loads (offline)
   */
  async getCachedLoads(filters = {}) {
    try {
      let query = "SELECT data FROM cached_loads WHERE expiry > ?";
      const params = [Date.now()];

      if (filters.type) {
        query += " AND json_extract(data, '$.type') = ?";
        params.push(filters.type);
      }

      const results = await this.db.getAllAsync(query, params);

      const loads = results.map((r) => JSON.parse(r.data));
      console.log(`✅ Retrieved ${loads.length} cached loads`);

      return loads;
    } catch (err) {
      console.error("❌ Cached load retrieval failed:", err);
      return [];
    }
  }

  /**
   * Queue action for sync when online
   */
  async queueAction(action, data) {
    try {
      const id = `${action}:${Date.now()}`;

      await this.db.runAsync(
        `INSERT INTO sync_queue (id, action, data, created_at, status)
         VALUES (?, ?, ?, ?, ?)`,
        [id, action, JSON.stringify(data), Date.now(), "pending"],
      );

      this.syncQueue.push({ id, action, data });
      console.log(`✅ Action queued: ${action}`);

      return id;
    } catch (err) {
      console.error("❌ Queue action failed:", err);
      throw err;
    }
  }

  /**
   * Get pending sync actions
   */
  async getPendingActions() {
    try {
      const results = await this.db.getAllAsync(
        `SELECT id, action, data FROM sync_queue WHERE status = 'pending'`,
      );

      return results.map((r) => ({
        id: r.id,
        action: r.action,
        data: JSON.parse(r.data),
      }));
    } catch (err) {
      console.error("❌ Failed to get pending actions:", err);
      return [];
    }
  }

  /**
   * Start background sync
   * Syncs queued actions when network becomes available
   */
  async startBackgroundSync(onlineCheckInterval = 30000) {
    try {
      this.syncIntervalId = setInterval(() => {
        this.attemptSync();
      }, onlineCheckInterval);

      console.log("✅ Background sync started");
    } catch (err) {
      console.error("❌ Background sync start failed:", err);
    }
  }

  /**
   * Attempt to sync pending actions
   */
  async attemptSync() {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;

      const pending = await this.getPendingActions();

      if (pending.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`🔄 Syncing ${pending.length} pending actions...`);

      for (const action of pending) {
        try {
          await this.syncAction(action);
        } catch (err) {
          console.error(`❌ Sync failed for ${action.id}:`, err.message);

          // Increment retry count
          await this.db.runAsync(
            `UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?`,
            [action.id],
          );
        }
      }

      this.isSyncing = false;
    } catch (err) {
      console.error("❌ Sync attempt failed:", err);
      this.isSyncing = false;
    }
  }

  /**
   * Sync individual action
   */
  async syncAction(action) {
    try {
      const API_BASE =
        process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL || "http://localhost:4000";

      const response = await fetch(`${API_BASE}/api/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action.action, data: action.data }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      // Mark as synced
      await this.db.runAsync(`UPDATE sync_queue SET status = 'synced' WHERE id = ?`, [action.id]);

      console.log(`✅ Synced: ${action.id}`);
      return true;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId, profile) {
    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO user_profile (user_id, data, cached_at)
         VALUES (?, ?, ?)`,
        [userId, JSON.stringify(profile), Date.now()],
      );

      console.log("✅ User profile cached");
    } catch (err) {
      console.error("❌ Profile caching failed:", err);
    }
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile(userId) {
    try {
      const results = await this.db.getAllAsync(`SELECT data FROM user_profile WHERE user_id = ?`, [
        userId,
      ]);

      return results.length > 0 ? JSON.parse(results[0].data) : null;
    } catch (err) {
      console.error("❌ Profile retrieval failed:", err);
      return null;
    }
  }

  /**
   * Clear expired cache
   */
  async clearExpiredCache() {
    try {
      const deleted = await this.db.runAsync(`DELETE FROM cached_loads WHERE expiry < ?`, [
        Date.now(),
      ]);

      console.log(`✅ Cleared expired cache: ${deleted.changes} items`);
      return deleted.changes;
    } catch (err) {
      console.error("❌ Cache clearing failed:", err);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const loads = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM cached_loads WHERE expiry > ?`,
        [Date.now()],
      );

      const synced = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'synced'`,
      );

      const pending = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`,
      );

      return {
        cachedLoads: loads.count || 0,
        syncedActions: synced.count || 0,
        pendingActions: pending.count || 0,
      };
    } catch (err) {
      console.error("❌ Stats retrieval failed:", err);
      return { cachedLoads: 0, syncedActions: 0, pendingActions: 0 };
    }
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log("✅ Background sync stopped");
    }
  }

  /**
   * Clear all offline data
   */
  async clearAllData() {
    try {
      await this.db.execAsync(`
        DELETE FROM cached_loads;
        DELETE FROM sync_queue;
        DELETE FROM user_profile;
        DELETE FROM driver_stats;
      `);

      console.log("✅ All offline data cleared");
    } catch (err) {
      console.error("❌ Data clearing failed:", err);
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
