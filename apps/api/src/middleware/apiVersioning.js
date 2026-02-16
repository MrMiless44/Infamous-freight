/**
 * API Versioning Middleware
 * Supports multiple API versions with backward compatibility
 */

const express = require("express");
const { logger } = require("./logger");

/**
 * API Version Router
 *
 * Supports versioning via:
 * 1. URL path: /api/v1/resource
 * 2. Accept header: Accept: application/vnd.infamous.v1+json
 * 3. Query param: /api/resource?api-version=1 (optional)
 */

class ApiVersioningMiddleware {
  constructor() {
    this.versions = {};
    this.currentVersion = "v1";
    this.deprecatedVersions = {};
  }

  /**
   * Register a versioned route handler
   */
  registerVersion(version, path, handlers) {
    if (!this.versions[version]) {
      this.versions[version] = express.Router();
    }

    const router = this.versions[version];

    if (typeof handlers === "function") {
      router.use(path, handlers);
    } else {
      router.use(path, ...handlers);
    }

    logger.debug(`Registered API ${version}${path}`);
  }

  /**
   * Mark version as deprecated
   */
  deprecateVersion(version, sunsetDate) {
    this.deprecatedVersions[version] = sunsetDate;
    logger.warn(`API version ${version} deprecated, sunset: ${sunsetDate}`);
  }

  /**
   * Middleware: Extract and validate API version
   */
  versioningMiddleware() {
    return (req, res, next) => {
      try {
        // Extract version from various sources
        const version =
          this.extractFromPath(req.path) || this.extractFromHeader(req) || this.currentVersion;

        if (!this.versions[version]) {
          return res.status(400).json({
            error: `API version ${version} not found. Supported: ${Object.keys(this.versions).join(", ")}`,
          });
        }

        req.apiVersion = version;

        // Add deprecation warning if version is deprecated
        if (this.deprecatedVersions[version]) {
          res.setHeader("Deprecation", "true");
          res.setHeader("Sunset", this.deprecatedVersions[version]);
          res.setHeader(
            "Warning",
            `299 - "API version ${version} is deprecated and will sunset on ${this.deprecatedVersions[version]}"`,
          );

          logger.debug("Using deprecated API version", {
            version,
            sunset: this.deprecatedVersions[version],
            path: req.path,
            clientIp: req.ip,
          });
        }

        next();
      } catch (err) {
        logger.error("API versioning error", {
          error: err.message,
          path: req.path,
        });
        next(err);
      }
    };
  }

  /**
   * Extract version from URL path
   * e.g., /api/v1/shipments → v1
   */
  extractFromPath(path) {
    const match = path.match(/\/api\/(v\d+)\//);
    return match ? match[1] : null;
  }

  /**
   * Extract version from Accept header
   * e.g., Accept: application/vnd.infamous.v2+json → v2
   */
  extractFromHeader(req) {
    const accept = req.get("Accept") || "";
    const match = accept.match(/vnd\.infamous\.?(v\d+)/i);
    return match ? match[1] : null;
  }

  /**
   * Middleware: Route to versioned handler
   */
  routeHandler() {
    return (req, res, next) => {
      const version = req.apiVersion || this.currentVersion;
      const router = this.versions[version];

      if (!router) {
        return res.status(400).json({
          error: `API version ${version} not found`,
        });
      }

      router(req, res, next);
    };
  }

  /**
   * Get status of all API versions
   */
  getVersionStatus() {
    return {
      current: this.currentVersion,
      supported: Object.keys(this.versions),
      deprecated: Object.entries(this.deprecatedVersions).map(([version, sunset]) => ({
        version,
        sunset,
      })),
    };
  }
}

// Export singleton
const apiVersioning = new ApiVersioningMiddleware();

module.exports = {
  ApiVersioningMiddleware,
  apiVersioning,
};
