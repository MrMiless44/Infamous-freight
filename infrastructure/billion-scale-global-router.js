/**
 * Global Load Balancer & Intelligent Routing
 * Routes billions of requests to optimal regional endpoints
 */

const geoip = require("geoip-lite");
const crypto = require("crypto");

class BillionUserGlobalRouter {
  constructor(config = {}) {
    this.regions = config.regions || this.getDefaultRegions();
    this.healthCheckInterval = config.healthCheckInterval || 30000;
    this.regionHealth = new Map();
    this.userAffinityCache = new Map();
    this.initializeHealthChecks();
  }

  /**
   * Default global regions for billion-user scale
   */
  getDefaultRegions() {
    return [
      {
        id: "us-east",
        endpoint: "https://infamous-freight-api-iad.fly.dev",
        region: "iad",
        continent: "NA",
        capacity: 200000000, // 200M users
        latency: 0,
      },
      {
        id: "us-west",
        endpoint: "https://infamous-freight-api-sjc.fly.dev",
        region: "sjc",
        continent: "NA",
        capacity: 150000000,
        latency: 0,
      },
      {
        id: "eu-central",
        endpoint: "https://infamous-freight-api-fra.fly.dev",
        region: "fra",
        continent: "EU",
        capacity: 300000000,
        latency: 0,
      },
      {
        id: "ap-southeast",
        endpoint: "https://infamous-freight-api-syd.fly.dev",
        region: "syd",
        continent: "OC",
        capacity: 250000000,
        latency: 0,
      },
      {
        id: "ap-northeast",
        endpoint: "https://infamous-freight-api-nrt.fly.dev",
        region: "nrt",
        continent: "AS",
        capacity: 100000000,
        latency: 0,
      },
      {
        id: "ap-south",
        endpoint: "https://infamous-freight-api-sin.fly.dev",
        region: "sin",
        continent: "AS",
        capacity: 80000000,
        latency: 0,
      },
      {
        id: "ca-central",
        endpoint: "https://infamous-freight-api-yyz.fly.dev",
        region: "yyz",
        continent: "NA",
        capacity: 50000000,
        latency: 0,
      },
      {
        id: "sa-east",
        endpoint: "https://infamous-freight-api-gru.fly.dev",
        region: "gru",
        continent: "SA",
        capacity: 100000000,
        latency: 0,
      },
      {
        id: "in-central",
        endpoint: "https://infamous-freight-api-maa.fly.dev",
        region: "maa",
        continent: "AS",
        capacity: 150000000,
        latency: 0,
      },
      {
        id: "af-south",
        endpoint: "https://infamous-freight-api-jnb.fly.dev",
        region: "jnb",
        continent: "AF",
        capacity: 40000000,
        latency: 0,
      },
      {
        id: "eu-west",
        endpoint: "https://infamous-freight-api-lhr.fly.dev",
        region: "lhr",
        continent: "EU",
        capacity: 80000000,
        latency: 0,
      },
      {
        id: "me-central",
        endpoint: "https://infamous-freight-api-dxb.fly.dev",
        region: "dxb",
        continent: "AS",
        capacity: 60000000,
        latency: 0,
      },
    ];
  }

  /**
   * Route user to optimal endpoint based on:
   * 1. Geolocation
   * 2. Regional capacity
   * 3. Health status
   * 4. User affinity (consistent routing)
   */
  routeRequest(userId, clientIp) {
    // Check user affinity cache (sticky sessions)
    const cached = this.userAffinityCache.get(userId);
    if (cached && this.isRegionHealthy(cached)) {
      return cached;
    }

    // Determine user location
    const userLocation = geoip.lookup(clientIp);
    const continent = userLocation?.continent || "NA";

    // Find optimal region by continent
    let optimalRegion = this.getOptimalRegionByContinent(continent);

    // Ensure region is healthy
    if (!this.isRegionHealthy(optimalRegion.id)) {
      optimalRegion = this.getHealthyRegionFallback();
    }

    // Cache affinity for consistent routing
    this.userAffinityCache.set(userId, optimalRegion.id);

    // Expire affinity after 24 hours for load rebalancing
    setTimeout(
      () => {
        this.userAffinityCache.delete(userId);
      },
      24 * 60 * 60 * 1000,
    );

    return optimalRegion;
  }

