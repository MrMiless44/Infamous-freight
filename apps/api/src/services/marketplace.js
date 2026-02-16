/**
 * Marketplace Service
 * Load board integration, freight matching, carrier network
 */

const { logger } = require("../middleware/logger");
const dispatchScoring = require("./dispatchScoring");

class MarketplaceService {
  constructor() {
    this.loadBoards = {
      DAT: { enabled: false, apiKey: process.env.DAT_API_KEY },
      TRUCKSTOP: { enabled: false, apiKey: process.env.TRUCKSTOP_API_KEY },
      CONVOY: { enabled: false, apiKey: process.env.CONVOY_API_KEY },
      UBER_FREIGHT: { enabled: false, apiKey: process.env.UBER_FREIGHT_API_KEY },
    };

    // Internal load board state
    this.availableLoads = new Map();
    this.activeOffers = new Map();
  }

  /**
   * Search available loads from multiple load boards
   */
  async searchLoads(criteria) {
    try {
      logger.info("Searching loads", criteria);

      const results = {
        loads: [],
        sources: [],
        totalFound: 0,
        searchedAt: new Date().toISOString(),
      };

      // Search internal marketplace
      const internalLoads = await this.searchInternalLoads(criteria);
      if (internalLoads.length > 0) {
        results.loads.push(...internalLoads);
        results.sources.push("internal");
      }

      // Search external load boards
      if (this.loadBoards.DAT.enabled) {
        const datLoads = await this.searchDAT(criteria);
        results.loads.push(...datLoads);
        results.sources.push("DAT");
      }

      if (this.loadBoards.TRUCKSTOP.enabled) {
        const truckstopLoads = await this.searchTruckStop(criteria);
        results.loads.push(...truckstopLoads);
        results.sources.push("TruckStop");
      }

      if (this.loadBoards.CONVOY.enabled) {
        const convoyLoads = await this.searchConvoy(criteria);
        results.loads.push(...convoyLoads);
        results.sources.push("Convoy");
      }

      results.totalFound = results.loads.length;

      // Score and rank loads
      if (criteria.currentLocation && results.loads.length > 0) {
        const scored = await dispatchScoring.scoreAndRankLoads(
          results.loads,
          criteria.currentLocation,
        );
        results.loads = scored.rankedLoads;
      }

      logger.info("Load search complete", {
        totalFound: results.totalFound,
        sources: results.sources,
      });

      return results;
    } catch (error) {
      logger.error({ error }, "Load search error");
      throw error;
    }
  }

  /**
   * Post load to marketplace
   */
  async postLoad(loadData) {
    try {
      logger.info("Posting load to marketplace", {
        origin: loadData.origin,
        destination: loadData.destination,
      });

      const load = {
        id: `LOAD-${Date.now()}`,
        ...loadData,
        status: "AVAILABLE",
        postedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        views: 0,
        offers: [],
      };

      // Store in internal marketplace
      this.availableLoads.set(load.id, load);

      // Post to external load boards if configured
      const postingResults = {
        internal: true,
        external: [],
      };

      if (loadData.postToExternal) {
        if (this.loadBoards.DAT.enabled) {
          await this.postToDAT(load);
          postingResults.external.push("DAT");
        }
        if (this.loadBoards.TRUCKSTOP.enabled) {
          await this.postToTruckStop(load);
          postingResults.external.push("TruckStop");
        }
      }

      logger.info("Load posted", { loadId: load.id, posting: postingResults });

      return {
        success: true,
        load,
        postingResults,
      };
    } catch (error) {
      logger.error({ error }, "Post load error");
      throw error;
    }
  }

  /**
   * Submit offer for a load
   */
  async submitOffer(loadId, offer) {
    try {
      logger.info("Submitting offer", { loadId, carrerId: offer.carrierId });

      const offerId = `OFFER-${Date.now()}`;
      const offerData = {
        id: offerId,
        loadId,
        ...offer,
        status: "PENDING",
        submittedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
      };

      this.activeOffers.set(offerId, offerData);

      // Notify load poster
      await this.notifyLoadPoster(loadId, offerData);

      return {
        success: true,
        offer: offerData,
      };
    } catch (error) {
      logger.error({ error }, "Submit offer error");
      throw error;
    }
  }

