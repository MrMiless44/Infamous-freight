/**
 * Offline Sync Service for React Native Mobile App
 * Handles offline data persistence, sync queue, conflict resolution
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const SYNC_QUEUE_KEY = "@freight_sync_queue";
const OFFLINE_DATA_KEY = "@freight_offline_data";
const LAST_SYNC_KEY = "@freight_last_sync";

class OfflineSyncService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.syncQueue = [];
    this.listeners = [];

    // Initialize network monitoring
    this.initNetworkMonitoring();
  }

  /**
   * Initialize network state monitoring
   */
  initNetworkMonitoring() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;

      console.log("[OfflineSync] Network status:", this.isOnline ? "ONLINE" : "OFFLINE");

      // Auto-sync when coming back online
      if (wasOffline && this.isOnline) {
        console.log("[OfflineSync] Connection restored, starting sync...");
        this.syncAll();
      }

      // Notify listeners
      this.notifyListeners({ type: "network_change", isOnline: this.isOnline });
    });
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(operation) {
    try {
      const queueItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: "pending",
      };

      this.syncQueue.push(queueItem);
      await this.persistSyncQueue();

      console.log("[OfflineSync] Operation queued:", operation.type, queueItem.id);

      // Try immediate sync if online
      if (this.isOnline && !this.syncInProgress) {
        await this.syncAll();
      }

      return queueItem.id;
    } catch (error) {
      console.error("[OfflineSync] Queue operation error:", error);
      throw error;
    }
  }

  /**
   * Sync all queued operations
   */
  async syncAll() {
    if (this.syncInProgress) {
      console.log("[OfflineSync] Sync already in progress");
      return;
    }

    if (!this.isOnline) {
      console.log("[OfflineSync] Cannot sync while offline");
      return;
    }

    try {
      this.syncInProgress = true;
      this.notifyListeners({ type: "sync_started" });

      // Load queue from storage
      await this.loadSyncQueue();

      console.log(`[OfflineSync] Syncing ${this.syncQueue.length} operations`);

      const results = {
        success: 0,
        failed: 0,
        conflicts: 0,
      };

      // Process each operation
      for (const queueItem of this.syncQueue) {
        try {
          await this.syncOperation(queueItem);
          results.success++;
        } catch (error) {
          if (error.type === "conflict") {
            results.conflicts++;
            await this.handleConflict(queueItem, error);
          } else {
            results.failed++;
            queueItem.retryCount++;
            queueItem.error = error.message;

            // Remove if max retries exceeded
            if (queueItem.retryCount >= 3) {
              console.error("[OfflineSync] Max retries exceeded:", queueItem.id);
              this.syncQueue = this.syncQueue.filter((item) => item.id !== queueItem.id);
            }
          }
        }
      }

      // Remove successful operations from queue
      this.syncQueue = this.syncQueue.filter((item) => item.status !== "synced");
      await this.persistSyncQueue();

      // Update last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log("[OfflineSync] Sync complete:", results);
      this.notifyListeners({ type: "sync_completed", results });
    } catch (error) {
      console.error("[OfflineSync] Sync error:", error);
      this.notifyListeners({ type: "sync_error", error: error.message });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync individual operation
   */
  async syncOperation(queueItem) {
    const { operation } = queueItem;
    console.log("[OfflineSync] Syncing operation:", operation.type, queueItem.id);

    switch (operation.type) {
      case "create_shipment":
        await this.syncCreateShipment(operation, queueItem);
        break;

      case "update_shipment":
        await this.syncUpdateShipment(operation, queueItem);
        break;

      case "update_location":
        await this.syncUpdateLocation(operation, queueItem);
        break;

      case "submit_inspection":
        await this.syncSubmitInspection(operation, queueItem);
        break;

      case "upload_document":
        await this.syncUploadDocument(operation, queueItem);
        break;

      default:
        console.warn("[OfflineSync] Unknown operation type:", operation.type);
    }

    queueItem.status = "synced";
  }

  /**
   * Handle sync conflicts
   */
  async handleConflict(queueItem, error) {
    console.log("[OfflineSync] Conflict detected:", queueItem.id);

    const resolution = await this.resolveConflict(queueItem, error);

    switch (resolution.strategy) {
      case "server_wins":
        // Discard local changes
        queueItem.status = "synced";
        this.notifyListeners({
          type: "conflict_resolved",
          strategy: "server_wins",
          queueItem,
        });
        break;

      case "client_wins":
        // Retry with force flag
        queueItem.operation.force = true;
        queueItem.retryCount = 0;
        this.notifyListeners({
          type: "conflict_resolved",
          strategy: "client_wins",
          queueItem,
        });
        break;

      case "manual":
        // Require user intervention
        this.notifyListeners({
          type: "conflict_requires_manual",
          queueItem,
          serverData: error.serverData,
          localData: queueItem.operation.data,
        });
        break;
    }
  }

  /**
   * Resolve conflict with strategy
   */
  async resolveConflict(queueItem, error) {
    // Default: server wins for most operations
    // Client wins for location updates (always use latest)
    // Manual for critical data like shipment status

    const { operation } = queueItem;

    if (operation.type === "update_location") {
      return { strategy: "client_wins" };
    }

    if (operation.type === "update_shipment" && operation.field === "status") {
      return { strategy: "manual" };
    }

    return { strategy: "server_wins" };
  }

  /**
   * Save data for offline access
   */
  async saveOfflineData(key, data) {
    try {
      const offlineData = await this.loadOfflineData();
      offlineData[key] = {
        data,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
      console.log("[OfflineSync] Offline data saved:", key);
    } catch (error) {
      console.error("[OfflineSync] Save offline data error:", error);
    }
  }

  /**
   * Load offline data
   */
  async loadOfflineData() {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("[OfflineSync] Load offline data error:", error);
      return {};
    }
  }

  /**
   * Get specific offline data
   */
  async getOfflineData(key) {
    const offlineData = await this.loadOfflineData();
    return offlineData[key]?.data || null;
  }

  /**
   * Clear offline data
   */
  async clearOfflineData() {
    try {
      await AsyncStorage.removeItem(OFFLINE_DATA_KEY);
      console.log("[OfflineSync] Offline data cleared");
    } catch (error) {
      console.error("[OfflineSync] Clear offline data error:", error);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    await this.loadSyncQueue();

    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queuedOperations: this.syncQueue.length,
      lastSync: lastSync ? new Date(lastSync) : null,
      pendingOperations: this.syncQueue.filter((item) => item.status === "pending"),
      failedOperations: this.syncQueue.filter((item) => item.retryCount > 0),
    };
  }

  /**
   * Subscribe to sync events
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify listeners
   */
  notifyListeners(event) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("[OfflineSync] Listener error:", error);
      }
    });
  }

  // ========== Private Helper Methods ==========

  async persistSyncQueue() {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error("[OfflineSync] Persist queue error:", error);
    }
  }

  async loadSyncQueue() {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      this.syncQueue = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("[OfflineSync] Load queue error:", error);
      this.syncQueue = [];
    }
  }

  // Sync operation implementations
  async syncCreateShipment(operation, queueItem) {
    const response = await fetch(`${process.env.API_BASE_URL}/api/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify(operation.data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    // Update local data with server ID
    if (operation.localId) {
      await this.mapLocalToServerId(operation.localId, result.data.id);
    }
  }

  async syncUpdateShipment(operation, queueItem) {
    const response = await fetch(
      `${process.env.API_BASE_URL}/api/shipments/${operation.shipmentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getAuthToken()}`,
          "If-Match": operation.version, // Optimistic locking
        },
        body: JSON.stringify(operation.data),
      },
    );

    if (response.status === 409) {
      // Conflict detected
      const serverData = await response.json();
      throw { type: "conflict", serverData };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async syncUpdateLocation(operation, queueItem) {
    const response = await fetch(`${process.env.API_BASE_URL}/api/tracking/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify({
        vehicleId: operation.vehicleId,
        location: operation.location,
        timestamp: operation.timestamp,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async syncSubmitInspection(operation, queueItem) {
    const response = await fetch(`${process.env.API_BASE_URL}/api/inspections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify(operation.data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async syncUploadDocument(operation, queueItem) {
    const formData = new FormData();
    formData.append("file", operation.file);
    formData.append("shipmentId", operation.shipmentId);
    formData.append("type", operation.documentType);

    const response = await fetch(`${process.env.API_BASE_URL}/api/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await this.getAuthToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async getAuthToken() {
    // Get JWT from secure storage
    return await AsyncStorage.getItem("@freight_auth_token");
  }

  async mapLocalToServerId(localId, serverId) {
    // Map temporary local IDs to server IDs
    const mappings = (await AsyncStorage.getItem("@freight_id_mappings")) || "{}";
    const map = JSON.parse(mappings);
    map[localId] = serverId;
    await AsyncStorage.setItem("@freight_id_mappings", JSON.stringify(map));
  }
}

// Export singleton instance
export default new OfflineSyncService();
