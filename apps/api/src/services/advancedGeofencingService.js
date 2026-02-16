/**
 * Advanced Geofencing Service - Phase 4
 * Multi-zone geofencing, automated actions, safety corridors, real-time alerts
 */

const { logger } = require("../middleware/logger");

class AdvancedGeofencingService {
    constructor() {
        this.zones = new Map(); // zoneId -> zone config
        this.safetyCorridors = new Map(); // corridorId -> corridor config
        this.driverLocations = new Map(); // driverId -> {lat, lon, timestamp}
        this.activeAlerts = new Map(); // alertId -> alert
        this.zoneHistory = new Map(); // driverId -> [zone entries/exits]
    }

    /**
     * Create geofence zone
     * @param {Object} zone
     * @returns {Object}
     */
    createZone(zone) {
        try {
            const zoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const newZone = {
                id: zoneId,
                name: zone.name,
                type: zone.type, // service_area, restricted, pickup, delivery, warehouse, rest_area, fuel_station
                zoneType: zone.zoneType || "circular", // circular, polygon, corridor
                center: zone.center, // { lat, lon }
                radius: zone.radius || 5000, // meters
                polygon: zone.polygon || [], // for polygon zones
                priority: zone.priority || "normal", // low, normal, high, critical
                automatedActions: zone.automatedActions || [],
                notificationRules: zone.notificationRules || [],
                createdAt: new Date(),
                active: true,
            };

            this.zones.set(zoneId, newZone);

            logger.info("Geofence zone created", {
                zoneId,
                name: zone.name,
                type: zone.type,
            });

            return {
                success: true,
                zone: newZone,
            };
        } catch (err) {
            logger.error("Zone creation failed", { err });
            throw err;
        }
    }

