/**
 * Real-time Notifications Service - Phase 4
 * WebSocket-based notifications, load matching, driver status broadcasts
 */

const { logger } = require("../middleware/logger");
const { EventEmitter } = require("events");

class RealtimeNotificationService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // userId -> WebSocket
    this.subscriptions = new Map(); // userId -> [topics]
    this.messageQueue = new Map(); // userId -> [messages]
    this.deliveryStatus = new Map();
    this.reconnectionAttempts = new Map();
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize WebSocket connection for user
   * @param {string} userId
   * @param {WebSocket} ws
   * @returns {Object}
   */
  initializeConnection(userId, ws) {
    try {
      this.connections.set(userId, ws);
      this.subscriptions.set(userId, []);
      this.messageQueue.set(userId, []);

      logger.info("User connected to real-time notifications", { userId });

      return {
        success: true,
        userId,
        connectionId: `${userId}:${Date.now()}`,
        topics: [],
      };
    } catch (err) {
      logger.error("Connection initialization failed", { userId, err });
      throw err;
    }
  }

  /**
   * Subscribe user to topic
   * @param {string} userId
   * @param {string} topic
   * @returns {Object}
   */
  subscribe(userId, topic) {
    try {
      const subs = this.subscriptions.get(userId) || [];
      if (!subs.includes(topic)) {
        subs.push(topic);
        this.subscriptions.set(userId, subs);
      }

      logger.debug("User subscribed to topic", { userId, topic });

      return {
        success: true,
        userId,
        topic,
        subscriptions: subs,
      };
    } catch (err) {
      logger.error("Subscription failed", { userId, topic, err });
      throw err;
    }
  }

  /**
   * Broadcast load match notification to drivers
   * @param {Object} load
   * @param {Array} driverIds
   * @returns {Promise<Object>}
   */
  async broadcastLoadMatch(load, driverIds) {
    try {
      const notification = {
        id: `notif_${Date.now()}`,
        type: "load_match",
        timestamp: new Date(),
        priority: "high",
        data: {
          loadId: load.id,
          origin: load.origin,
          destination: load.destination,
          rate: load.rate,
          distance: load.distance,
          pickupTime: load.pickupTime,
          estimatedDelivery: load.estimatedDelivery,
          matchScore: 0.92,
          competingBids: Math.floor(Math.random() * 5),
        },
        expiresIn: 300, // 5 minutes
      };

      const results = [];

      for (const driverId of driverIds) {
        const result = await this.sendNotification(driverId, notification);
        results.push(result);
      }

      logger.info("Load match broadcast completed", {
        loadId: load.id,
        driverCount: driverIds.length,
        successCount: results.filter((r) => r.delivered).length,
      });

      return {
        success: true,
        notification,
        results,
        deliveredCount: results.filter((r) => r.delivered).length,
        enqueuedCount: results.filter((r) => !r.delivered).length,
      };
    } catch (err) {
      logger.error("Load match broadcast failed", { err });
      throw err;
    }
  }

  /**
   * Send real-time notification to user
   * @param {string} userId
   * @param {Object} notification
   * @returns {Promise<Object>}
   */
  async sendNotification(userId, notification) {
    try {
      const ws = this.connections.get(userId);

      if (ws && ws.readyState === 1) {
        // OPEN
        ws.send(
          JSON.stringify({
            type: "notification",
            payload: notification,
          }),
        );

        this.deliveryStatus.set(`${userId}:${notification.id}`, {
          delivered: true,
          timestamp: new Date(),
          attempt: 1,
        });

        logger.debug("Notification delivered", {
          userId,
          notificationType: notification.type,
        });

        return {
          userId,
          notificationId: notification.id,
          delivered: true,
          attempt: 1,
        };
      } else {
        // Enqueue for offline delivery
        const queue = this.messageQueue.get(userId) || [];
        queue.push(notification);
        this.messageQueue.set(userId, queue);

        logger.debug("Notification enqueued", {
          userId,
          queueLength: queue.length,
        });

        return {
          userId,
          notificationId: notification.id,
          delivered: false,
          queued: true,
          queueLength: queue.length,
        };
      }
    } catch (err) {
      logger.error("Notification send failed", { userId, err });
      return {
        userId,
        delivered: false,
        error: err.message,
      };
    }
  }

  /**
   * Broadcast driver status update
   * @param {string} driverId
   * @param {string} status - online, offline, on_duty, off_duty, accepting, not_accepting
   * @returns {Promise<Object>}
   */
  async broadcastDriverStatus(driverId, status) {
    try {
      const notification = {
        id: `status_${driverId}_${Date.now()}`,
        type: "driver_status_update",
        timestamp: new Date(),
        urgent: false,
        data: {
          driverId,
          status,
          location: {
            lat: null,
            lon: null,
          },
          acceptingLoads: status === "accepting",
          onlineTime: Math.floor(Math.random() * 28800), // 0-8 hours
        },
      };

      // Notify dispatcher and shippers subscribed to this driver
      const subscribers = await this.getSubscribers(`driver:${driverId}`);

      for (const subscriberId of subscribers) {
        await this.sendNotification(subscriberId, notification);
      }

      logger.info("Driver status broadcasted", {
        driverId,
        status,
        subscriberCount: subscribers.length,
      });

      return {
        success: true,
        driverId,
        status,
        notificationsCount: subscribers.length,
      };
    } catch (err) {
      logger.error("Driver status broadcast failed", { driverId, err });
      throw err;
    }
  }

  /**
   * Send in-app notification
   * @param {string} userId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async sendInAppNotification(userId, data) {
    try {
      const notification = {
        id: `in_app_${Date.now()}`,
        type: "in_app",
        timestamp: new Date(),
        data,
        actions: data.actions || [],
        dismissible: true,
      };

      return await this.sendNotification(userId, notification);
    } catch (err) {
      logger.error("In-app notification failed", { userId, err });
      throw err;
    }
  }

  /**
   * Send FCM/push notification to mobile
   * @param {string} userId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async sendPushNotification(userId, data) {
    try {
      // Simulated push notification (would integrate with FCM/OneSignal)
      const notification = {
        id: `push_${Date.now()}`,
        type: "push",
        timestamp: new Date(),
        platform: data.platform || "ios", // ios, android, web
        data,
        sound: data.sound || "default",
        badge: data.badge || 1,
      };

      logger.info("Push notification queued", {
        userId,
        platform: notification.platform,
      });

      return {
        success: true,
        userId,
        notificationId: notification.id,
        platform: notification.platform,
        status: "sent",
      };
    } catch (err) {
      logger.error("Push notification failed", { userId, err });
      throw err;
    }
  }

  /**
   * Deliver queued messages when user reconnects
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async deliverQueuedMessages(userId) {
    try {
      const queue = this.messageQueue.get(userId) || [];
      const sorted = queue.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      logger.info("Delivering queued messages", {
        userId,
        messageCount: sorted.length,
      });

      for (const message of sorted.slice(0, 50)) {
        // Limit to 50 most recent
        await this.sendNotification(userId, message);
      }

      this.messageQueue.set(userId, []);

      return {
        success: true,
        userId,
        deliveredCount: Math.min(sorted.length, 50),
      };
    } catch (err) {
      logger.error("Queue delivery failed", { userId, err });
      throw err;
    }
  }

  /**
   * Notify load bid activity
   * @param {string} loadId
   * @param {Object} bid
   * @returns {Promise<Object>}
   */
  async notifyLoadBidActivity(loadId, bid) {
    try {
      const notification = {
        id: `bid_${Date.now()}`,
        type: "load_bid",
        timestamp: new Date(),
        data: {
          loadId,
          bidAmount: bid.amount,
          bidderName: bid.bidderName,
          bidCount: bid.totalBids,
          action: bid.action, // new_bid, bid_accepted, bid_rejected
        },
      };

      logger.info("Load bid notification triggered", {
        loadId,
        bidAmount: bid.amount,
      });

      return {
        success: true,
        notification,
      };
    } catch (err) {
      logger.error("Load bid notification failed", { loadId, err });
      throw err;
    }
  }

  /**
   * Notify shipment status update
   * @param {string} shipmentId
   * @param {string} newStatus
   * @param {Array} notifyUserIds
   * @returns {Promise<Object>}
   */
  async notifyShipmentStatus(shipmentId, newStatus, notifyUserIds) {
    try {
      const notification = {
        id: `shipment_${Date.now()}`,
        type: "shipment_status",
        timestamp: new Date(),
        priority: ["delivered", "problem"].includes(newStatus) ? "high" : "normal",
        data: {
          shipmentId,
          status: newStatus,
          statusDescription: this.getStatusDescription(newStatus),
          actions: this.getStatusActions(newStatus),
        },
      };

      let deliveredCount = 0;

      for (const userId of notifyUserIds) {
        const result = await this.sendNotification(userId, notification);
        if (result.delivered) deliveredCount++;
      }

      logger.info("Shipment status notifications sent", {
        shipmentId,
        status: newStatus,
        notifiedCount: notifyUserIds.length,
        deliveredCount,
      });

      return {
        success: true,
        shipmentId,
        status: newStatus,
        notifiedCount: notifyUserIds.length,
        deliveredCount,
      };
    } catch (err) {
      logger.error("Shipment status notification failed", { shipmentId, err });
      throw err;
    }
  }

  /**
   * Handle WebSocket disconnection
   * @param {string} userId
   * @returns {Object}
   */
  handleDisconnection(userId) {
    try {
      const attempts = (this.reconnectionAttempts.get(userId) || 0) + 1;

      if (attempts < this.maxReconnectAttempts) {
        this.reconnectionAttempts.set(userId, attempts);
        logger.info("User disconnected, reconnection attempt", {
          userId,
          attempt: attempts,
        });

        return {
          success: true,
          userId,
          reconnectionAttempt: attempts,
          willRetry: true,
          retryDelay: 1000 * Math.pow(2, attempts - 1), // exponential backoff
        };
      } else {
        // Remove after max attempts
        this.connections.delete(userId);
        this.subscriptions.delete(userId);
        this.reconnectionAttempts.delete(userId);

        logger.info("User disconnected permanently", { userId });

        return {
          success: true,
          userId,
          disconnected: true,
          willRetry: false,
        };
      }
    } catch (err) {
      logger.error("Disconnection handling failed", { userId, err });
      throw err;
    }
  }

  /**
   * Get active subscribers for topic
   * @param {string} topic
   * @returns {Promise<Array>}
   */
  async getSubscribers(topic) {
    try {
      const subscribers = [];

      for (const [userId, subs] of this.subscriptions) {
        if (subs.includes(topic)) {
          subscribers.push(userId);
        }
      }

      return subscribers;
    } catch (err) {
      logger.error("Get subscribers failed", { topic, err });
      return [];
    }
  }

  /**
   * Get notification analytics
   * @returns {Object}
   */
  getAnalytics() {
    try {
      const totalConnections = this.connections.size;
      const totalQueued = Array.from(this.messageQueue.values()).reduce(
        (sum, queue) => sum + queue.length,
        0,
      );

      return {
        activeConnections: totalConnections,
        totalSubscriptions: this.subscriptions.size,
        queuedMessages: totalQueued,
        reconnectionAttempts: this.reconnectionAttempts.size,
        averageQueueLength: this.messageQueue.size > 0 ? totalQueued / this.messageQueue.size : 0,
      };
    } catch (err) {
      logger.error("Analytics calculation failed", { err });
      return {};
    }
  }

  // Helper methods

  getStatusDescription(status) {
    const descriptions = {
      pending: "Shipment is pending pickup",
      picked_up: "Shipment has been picked up",
      in_transit: "Shipment is in transit",
      delivered: "Shipment has been delivered",
      problem: "There is a problem with the shipment",
    };
    return descriptions[status] || "Status updated";
  }

  getStatusActions(status) {
    const actions = {
      pending: ["view_load", "contact_driver"],
      picked_up: ["track_shipment", "contact_driver"],
      in_transit: ["track_shipment", "estimated_delivery"],
      delivered: ["rate_driver", "issue_payment"],
      problem: ["contact_support", "report_issue"],
    };
    return actions[status] || [];
  }
}

module.exports = new RealtimeNotificationService();
