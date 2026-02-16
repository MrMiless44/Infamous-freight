// apps/api/src/services/realTimeTracking.js

const WebSocket = require("ws");

class RealTimeTrackingService {
  /**
   * WebSocket-based real-time shipment tracking
   */

  constructor() {
    this.clients = new Map();
    this.shipmentTracking = new Map();
  }

  /**
   * Add client to tracking
   */
  registerClient(shipmentId, clientId, ws) {
    if (!this.shipmentTracking.has(shipmentId)) {
      this.shipmentTracking.set(shipmentId, new Set());
    }

    this.shipmentTracking.get(shipmentId).add(clientId);
    this.clients.set(clientId, { ws, shipmentId, connectedAt: new Date() });

    return {
      registered: true,
      shipmentId,
      clientId,
      status: "monitoring",
    };
  }

  /**
   * Remove client from tracking
   */
  unregisterClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      this.shipmentTracking.get(client.shipmentId).delete(clientId);
      this.clients.delete(clientId);
    }
  }

  /**
   * Broadcast tracking update to all monitoring clients
   */
  broadcastUpdate(shipmentId, updateData) {
    const clients = this.shipmentTracking.get(shipmentId);
    if (!clients) return;

    const message = JSON.stringify({
      event: "tracking_update",
      shipmentId,
      data: updateData,
      timestamp: new Date(),
    });

    clients.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  /**
   * Update shipment location in real-time
   */
  updateLocation(shipmentId, location, status, metadata = {}) {
    const update = {
      shipmentId,
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || null,
      },
      status,
      eta: metadata.eta,
      temperature: metadata.temperature,
      humidity: metadata.humidity,
      driverName: metadata.driverName,
      timestamp: new Date(),
    };

    this.broadcastUpdate(shipmentId, update);

    return update;
  }

  /**
   * Get tracking history
   */
  getTrackingHistory(shipmentId) {
    // In production, retrieve from database
    return {
      shipmentId,
      events: [
        { event: "picked_up", timestamp: new Date(Date.now() - 3600000), location: "Warehouse A" },
        { event: "in_transit", timestamp: new Date(Date.now() - 1800000), location: "Route 5" },
        { event: "out_for_delivery", timestamp: new Date(), location: "Your area" },
      ],
    };
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates(shipmentId, userId) {
    return {
      subscribed: true,
      shipmentId,
      userId,
      updateInterval: 30000, // 30 seconds
    };
  }
}

module.exports = { RealTimeTrackingService };