  /**
   * Accept or reject offer
   */
  async handleOffer(offerId, action, userId) {
    try {
      const offer = this.activeOffers.get(offerId);

      if (!offer) {
        throw new Error("Offer not found");
      }

      if (action === "ACCEPT") {
        offer.status = "ACCEPTED";
        offer.acceptedAt = new Date().toISOString();

        // Create shipment from accepted offer
        const shipment = await this.createShipmentFromOffer(offer);

        // Mark load as assigned
        const load = this.availableLoads.get(offer.loadId);
        if (load) {
          load.status = "ASSIGNED";
          load.assignedCarrier = offer.carrierId;
        }

        // Reject other pending offers
        await this.rejectOtherOffers(offer.loadId, offerId);

        return {
          success: true,
          offer,
          shipment,
        };
      } else if (action === "REJECT") {
        offer.status = "REJECTED";
        offer.rejectedAt = new Date().toISOString();

        return {
          success: true,
          offer,
        };
      }
    } catch (error) {
      logger.error({ error }, "Handle offer error");
      throw error;
    }
  }

  // ========== External Load Board Integrations ==========

  async searchInternalLoads(criteria) {
    const loads = Array.from(this.availableLoads.values());

    return loads.filter((load) => {
      if (criteria.origin && !this.matchesLocation(load.origin, criteria.origin)) {
        return false;
      }
      if (criteria.destination && !this.matchesLocation(load.destination, criteria.destination)) {
        return false;
      }
      if (criteria.minRate && load.rate < criteria.minRate) {
        return false;
      }
      if (criteria.loadType && load.type !== criteria.loadType) {
        return false;
      }
      return load.status === "AVAILABLE";
    });
  }

  async searchDAT(criteria) {
    // DAT Load Board API integration
    // https://developer.dat.com/
    logger.info("Searching DAT load board", criteria);

    // Mock result - would be actual API call
    return [];
  }

  async searchTruckStop(criteria) {
    // TruckStop API integration
    // https://developer.truckstop.com/
    logger.info("Searching TruckStop", criteria);

    return [];
  }

  async searchConvoy(criteria) {
    // Convoy API integration
    logger.info("Searching Convoy", criteria);

    return [];
  }

  async postToDAT(load) {
    logger.info("Posting to DAT", { loadId: load.id });
    // DAT API call would go here
  }

  async postToTruckStop(load) {
    logger.info("Posting to TruckStop", { loadId: load.id });
    // TruckStop API call would go here
  }

  // ========== Helper Methods ==========

  matchesLocation(location, criteria) {
    // Simple string matching - would use geocoding in production
    const loc = location.toLowerCase();
    const crit = criteria.toLowerCase();
    return loc.includes(crit) || crit.includes(loc);
  }

  async notifyLoadPoster(loadId, offer) {
    // Send notification to load poster about new offer
    logger.info("Notifying load poster", { loadId, offerId: offer.id });
    // Would integrate with notification service
  }

  async createShipmentFromOffer(offer) {
    // Create shipment record from accepted offer
    logger.info("Creating shipment from offer", { offerId: offer.id });

    return {
      id: `SHIP-${Date.now()}`,
      loadId: offer.loadId,
      carrierId: offer.carrierId,
      rate: offer.rate,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
  }

  async rejectOtherOffers(loadId, acceptedOfferId) {
    for (const [offerId, offer] of this.activeOffers.entries()) {
      if (offer.loadId === loadId && offerId !== acceptedOfferId && offer.status === "PENDING") {
        offer.status = "REJECTED";
        offer.rejectedAt = new Date().toISOString();
        offer.reason = "Another offer was accepted";
      }
    }
  }

  /**
   * Get marketplace analytics
   */
  async getAnalytics(organizationId, days = 30) {
    return {
      period: `${days} days`,
      loadsPosted: 0,
      loadsFilled: 0,
      averageFillTime: 0,
      totalOffers: 0,
      acceptedOffers: 0,
      averageRate: 0,
      topCarriers: [],
    };
  }
}

// Export singleton instance
module.exports = new MarketplaceService();
