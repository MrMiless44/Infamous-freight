/**
 * WebSocket Service for Real-Time Updates
 * Handles real-time GPS tracking, shipment updates, and notifications
 */

const WebSocket = require("ws");
const { verifyToken } = require("../middleware/security");
const { logger } = require("../middleware/logger");
const jwt = require("jsonwebtoken");

class WebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map(); // userId -> WebSocket
    this.userSubscriptions = new Map(); // userId -> Set<shipmentId>
    this.vehicleTracking = new Map(); // vehicleId -> { lat, lng, timestamp, speed }
  }

  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      path: "/ws",
      verifyClient: (info, callback) => {
        // Optional: Verify origin
        const origin = info.origin || info.req.headers.origin;
        const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];

        if (process.env.NODE_ENV === "production" && !allowedOrigins.includes(origin)) {
          callback(false, 403, "Origin not allowed");
        } else {
          callback(true);
        }
      },
    });

    this.wss.on("connection", (ws, req) => {
      logger.info("New WebSocket connection", { ip: req.socket.remoteAddress });

      // Set up ping/pong for connection keep-alive
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Handle incoming messages
      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message);

          switch (data.type) {
            case "auth":
              await this.handleAuth(ws, data);
              break;
            case "subscribe":
              await this.handleSubscribe(ws, data);
              break;
            case "unsubscribe":
              await this.handleUnsubscribe(ws, data);
              break;
            case "gps_update":
              await this.handleGPSUpdate(ws, data);
              break;
            case "ping":
              ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
              break;
            default:
              logger.warn("Unknown WebSocket message type", { type: data.type });
          }
        } catch (error) {
          logger.error({ error }, "WebSocket message error");
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(ws);
      });

      ws.on("error", (error) => {
        logger.error({ error }, "WebSocket error");
      });
    });

    // Set up connection health check
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    logger.info("WebSocket server initialized", { path: "/ws" });
  }

  async handleAuth(ws, data) {
    try {
      const { token } = data;
      if (!token) {
        ws.send(JSON.stringify({ type: "auth_error", message: "Token required" }));
        return ws.close(1008, "Authentication failed");
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.sub;
      ws.organizationId = decoded.organizationId;
      ws.scopes = decoded.scopes || [];
      ws.authenticated = true;

      // Store connection
      this.connections.set(ws.userId, ws);

      // Initialize subscriptions for user
      if (!this.userSubscriptions.has(ws.userId)) {
        this.userSubscriptions.set(ws.userId, new Set());
      }

      ws.send(
        JSON.stringify({
          type: "auth_success",
          userId: ws.userId,
          timestamp: Date.now(),
        }),
      );

      logger.info("WebSocket authenticated", { userId: ws.userId });
    } catch (error) {
      logger.error({ error }, "WebSocket auth error");
      ws.send(JSON.stringify({ type: "auth_error", message: "Invalid token" }));
      ws.close(1008, "Authentication failed");
    }
  }

  async handleSubscribe(ws, data) {
    if (!ws.authenticated) {
      return ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
    }

    const { shipmentId, vehicleId } = data;
    const subscriptions = this.userSubscriptions.get(ws.userId);

    if (shipmentId) {
      subscriptions.add(`shipment:${shipmentId}`);
      ws.send(
        JSON.stringify({
          type: "subscribed",
          resource: "shipment",
          id: shipmentId,
        }),
      );
    }

    if (vehicleId) {
      subscriptions.add(`vehicle:${vehicleId}`);
      ws.send(
        JSON.stringify({
          type: "subscribed",
          resource: "vehicle",
          id: vehicleId,
        }),
      );
    }

    logger.info("WebSocket subscription added", { userId: ws.userId, shipmentId, vehicleId });
  }

  async handleUnsubscribe(ws, data) {
    if (!ws.authenticated) {
      return ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
    }

    const { shipmentId, vehicleId } = data;
    const subscriptions = this.userSubscriptions.get(ws.userId);

    if (shipmentId) {
      subscriptions.delete(`shipment:${shipmentId}`);
    }

    if (vehicleId) {
      subscriptions.delete(`vehicle:${vehicleId}`);
    }

    ws.send(JSON.stringify({ type: "unsubscribed" }));
  }

  async handleGPSUpdate(ws, data) {
    if (!ws.authenticated) {
      return ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
    }

    // Check scope permission
    if (!ws.scopes.includes("tracking:update")) {
      return ws.send(JSON.stringify({ type: "error", message: "Insufficient permissions" }));
    }

    const { vehicleId, latitude, longitude, speed, heading, altitude, timestamp } = data;

    // Store latest position
    this.vehicleTracking.set(vehicleId, {
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      altitude: altitude || 0,
      timestamp: timestamp || Date.now(),
      userId: ws.userId,
    });

    // Broadcast to subscribed users
    this.broadcastVehicleUpdate(vehicleId, {
      latitude,
      longitude,
      speed,
      heading,
      altitude,
      timestamp: timestamp || Date.now(),
    });

    logger.debug("GPS update received", { vehicleId, latitude, longitude });
  }

  handleDisconnect(ws) {
    if (ws.userId) {
      this.connections.delete(ws.userId);
      this.userSubscriptions.delete(ws.userId);
      logger.info("WebSocket disconnected", { userId: ws.userId });
    }
  }

  broadcastShipmentUpdate(shipmentId, update) {
    const message = JSON.stringify({
      type: "shipment_update",
      shipmentId,
      data: update,
      timestamp: Date.now(),
    });

    this.wss?.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.authenticated &&
        this.userSubscriptions.get(client.userId)?.has(`shipment:${shipmentId}`)
      ) {
        client.send(message);
      }
    });

    logger.debug("Shipment update broadcast", { shipmentId });
  }

  broadcastVehicleUpdate(vehicleId, update) {
    const message = JSON.stringify({
      type: "vehicle_update",
      vehicleId,
      data: update,
      timestamp: Date.now(),
    });

    this.wss?.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.authenticated &&
        this.userSubscriptions.get(client.userId)?.has(`vehicle:${vehicleId}`)
      ) {
        client.send(message);
      }
    });
  }

  broadcastNotification(userId, notification) {
    const client = this.connections.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "notification",
          data: notification,
          timestamp: Date.now(),
        }),
      );
    }
  }

  getVehiclePosition(vehicleId) {
    return this.vehicleTracking.get(vehicleId);
  }

  getConnectedUsers() {
    return Array.from(this.connections.keys());
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
    logger.info("WebSocket server shut down");
  }

  sendToUser(userId, message) {
    const userConnection = this.clients.get(userId);
    if (userConnection) {
      userConnection.send(JSON.stringify(message));
    }
  }

  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  close() {
    this.wss.close();
  }
}

module.exports = {
  WebSocketService,
  websocketServer: new WebSocketService(),
};