    /**
     * Create safety corridor (multi-zone route)
     * @param {Object} corridor
     * @returns {Object}
     */
    createSafetyCorridor(corridor) {
        try {
            const corridorId = `corridor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const newCorridor = {
                id: corridorId,
                name: corridor.name,
                startLocation: corridor.startLocation, // { lat, lon }
                endLocation: corridor.endLocation, // { lat, lon }
                width: corridor.width || 1000, // meters on each side
                waypoints: corridor.waypoints || [], // [ {lat, lon}, ... ]
                speed_limit: corridor.speed_limit || 70, // mph
                hazardous_areas: corridor.hazardous_areas || [],
                restAreas: corridor.restAreas || [],
                estimatedDuration: corridor.estimatedDuration || 480, // minutes
                trafficConditions: {
                    light: 1.0, // multiplier
                    moderate: 1.2,
                    heavy: 1.5,
                    gridlock: 2.0,
                },
                createdAt: new Date(),
                active: true,
            };

            this.safetyCorridors.set(corridorId, newCorridor);

            logger.info("Safety corridor created", {
                corridorId,
                name: corridor.name,
                distance: this.calculateDistance(
                    corridor.startLocation,
                    corridor.endLocation,
                ),
            });

            return {
                success: true,
                corridor: newCorridor,
            };
        } catch (err) {
            logger.error("Safety corridor creation failed", { err });
            throw err;
        }
    }

    /**
     * Update driver location and check geofence boundaries
     * @param {string} driverId
     * @param {Object} location
     * @returns {Promise<Object>}
     */
    async updateDriverLocation(driverId, location) {
        try {
            const previousLocation = this.driverLocations.get(driverId);
            const currentLocation = {
                lat: location.lat,
                lon: location.lon,
                timestamp: new Date(),
                speed: location.speed || 0,
                heading: location.heading || 0,
            };

            this.driverLocations.set(driverId, currentLocation);

            // Check zone entries/exits
            const zoneEvents = await this.checkZoneBoundaries(
                driverId,
                previousLocation,
                currentLocation,
            );

            // Check safety corridor compliance
            const corridorEvents = await this.checkCorridorCompliance(
                driverId,
                currentLocation,
            );

            // Check speeding violations
            const speedingViolations = await this.checkSpeedingViolations(
                driverId,
                currentLocation,
            );

            const allEvents = [...zoneEvents, ...corridorEvents, ...speedingViolations];

            logger.debug("Driver location updated", {
                driverId,
                location: currentLocation,
                eventsTriggered: allEvents.length,
            });

            return {
                success: true,
                driverId,
                location: currentLocation,
                events: allEvents,
                eventCount: allEvents.length,
            };
        } catch (err) {
            logger.error("Location update failed", { driverId, err });
            throw err;
        }
    }

    /**
     * Check zone entry/exit events
     * @param {string} driverId
     * @param {Object} previousLocation
     * @param {Object} currentLocation
     * @returns {Promise<Array>}
     */
    async checkZoneBoundaries(driverId, previousLocation, currentLocation) {
        try {
            const events = [];

            for (const [zoneId, zone] of this.zones) {
                if (!zone.active) continue;

                const wasInZone = previousLocation
                    ? this.isLocationInZone(previousLocation, zone)
                    : false;
                const isInZone = this.isLocationInZone(currentLocation, zone);

                if (isInZone && !wasInZone) {
                    // Entry
                    const event = {
                        id: `event_${Date.now()}`,
                        driverId,
                        type: "zone_entry",
                        zoneId,
                        zoneName: zone.name,
                        timestamp: currentLocation.timestamp,
                        location: currentLocation,
                        triggered: await this.executeZoneActions(driverId, zone, "entry"),
                    };

                    events.push(event);
                    this.recordZoneHistory(driverId, event);

                    logger.info("Driver entered zone", {
                        driverId,
                        zoneId,
                        zoneName: zone.name,
                    });
                } else if (!isInZone && wasInZone) {
                    // Exit
                    const event = {
                        id: `event_${Date.now()}`,
                        driverId,
                        type: "zone_exit",
                        zoneId,
                        zoneName: zone.name,
                        timestamp: currentLocation.timestamp,
                        location: currentLocation,
                        triggered: await this.executeZoneActions(driverId, zone, "exit"),
                    };

                    events.push(event);
                    this.recordZoneHistory(driverId, event);

                    logger.info("Driver exited zone", {
                        driverId,
                        zoneId,
                        zoneName: zone.name,
                    });
                }
            }

            return events;
        } catch (err) {
            logger.error("Zone boundary check failed", { driverId, err });
            return [];
        }
    }

    /**
     * Check safety corridor compliance
     * @param {string} driverId
     * @param {Object} location
     * @returns {Promise<Array>}
     */
    async checkCorridorCompliance(driverId, location) {
        try {
            const events = [];

            for (const [corridorId, corridor] of this.safetyCorridors) {
                if (!corridor.active) continue;

                const distanceFromCorridor = this.getDistanceFromCorridor(location, corridor);

                if (distanceFromCorridor > corridor.width) {
                    // Off-corridor
                    const event = {
                        id: `event_${Date.now()}`,
                        driverId,
                        type: "corridor_deviation",
                        corridorId,
                        corridorName: corridor.name,
                        deviationDistance: Math.round(distanceFromCorridor),
                        severity: this.getDeviationSeverity(distanceFromCorridor, corridor.width),
                        timestamp: location.timestamp,
                        location,
                    };

                    events.push(event);

                    if (event.severity === "critical") {
                        logger.warn("Driver significantly off safety corridor", {
                            driverId,
                            corridorId,
                            deviation: distanceFromCorridor,
                        });
                    }
                }

                // Check hazardous area warnings
                for (const hazard of corridor.hazardous_areas) {
                    const distanceToHazard = this.calculateDistance(location, hazard.location);
                    if (distanceToHazard < hazard.warningRadius) {
                        events.push({
                            id: `event_${Date.now()}`,
                            driverId,
                            type: "hazard_warning",
                            hazardType: hazard.type,
                            hazardName: hazard.name,
                            distance: Math.round(distanceToHazard),
                            timestamp: location.timestamp,
                            recommendation: hazard.Recommendation,
                        });
                    }
                }

                // Check mandatory rest areas
                for (const restArea of corridor.restAreas) {
                    const distanceToRest = this.calculateDistance(location, restArea.location);
                    if (distanceToRest < 5000 && location.speed < 5) {
                        // Driver in rest area
                        events.push({
                            id: `event_${Date.now()}`,
                            driverId,
                            type: "rest_area_detection",
                            restAreaName: restArea.name,
                            timestamp: location.timestamp,
                        });
                    }
                }
            }

            return events;
        } catch (err) {
            logger.error("Corridor compliance check failed", { driverId, err });
            return [];
        }
    }

    /**
     * Check speeding violations
     * @param {string} driverId
     * @param {Object} location
     * @returns {Promise<Array>}
     */
    async checkSpeedingViolations(driverId, location) {
        try {
            const events = [];

            // Check all zones for speed limits
            for (const [zoneId, zone] of this.zones) {
                if (
                    !zone.active ||
                    !zone.speed_limit ||
                    !this.isLocationInZone(location, zone)
                ) {
                    continue;
                }

                if (location.speed > zone.speed_limit) {
                    const event = {
                        id: `event_${Date.now()}`,
                        driverId,
                        type: "speeding_violation",
                        zoneId,
                        zoneName: zone.name,
                        currentSpeed: location.speed,
                        speedLimit: zone.speed_limit,
                        overage: Math.round(location.speed - zone.speed_limit),
                        timestamp: location.timestamp,
                        severity: this.getSpeedingS  everity(
                            location.speed - zone.speed_limit,
            ),
                };

                events.push(event);

                logger.warn("Speeding violation detected", {
                    driverId,
                    zone: zone.name,
                    overage: event.overage,
                });
            }
        }

      return events;
    } catch(err) {
        logger.error("Speeding check failed", { driverId, err });
        return [];
    }
}

  /**
   * Execute automated actions on zone entry/exit
   * @param {string} driverId
   * @param {Object} zone
   * @param {string} trigger - entry or exit
   * @returns {Promise<Array>}
   */
  async executeZoneActions(driverId, zone, trigger) {
    try {
        const actions = [];

        for (const action of zone.automatedActions) {
            if (action.trigger !== trigger) continue;

            switch (action.type) {
                case "send_notification":
                    actions.push({
                        type: "notification",
                        recipient: action.recipient,
                        message: action.message,
                        executed: true,
                    });
                    break;

                case "log_entry":
                    actions.push({
                        type: "log",
                        logType: action.logType,
                        executed: true,
                    });
                    break;

                case "trigger_inspection":
                    if (trigger === "entry") {
                        actions.push({
                            type: "inspection",
                            inspectionType: action.inspectionType,
                            severity: action.severity,
                            executed: true,
                        });
                    }
                    break;

                case "insurance_claim":
                    if (zone.type === "incident_zone") {
                        actions.push({
                            type: "claim",
                            claimType: "incident_report",
                            executed: true,
                        });
                    }
                    break;
            }
        }

        return actions;
    } catch (err) {
        logger.error("Action execution failed", { driverId, zone: zone.id, err });
        return [];
    }
}

// Helper methods

isLocationInZone(location, zone) {
    if (zone.zoneType === "circular") {
        const distance = this.calculateDistance(location, zone.center);
        return distance <= zone.radius;
    } else if (zone.zoneType === "polygon") {
        return this.pointInPolygon(location, zone.polygon);
    }
    return false;
}

calculateDistance(loc1, loc2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLon = ((loc2.lon - loc1.lon) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

getDistanceFromCorridor(location, corridor) {
    let minDistance = Infinity;
    for (let i = 0; i < corridor.waypoints.length - 1; i++) {
        const d = this.distancePointToSegment(
            location,
            corridor.waypoints[i],
            corridor.waypoints[i + 1],
        );
        minDistance = Math.min(minDistance, d);
    }
    return minDistance;
}

distancePointToSegment(point, segStart, segEnd) {
    const dx = segEnd.lon - segStart.lon;
    const dy = segEnd.lat - segStart.lat;
    let t = ((point.lon - segStart.lon) * dx + (point.lat - segStart.lat) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    return this.calculateDistance(point, {
        lat: segStart.lat + t * dy,
        lon: segStart.lon + t * dx,
    });
}

pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (
            polygon[i].lon > point.lon !== polygon[j].lon > point.lon &&
            point.lat <
            ((polygon[j].lat - polygon[i].lat) * (point.lon - polygon[i].lon)) /
            (polygon[j].lon - polygon[i].lon) +
            polygon[i].lat
        ) {
            inside = !inside;
        }
    }
    return inside;
}

getDeviationSeverity(deviation, corridorWidth) {
    if (deviation > corridorWidth * 2) return "critical";
    if (deviation > corridorWidth * 1.5) return "high";
    return "medium";
}

getSpeedingSeverity(overage) {
    if (overage > 20) return "critical";
    if (overage > 10) return "high";
    return "warning";
}

recordZoneHistory(driverId, event) {
    const history = this.zoneHistory.get(driverId) || [];
    history.push(event);
    this.zoneHistory.set(driverId, history.slice(-100)); // keep last 100
}
}

module.exports = new AdvancedGeofencingService();