  /**
   * Get optimal region by continent
   */
  getOptimalRegionByContinent(continent) {
    const regionsByContinent = {
      NA: ["us-east", "us-west", "ca-central"],
      SA: ["sa-east", "us-east"],
      EU: ["eu-central", "eu-west"],
      AF: ["af-south", "eu-central"],
      AS: ["ap-southeast", "ap-northeast", "ap-south", "in-central", "me-central"],
      OC: ["ap-southeast"],
    };

    const regionIds = regionsByContinent[continent] || ["us-east"];

    // Find region with lowest latency and capacity
    let best = null;
    let bestScore = Infinity;

    for (const regionId of regionIds) {
      const region = this.regions.find((r) => r.id === regionId);
      if (!region) continue;

      const score = this.calculateRegionScore(region);

      if (score < bestScore) {
        best = region;
        bestScore = score;
      }
    }

    return best || this.regions[0];
  }

  /**
   * Calculate region score (lower is better)
   * Considers: latency, capacity, health, load
   */
  calculateRegionScore(region) {
    const latency = region.latency || 0;
    const capacityUsage = this.getCapacityUsage(region.id);
    const health = this.regionHealth.get(region.id)?.healthy ? 0 : 1000;

    // Score = latency + (capacity usage * 100) + health penalty
    return latency + capacityUsage * 100 + health;
  }

  /**
   * Get capacity usage for region (0.0 to 1.0)
   */
  getCapacityUsage(regionId) {
    // Fetch from monitoring/metrics system
    return Math.random() * 0.8; // Simulated 0-80% usage
  }

  /**
   * Get fallback region if primary is down
   */
  getHealthyRegionFallback() {
    const healthy = this.regions
      .filter((r) => this.isRegionHealthy(r.id))
      .sort((a, b) => this.calculateRegionScore(b) - this.calculateRegionScore(a));

    return healthy[0] || this.regions[0];
  }

  /**
   * Initialize health checks for all regions
   */
  initializeHealthChecks() {
    this.regions.forEach((region) => {
      this.regionHealth.set(region.id, {
        healthy: true,
        lastCheck: Date.now(),
        responseTime: 0,
      });
    });

    // Periodic health checks
    setInterval(() => this.healthCheckAllRegions(), this.healthCheckInterval);
  }

  /**
   * Health check all regions
   */
  async healthCheckAllRegions() {
    const promises = this.regions.map((region) =>
      this.healthCheck(region).catch((err) => ({
        id: region.id,
        healthy: false,
        error: err.message,
      })),
    );

    const results = await Promise.all(promises);
    results.forEach((result) => {
      this.regionHealth.set(result.id, {
        healthy: result.healthy !== false,
        lastCheck: Date.now(),
        responseTime: result.responseTime || 0,
      });
    });
  }

