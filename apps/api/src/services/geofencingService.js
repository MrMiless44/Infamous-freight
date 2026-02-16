/**
 * Geofencing Service
 * Location-based alerts, geofence management, and proximity notifications
 * Integrates with mobile GPS for real-time driver tracking and event triggers
 */

const { logger } = require("../middleware/logger");

class GeofencingService {
  constructor() {
    this.geofences = new Map(); // Store active geofences
    this.activeTracking = new Map(); // Track drivers in flight
    this.alertHistory = new Map(); // Recent alerts per driver
    this.geofenceTypes = {
      PICKUP: "pickup_location",
      DROPOFF: "dropoff_location",
      REST_AREA: "rest_area",
      TOLL_BOOTH: "toll_booth",
      WEIGH_STATION: "weigh_station",
      FUEL_STATION: "fuel_station",
      COMPETITOR_LOT: "competitor_lot",
      SHIPPER_FACILITY: "shipper_facility",
    };
  }

  /**
   * Register a shipment geofence (pickup/dropoff)
   * Creates geofence boundaries and trigger zones
   */
  async createShipmentGeofence(shipment, driverId) {
    try {
      logger.info("Geofence: Creating shipment geofence", {
        shipmentId: shipment.id,
        driverId,
      });

      const pickupGeofence = {
        id: `geofence-pickup-${shipment.id}`,
        shipmentId: shipment.id,
        type: this.geofenceTypes.PICKUP,
        location: {
          lat: shipment.pickupLat,
          lng: shipment.pickupLng,
        },
        radius: 100, // meters (reduced from earlier 200m for precision)
        alertRadius: 300, // Trigger alert when entering this zone
        metadata: {
          address: shipment.pickupAddress,
          facility: shipment.pickupFacility,
          contact: shipment.pickupContact,
          phone: shipment.pickupPhone,
          instructions: shipment.pickupInstructions,
          openingHours: shipment.pickupHours,
          estimatedArrival: shipment.estimatedPickupTime,
        },
        triggers: [
          "entry", // Alert when driver enters
          "exit", // Alert when driver exits (too early?)
          "arrival", // Near but not at location
        ],
      };

      const dropoffGeofence = {
        id: `geofence-dropoff-${shipment.id}`,
        shipmentId: shipment.id,
        type: this.geofenceTypes.DROPOFF,
        location: {
          lat: shipment.dropoffLat,
          lng: shipment.dropoffLng,
        },
        radius: 100,
        alertRadius: 300,
        metadata: {
          address: shipment.dropoffAddress,
          facility: shipment.dropoffFacility,
          contact: shipment.dropoffContact,
          phone: shipment.dropoffPhone,
          instructions: shipment.dropoffInstructions,
          openingHours: shipment.dropoffHours,
          estimatedArrival: shipment.estimatedDropoffTime,
        },
        triggers: ["entry", "exit", "arrival"],
      };

      // Store geofences
      this.geofences.set(pickupGeofence.id, pickupGeofence);
      this.geofences.set(dropoffGeofence.id, dropoffGeofence);

      // Track this driver's active geofence
      if (!this.activeTracking.has(driverId)) {
        this.activeTracking.set(driverId, []);
      }
      this.activeTracking.get(driverId).push({
        pickupGeofence: pickupGeofence.id,
        dropoffGeofence: dropoffGeofence.id,
        shipmentId: shipment.id,
        startTime: Date.now(),
      });

      logger.info("Geofence: Shipment geofence created", { shipmentId: shipment.id });

      return {
        pickupGeofence,
        dropoffGeofence,
        status: "active",
      };
    } catch (err) {
      logger.error("Geofence: Creation failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Check if driver location triggers any geofence alerts
   * Called from mobile app with GPS coordinates
   */
  async checkLocationUpdate(driverId, latitude, longitude, timestamp = Date.now()) {
    try {
      const alerts = [];
      const driverTracking = this.activeTracking.get(driverId) || [];

      for (const tracking of driverTracking) {
        const pickup = this.geofences.get(tracking.pickupGeofence);
        const dropoff = this.geofences.get(tracking.dropoffGeofence);

        // Check pickup geofence
        if (pickup) {
          const pickupDistance = this.calculateDistance(
            latitude,
            longitude,
            pickup.location.lat,
            pickup.location.lng,
          );

          const pickupAlert = this.evaluateGeofenceProximity(
            driverId,
            pickup,
            pickupDistance,
            "pickup",
          );

          if (pickupAlert) alerts.push(pickupAlert);
        }

        // Check dropoff geofence
        if (dropoff) {
          const dropoffDistance = this.calculateDistance(
            latitude,
            longitude,
            dropoff.location.lat,
            dropoff.location.lng,
          );

          const dropoffAlert = this.evaluateGeofenceProximity(
            driverId,
            dropoff,
            dropoffDistance,
            "dropoff",
          );

          if (dropoffAlert) alerts.push(dropoffAlert);
        }
      }

      // Fire alerts if any triggered
      for (const alert of alerts) {
        await this.fireGeofenceAlert(driverId, alert);
      }

      return {
        driverId,
        location: { latitude, longitude },
        timestamp,
        alertsTriggered: alerts.length,
        alerts,
      };
    } catch (err) {
      logger.error("Geofence: Location check failed", { error: err.message });
      return { error: err.message };
    }
  }

  /**
   * Create area-based geofence (rest areas, fuel stations, weigh stations)
   */
  async createAreaGeofence(area) {
    try {
      logger.info("Geofence: Creating area geofence", { areaType: area.type });

      const geofence = {
        id: `geofence-${area.type}-${area.id}`,
        type: area.type,
        areaId: area.id,
        location: {
          lat: area.lat,
          lng: area.lng,
        },
        radius: area.radius || 150,
        metadata: {
          name: area.name,
          description: area.description,
          hours: area.hours,
          amenities: area.amenities,
          rating: area.rating,
        },
        lastUpdated: Date.now(),
        active: true,
      };

      this.geofences.set(geofence.id, geofence);

      logger.info("Geofence: Area geofence created", { geofenceId: geofence.id });

      return geofence;
    } catch (err) {
      logger.error("Geofence: Area geofence creation failed", {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Get geofences for display on driver's map
   */
  async getDriverGeofences(driverId) {
    try {
      const driverTracking = this.activeTracking.get(driverId) || [];
      const geofences = [];

      for (const tracking of driverTracking) {
        const pickup = this.geofences.get(tracking.pickupGeofence);
        const dropoff = this.geofences.get(tracking.dropoffGeofence);

        if (pickup) geofences.push(pickup);
        if (dropoff) geofences.push(dropoff);
      }

      return {
        driverId,
        geofences,
        count: geofences.length,
      };
    } catch (err) {
      logger.error("Geofence: Retrieval failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Get optimized routing avoiding traffic/toll issues
   */
  async getOptimizedRoute(
    driverId,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    preferences = {},
  ) {
    try {
      logger.info("Geofence: Computing optimized route", { driverId });

      // In production, would call Google Maps or similar
      // For now, return structured route with geofence checkpoints

      const route = {
        waypoints: [
          {
            order: 1,
            name: "Current Location",
            lat: preferences.currentLat || pickupLat,
            lng: preferences.currentLng || pickupLng,
            type: "current",
          },
          {
            order: 2,
            name: "Pickup",
            lat: pickupLat,
            lng: pickupLng,
            type: "pickup",
            eta: this.calculateETA(
              preferences.currentLat || pickupLat,
              preferences.currentLng || pickupLng,
              pickupLat,
              pickupLng,
              preferences.avgSpeed || 60,
            ),
          },
          {
            order: 3,
            name: "Rest Stop (Optional)",
            lat: this.findNearbyRestArea(pickupLat, pickupLng, 200),
            type: "rest_area",
            optional: true,
          },
          {
            order: 4,
            name: "Dropoff",
            lat: dropoffLat,
            lng: dropoffLng,
            type: "dropoff",
            eta: this.calculateETA(
              pickupLat,
              pickupLng,
              dropoffLat,
              dropoffLng,
              preferences.avgSpeed || 60,
            ),
          },
        ],
        totalDistance: 234, // miles (mock)
        totalDuration: 4.2, // hours (mock)
        avoidTolls: preferences.avoidTolls || false,
        avoidHighways: preferences.avoidHighways || false,
        preferences: preferences,
      };

      logger.info("Geofence: Route optimization complete", {
        driverId,
        waypoints: route.waypoints.length,
      });

      return route;
    } catch (err) {
      logger.error("Geofence: Route optimization failed", {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Get nearby points of interest (fuel, rest, food)
   */
  async getNearbyPOI(latitude, longitude, poiType = "all", radiusMiles = 5) {
    try {
      logger.info("Geofence: Finding nearby POIs", {
        lat: latitude,
        lng: longitude,
        type: poiType,
      });

      // In production, would query external API or local database
      const mockPOIs = {
        fuel: [
          {
            id: "fuel-1",
            name: "Love's Travel Stops",
            distance: 2.3,
            location: { lat: latitude + 0.01, lng: longitude + 0.01 },
            rating: 4.2,
            amenities: ["Fuel", "Coffee", "Restroom"],
          },
        ],
        food: [
          {
            id: "food-1",
            name: "TA/Petro",
            distance: 3.1,
            location: { lat: latitude + 0.02, lng: longitude + 0.02 },
            rating: 4.0,
            amenities: ["Restaurant", "Fuel", "Shower"],
          },
        ],
        rest: [
          {
            id: "rest-1",
            name: "Rest Area",
            distance: 1.5,
            location: { lat: latitude - 0.01, lng: longitude - 0.01 },
            rating: 3.8,
            amenities: ["Parking", "Restroom", "WiFi"],
          },
        ],
      };

      const pois =
        poiType === "all"
          ? [...mockPOIs.fuel, ...mockPOIs.food, ...mockPOIs.rest]
          : mockPOIs[poiType] || [];

      return {
        latitude,
        longitude,
        radiusMiles,
        poiType,
        count: pois.length,
        pois: pois.sort((a, b) => a.distance - b.distance),
      };
    } catch (err) {
      logger.error("Geofence: POI search failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Track geofence compliance (was driver at pickup/dropoff long enough?)
   */
  async getComplianceReport(shipmentId) {
    try {
      logger.info("Geofence: Computing compliance report", { shipmentId });

      const pickupGeofence = this.geofences.get(`geofence-pickup-${shipmentId}`);
      const dropoffGeofence = this.geofences.get(`geofence-dropoff-${shipmentId}`);

      // In production, would track actual entry/exit times
      const report = {
        shipmentId,
        pickup: {
          geofenceId: pickupGeofence?.id,
          entered: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          exited: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
          durationMinutes: 30,
          compliant: true, // Was there long enough to load?
          notes: "Driver spent 30 minutes at pickup, normal",
        },
        dropoff: {
          geofenceId: dropoffGeofence?.id,
          entered: new Date(Date.now() - 15 * 60 * 1000),
          exited: null, // Still there
          durationMinutes: 15,
          compliant: true,
          notes: "Currently at dropoff location",
        },
        overall: "compliant",
      };

      logger.info("Geofence: Compliance report generated", {
        shipmentId,
        compliant: report.overall === "compliant",
      });

      return report;
    } catch (err) {
      logger.error("Geofence: Compliance report failed", {
        error: err.message,
      });
      throw err;
    }
  }

  // ============ HELPER METHODS ============

  calculateDistance(lat1, lng1, lat2, lng2) {
    // Haversine formula (simplified)
    const R = 3959; // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  evaluateGeofenceProximity(driverId, geofence, distance, type) {
    // Check if we should trigger an alert
    if (distance < 0.1) {
      // Very close (100 meters)
      return {
        type: "proximity",
        geofenceType: type,
        severity: "high",
        message: `You're at the ${type} location`,
        action: "arrival_confirmation",
        distance,
      };
    } else if (distance < 0.2) {
      // Nearby (200 meters)
      return {
        type: "approaching",
        geofenceType: type,
        severity: "medium",
        message: `Approaching ${type} (${distance.toFixed(2)} miles away)`,
        action: "turn_on_directions",
        distance,
      };
    } else if (distance < 0.3) {
      // Getting close (300 meters)
      return {
        type: "alert",
        geofenceType: type,
        severity: "low",
        message: `Prepare for ${type}`,
        action: "get_ready",
        distance,
      };
    }

    return null;
  }

  async fireGeofenceAlert(driverId, alert) {
    try {
      // Track alert to prevent duplicates
      const alertKey = `${driverId}-${alert.geofenceType}-${alert.type}`;
      const lastAlertTime = this.alertHistory.get(alertKey) || 0;

      // Only fire if not alerted in last 5 minutes
      if (Date.now() - lastAlertTime > 5 * 60 * 1000) {
        logger.info("Geofence: Alert fired", { driverId, alert: alert.type });
        this.alertHistory.set(alertKey, Date.now());

        // In production, would:
        // 1. Send push notification to driver
        // 2. Update shopper/loader via real-time websocket
        // 3. Log for compliance
      }
    } catch (err) {
      logger.error("Geofence: Alert firing failed", { error: err.message });
    }
  }

  calculateETA(lat1, lng1, lat2, lng2, avgSpeed) {
    const distance = this.calculateDistance(lat1, lng1, lat2, lng2);
    return (distance / avgSpeed) * 60; // Convert to minutes
  }

  findNearbyRestArea(lat, lng, radiusMiles) {
    // Mock nearby rest area
    return {
      lat: lat + 0.02,
      lng: lng + 0.02,
      name: "Rest Area",
    };
  }
}

module.exports = new GeofencingService();
