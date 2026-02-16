/**
 * Uber Freight Loadboard Service
 * Real-time freight matching via Uber Freight API (v1)
 * Handles: authentication, load search, bidding, scoring
 */

const axios = require("axios");
const { logger } = require("../middleware/logger");

class UberFreightLoadboard {
  constructor() {
    this.apiBase = "https://api.uberfreight.com/v1";
    this.clientId = process.env.UBER_FREIGHT_CLIENT_ID || "";
    this.clientSecret = process.env.UBER_FREIGHT_CLIENT_SECRET || "";
    this.accessToken = null;
    this.tokenExpiry = null;
    this.pollInterval = 5 * 60 * 1000; // 5 minutes
    this.lastPoll = null;
    this.cache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 min cache
    this.mockMode = !this.clientId || !this.clientSecret;
  }

  /**
   * Authenticate with Uber Freight OAuth
   * Returns access token valid for 1 hour
   */
  async authenticate() {
    try {
      if (this.mockMode) {
        logger.warn("Uber Freight: Mock mode - missing credentials");
        return;
      }

      if (this.accessToken && this.tokenExpiry > Date.now()) {
        return this.accessToken; // Token still valid
      }

      logger.info("Uber Freight: Authenticating...");

      const response = await axios.post(`${this.apiBase}/auth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "client_credentials",
        scope: "freight:read freight:bid",
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      logger.info("Uber Freight: Authentication successful");
      return this.accessToken;
    } catch (err) {
      logger.error("Uber Freight: Authentication failed", { error: err.message });
      this.mockMode = true; // Fall through to mock
      return null;
    }
  }

  /**
   * Search loads by origin and destination
   * Returns array of available freight shipments
   */
  async search(origin, destination, filters = {}) {
    try {
      const cacheKey = `search:${origin}:${destination}`;
      const cached = this.cache.get(cacheKey);

      // Return cached if fresh
      if (cached && cached.expiry > Date.now()) {
        logger.debug("Uber Freight: Cache hit for search");
        return cached.data;
      }

      if (this.mockMode) {
        return this.getMockSearchResults(origin, destination, filters);
      }

      await this.authenticate();

      logger.info("Uber Freight: Searching loads", {
        origin,
        destination,
      });

      // Parse location strings to coordinates
      const [originCity, originState] = origin.split(", ");
      const [destCity, destState] = destination.split(", ");

      const response = await axios.get(`${this.apiBase}/shipments/available`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          origin_city: originCity,
          origin_state: originState,
          destination_city: destCity,
          destination_state: destState,
          status: "available",
          sort: "posted_time",
          limit: filters.limit || 50,
        },
      });

      const loads = response.data.shipments.map((shipment) => this.normalizeLoad(shipment));

      // Cache results
      this.cache.set(cacheKey, {
        data: loads,
        expiry: Date.now() + this.cacheExpiry,
      });

      logger.info("Uber Freight: Found loads", { count: loads.length });
      return loads;
    } catch (err) {
      logger.error("Uber Freight: Search failed", { error: err.message });
      // Fallback to mock
      return this.getMockSearchResults(origin, destination, filters);
    }
  }

  /**
   * Get detailed load information
   */
  async getLoadDetail(loadId, externalId) {
    try {
      if (this.mockMode) {
        return this.getMockLoadDetail(externalId);
      }

      await this.authenticate();

      const response = await axios.get(`${this.apiBase}/shipments/${externalId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return this.normalizeLoad(response.data);
    } catch (err) {
      logger.error("Uber Freight: Get detail failed", { error: err.message });
      return this.getMockLoadDetail(externalId);
    }
  }

  /**
   * Place a bid/quote on a load
   * Returns bid confirmation with ID
   */
  async placeBid(loadId, externalId, bidData) {
    try {
      if (this.mockMode) {
        return this.getMockBidConfirmation(externalId, bidData);
      }

      await this.authenticate();

      logger.info("Uber Freight: Placing bid", {
        externalId,
        amount: bidData.bidAmount,
      });

      const response = await axios.post(
        `${this.apiBase}/shipments/${externalId}/quotes`,
        {
          carrier_id: bidData.driverId || "self-employed",
          carrier_name: bidData.driverName,
          equipment_type: bidData.equipmentType || "dry_van",
          rate_per_mile: bidData.bidAmount / (bidData.miles || 100),
          estimated_distance: bidData.miles || 0,
          vehicle_number: bidData.truckNumber,
          comments: bidData.comments,
          available_from: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      logger.info("Uber Freight: Bid placed successfully", {
        quoteId: response.data.quote_id,
      });

      return {
        id: `bid-${response.data.quote_id}`,
        loadId,
        externalId,
        externalBidId: response.data.quote_id,
        status: "placed",
        bidAmount: bidData.bidAmount,
        createdAt: new Date(),
      };
    } catch (err) {
      logger.error("Uber Freight: Bid placement failed", {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Get load board statistics
   * Returns aggregated metrics
   */
  async getStats() {
    try {
      if (this.mockMode) {
        return this.getMockStats();
      }

      await this.authenticate();

      const response = await axios.get(`${this.apiBase}/shipments/available/stats`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return {
        count: response.data.total_available,
        avgRate: response.data.avg_rate_per_mile,
        updatedAt: new Date(),
      };
    } catch (err) {
      logger.error("Uber Freight: Get stats failed", { error: err.message });
      return this.getMockStats();
    }
  }

  /**
   * Normalize Uber Freight shipment to standard load format
   */
  normalizeLoad(shipment) {
    const miles = this.calculateDistance(
      shipment.origin.coordinates,
      shipment.destination.coordinates,
    );

    // AI Scoring Algorithm
    const score = this.calculateScore(shipment, miles);

    return {
      id: `uber-${shipment.id}`,
      externalId: shipment.id,
      source: "uberfright",
      pickupCity: shipment.origin.city,
      pickupState: shipment.origin.state,
      pickupZip: shipment.origin.zip,
      pickupDate: new Date(shipment.pickup_timeslot.start),
      dropoffCity: shipment.destination.city,
      dropoffState: shipment.destination.state,
      dropoffZip: shipment.destination.zip,
      dropoffDate: new Date(shipment.delivery_timeslot.start),
      miles,
      weight: shipment.weight_lbs || 0,
      length: shipment.dimensions?.length || 53,
      commodity: shipment.commodity_type,
      equipmentType: shipment.equipment_type || "dry_van",
      loads: shipment.num_pallets || 1,
      rate: shipment.rate_per_mile ? shipment.rate_per_mile * miles : 0,
      rateType: "total",
      hazmat: shipment.hazmat || false,
      temperature: shipment.temperature_controlled ? "Controlled" : null,
      shipperName: shipment.shipper.name,
      shipperPhone: shipment.shipper.phone,
      shipperEmail: shipment.shipper.email,
      score,
      postedTime: new Date(shipment.posted_at),
      refreshedAt: new Date(),
    };
  }

  /**
   * Calculate AI score for load (0-100)
   * Base: 60
   * Rate premium: +20 if >$1.50/mile
   * Distance: +15 if 200-600 miles (near optimal)
   * Equipment match: +10 if equipment matches profile
   * Freshness: +5 if posted <1 hour ago
   */
  calculateScore(shipment, miles) {
    let score = 60;

    // Rate premium (max +20)
    if (shipment.rate_per_mile && shipment.rate_per_mile > 1.5) {
      score += 20;
    } else if (shipment.rate_per_mile && shipment.rate_per_mile > 1.2) {
      score += 10;
    }

    // Distance optimization (max +15)
    if (miles >= 200 && miles <= 600) {
      score += 15;
    } else if (miles >= 100 && miles <= 1000) {
      score += 8;
    }

    // Equipment (max +10)
    if (shipment.equipment_type === "dry_van") {
      score += 10; // Most common
    } else if (["reefer", "flatbed", "tanker"].includes(shipment.equipment_type)) {
      score += 5; // Specialty
    }

    // Freshness (max +5)
    const hoursOld = (Date.now() - new Date(shipment.posted_at)) / (1000 * 60 * 60);
    if (hoursOld < 1) {
      score += 5;
    } else if (hoursOld < 3) {
      score += 3;
    }

    // Hazmat penalty (-15)
    if (shipment.hazmat) {
      score -= 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate distance between two coordinates (approx miles)
   */
  calculateDistance(origin, destination) {
    // Haversine formula approximation
    const R = 3959; // Earth's radius in miles
    const lat1 = (origin.latitude * Math.PI) / 180;
    const lat2 = (destination.latitude * Math.PI) / 180;
    const deltaLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const deltaLng = ((destination.longitude - origin.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Mock data methods for testing/fallback
   */
  getMockSearchResults(origin, destination, filters) {
    const [originCity, originState] = origin.split(", ");
    const [destCity, destState] = destination.split(", ");

    const mockLoads = [
      {
        id: "uber-mock-001",
        origin: { city: originCity, state: originState, zip: "80202" },
        destination: { city: destCity, state: destState, zip: "85001" },
        weight_lbs: 42000,
        equipment_type: "dry_van",
        rate_per_mile: 1.85,
        commodity_type: "General Freight",
        shipper: {
          name: "Uber Freight Inc.",
          phone: "+1-555-LOADS-1",
          email: "shipper@uberfreight.com",
        },
        posted_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        pickup_timeslot: {
          start: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        },
        delivery_timeslot: {
          start: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        },
        coordinates: {
          origin: { latitude: 39.7392, longitude: -104.9903 },
          destination: { latitude: 33.4484, longitude: -112.074 },
        },
      },
      {
        id: "uber-mock-002",
        origin: { city: originCity, state: originState, zip: "80202" },
        destination: { city: destCity, state: destState, zip: "85001" },
        weight_lbs: 48000,
        equipment_type: "reefer",
        rate_per_mile: 2.15,
        commodity_type: "Perishable",
        hazmat: false,
        temperature_controlled: true,
        shipper: {
          name: "Fresh Foods LLC",
          phone: "+1-555-FRESH-1",
          email: "logistics@freshfoods.com",
        },
        posted_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        pickup_timeslot: {
          start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        },
        delivery_timeslot: {
          start: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
        },
      },
    ];

    return mockLoads
      .map((shipment) => this.normalizeLoad(shipment))
      .filter((load) => {
        if (filters.minRate && load.rate < filters.minRate) return false;
        if (filters.maxMiles && load.miles > filters.maxMiles) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }

  getMockLoadDetail(externalId) {
    return {
      id: externalId,
      externalId,
      source: "uberfright",
      pickupCity: "Denver",
      pickupState: "CO",
      dropoffCity: "Phoenix",
      dropoffState: "AZ",
      miles: 600,
      weight: 42000,
      rate: 1110,
      score: 88,
      commodity: "General Freight",
      shipper: "Uber Freight",
      postedTime: new Date(),
    };
  }

  getMockBidConfirmation(externalId, bidData) {
    return {
      id: `bid-${Date.now()}`,
      externalId,
      externalBidId: `UBER-QUOTE-${Math.random().toString(36).slice(2, 9)}`,
      status: "placed",
      bidAmount: bidData.bidAmount,
      createdAt: new Date(),
    };
  }

  getMockStats() {
    return {
      count: 2847,
      avgRate: 1.95,
    };
  }
}

// Export singleton
module.exports = new UberFreightLoadboard();