  /**
   * Health check single region
   */
  async healthCheck(region) {
    const start = Date.now();

    try {
      const response = await fetch(`${region.endpoint}/api/health`, {
        timeout: 5000,
      });

      const responseTime = Date.now() - start;

      return {
        id: region.id,
        healthy: response.ok,
        responseTime,
      };
    } catch (err) {
      return {
        id: region.id,
        healthy: false,
        error: err.message,
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * Check if region is healthy
   */
  isRegionHealthy(regionId) {
    const health = this.regionHealth.get(regionId);
    return health?.healthy ?? true;
  }

  /**
   * Get routing stats (for monitoring)
   */
  getRoutingStats() {
    return {
      totalUsers: this.userAffinityCache.size,
      regionHealth: Object.fromEntries(
        this.regions.map((r) => [
          r.id,
          {
            healthy: this.isRegionHealthy(r.id),
            responseTime: this.regionHealth.get(r.id)?.responseTime,
          },
        ]),
      ),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Middleware for Express/NextJS
   */
  middleware() {
    return (req, res, next) => {
      const userId = req.user?.sub || req.sessionID;
      const clientIp = req.ip || req.connection.remoteAddress;

      const optimalRegion = this.routeRequest(userId, clientIp);

      // Add routing info to request
      req.routedRegion = optimalRegion;
      res.set("X-Routed-Region", optimalRegion.id);

      next();
    };
  }
}

/**
 * DNS-based Global Load Balancer
 * For CDN/DNS routing (Cloudflare, Route53, etc.)
 */
class DNSGlobalLoadBalancer {
  constructor(config = {}) {
    this.provider = config.provider || "cloudflare"; // or 'route53'
    this.regions = config.regions || [];
    this.geoPolicies = this.buildGeoPolicies();
  }

  /**
   * Build geo-routing policies for DNS
   */
  buildGeoPolicies() {
    return {
      "North America": {
        regions: ["us-east", "us-west", "ca-central"],
        priority: 1,
      },
      "South America": {
        regions: ["sa-east"],
        priority: 2,
      },
      Europe: {
        regions: ["eu-central", "eu-west"],
        priority: 1,
      },
      Africa: {
        regions: ["af-south"],
        priority: 3,
      },
      Asia: {
        regions: ["ap-northeast", "ap-south", "ap-southeast", "in-central", "me-central"],
        priority: 1,
      },
      Oceania: {
        regions: ["ap-southeast"],
        priority: 2,
      },
    };
  }

  /**
   * Export DNS configuration for Cloudflare
   */
  exportCloudflareConfig() {
    return {
      name: "api.infamous-freight.com",
      type: "CNAME",
      content: "global.infamous-freight.com",
      ttl: 30, // 30 seconds for fast failover
      proxied: true,
      geo_routing: this.geoPolicies,
    };
  }

  /**
   * Export DNS configuration for AWS Route53
   */
  exportRoute53Config() {
    return {
      Name: "api.infamous-freight.com",
      Type: "A",
      SetIdentifier: "geo-routing",
      GeoLocation: {
        ContinentCode: "NA",
      },
      TTL: 30,
      ResourceRecords: [{ Value: "us-east-alb.infamous-freight.com" }],
      HealthCheckId: "health-check-us-east",
    };
  }
}

/**
 * Rate limiting per region
 */
class RegionalRateLimiter {
  constructor(config = {}) {
    this.regions = config.regions || {};
    this.limits = new Map();
  }

  /**
   * Check if request should be rate limited
   * Different limits per region based on capacity
   */
  isAllowed(userId, region) {
    const key = `${region}:${userId}`;
    const limit = this.limits.get(key) || { count: 0, resetTime: Date.now() + 60000 };

    if (Date.now() > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = Date.now() + 60000;
    }

    const maxRequests = this.getRegionalLimit(region);

    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count++;
    this.limits.set(key, limit);

    return true;
  }

  /**
   * Get rate limit for region (higher limit for larger regions)
   */
  getRegionalLimit(region) {
    const limits = {
      "us-east": 100000, // 100K req/min for large region
      "us-west": 80000,
      "eu-central": 120000,
      "ap-southeast": 100000,
      "ap-northeast": 50000, // 50K req/min for smaller region
      "ap-south": 40000,
      "ca-central": 30000,
      "sa-east": 50000,
      "in-central": 60000,
      "af-south": 20000,
      "eu-west": 40000,
      "me-central": 30000,
    };

    return limits[region] || 50000;
  }
}

module.exports = {
  BillionUserGlobalRouter,
  DNSGlobalLoadBalancer,
  RegionalRateLimiter,
};
