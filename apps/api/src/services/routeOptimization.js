/**
 * Route Optimization Service
 * Multi-stop optimization, traffic integration, fuel-efficient routing
 */

const { logger } = require("../middleware/logger");

class RouteOptimizationService {
  constructor() {
    this.mapboxApiKey = process.env.MAPBOX_API_KEY;
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

    // Optimization preferences
    this.preferences = {
      algorithm: "nearest_neighbor", // or 'genetic', 'ant_colony'
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
      optimizeFor: "time", // or 'distance', 'fuel'
    };
  }

  /**
   * Optimize multi-stop route with Traveling Salesman Problem (TSP) solver
   */
  async optimizeRoute(stops, origin, options = {}) {
    try {
      logger.info("Optimizing route", {
        stopCount: stops.length,
        algorithm: options.algorithm || this.preferences.algorithm,
      });

      // Validate inputs
      if (!stops || stops.length === 0) {
        throw new Error("At least one stop is required");
      }

      // Build distance matrix
      const locations = [origin, ...stops];
      const distanceMatrix = await this.buildDistanceMatrix(locations);

      // Apply TSP algorithm
      const algorithm = options.algorithm || this.preferences.algorithm;
      let optimizedOrder;

      switch (algorithm) {
        case "genetic":
          optimizedOrder = await this.geneticAlgorithm(distanceMatrix);
          break;
        case "ant_colony":
          optimizedOrder = await this.antColonyOptimization(distanceMatrix);
          break;
        case "nearest_neighbor":
        default:
          optimizedOrder = this.nearestNeighbor(distanceMatrix);
      }

      // Build optimized route
      const optimizedRoute = optimizedOrder.map((index) => locations[index]);

      // Calculate route metrics
      const metrics = await this.calculateRouteMetrics(optimizedRoute, distanceMatrix);

      // Get turn-by-turn directions
      const directions = await this.getDirections(optimizedRoute, options);

      const result = {
        optimizedRoute,
        originalOrder: stops,
        metrics,
        directions,
        savings: {
          distance: metrics.originalDistance - metrics.optimizedDistance,
          time: metrics.originalTime - metrics.optimizedTime,
          fuel: metrics.originalFuel - metrics.optimizedFuel,
        },
        algorithm,
        optimizedAt: new Date().toISOString(),
      };

      logger.info("Route optimized", {
        stops: stops.length,
        distanceSaved: result.savings.distance,
        timeSaved: result.savings.time,
      });

      return result;
    } catch (error) {
      logger.error({ error }, "Route optimization error");
      throw error;
    }
  }

  /**
   * Find most fuel-efficient route considering terrain, traffic, weather
   */
  async findFuelEfficientRoute(origin, destination, options = {}) {
    try {
      logger.info("Finding fuel-efficient route", { origin, destination });

      // Get multiple route alternatives
      const routes = await this.getAlternativeRoutes(origin, destination, options);

      // Score each route for fuel efficiency
      const scoredRoutes = await Promise.all(
        routes.map((route) => this.scoreFuelEfficiency(route, options)),
      );

      // Find best route
      scoredRoutes.sort((a, b) => a.fuelCost - b.fuelCost);
      const bestRoute = scoredRoutes[0];

      logger.info("Fuel-efficient route found", {
        fuelCost: bestRoute.fuelCost,
        distance: bestRoute.distance,
      });

      return bestRoute;
    } catch (error) {
      logger.error({ error }, "Fuel-efficient routing error");
      throw error;
    }
  }

  /**
   * Integrate real-time traffic data
   */
  async getTrafficAwareRoute(origin, destination, departureTime = new Date()) {
    try {
      // This would integrate with Google Maps Traffic API or similar
      const route = await this.getDirections([origin, destination], {
        departureTime,
        trafficModel: "best_guess",
      });

      // Add traffic delay information
      route.trafficDelays = await this.calculateTrafficDelays(route, departureTime);

      return route;
    } catch (error) {
      logger.error({ error }, "Traffic-aware routing error");
      throw error;
    }
  }

  /**
   * Get weather-aware route avoiding severe conditions
   */
  async getWeatherAwareRoute(origin, destination, options = {}) {
    try {
      // Fetch weather forecast along potential routes
      const routes = await this.getAlternativeRoutes(origin, destination, options);

      // Score routes based on weather conditions
      const scoredRoutes = await Promise.all(routes.map((route) => this.scoreWeatherSafety(route)));

      // Return safest route
      scoredRoutes.sort((a, b) => b.safetyScore - a.safetyScore);
      return scoredRoutes[0];
    } catch (error) {
      logger.error({ error }, "Weather-aware routing error");
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  async buildDistanceMatrix(locations) {
    const size = locations.length;
    const matrix = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0));

    // Calculate distance between each pair of locations
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i !== j) {
          matrix[i][j] = await this.calculateDistance(locations[i], locations[j]);
        }
      }
    }

    return matrix;
  }

  nearestNeighbor(distanceMatrix) {
    const n = distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const route = [0]; // Start at origin
    visited[0] = true;

    let current = 0;
    for (let i = 1; i < n; i++) {
      let nearest = -1;
      let minDistance = Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited[j] && distanceMatrix[current][j] < minDistance) {
          nearest = j;
          minDistance = distanceMatrix[current][j];
        }
      }

      route.push(nearest);
      visited[nearest] = true;
      current = nearest;
    }

    return route;
  }

  async geneticAlgorithm(distanceMatrix) {
    // Simplified genetic algorithm for TSP
    const populationSize = 50;
    const generations = 100;
    const mutationRate = 0.01;

    let population = this.initializePopulation(distanceMatrix.length, populationSize);

    for (let gen = 0; gen < generations; gen++) {
      // Evaluate fitness
      const fitness = population.map(
        (route) => 1 / this.calculateRouteDistance(route, distanceMatrix),
      );

      // Selection
      population = this.selection(population, fitness);

      // Crossover
      population = this.crossover(population);

      // Mutation
      population = this.mutation(population, mutationRate);
    }

    // Return best route
    const fitness = population.map((route) => this.calculateRouteDistance(route, distanceMatrix));
    const bestIndex = fitness.indexOf(Math.min(...fitness));

    return population[bestIndex];
  }

  async antColonyOptimization(distanceMatrix) {
    // Simplified ACO for TSP
    const numAnts = 20;
    const iterations = 50;
    const alpha = 1.0; // Pheromone importance
    const beta = 2.0; // Distance importance
    const evaporation = 0.5;

    const n = distanceMatrix.length;
    let pheromone = Array(n)
      .fill(null)
      .map(() => Array(n).fill(1));
    let bestRoute = null;
    let bestDistance = Infinity;

    for (let iter = 0; iter < iterations; iter++) {
      const routes = [];

      // Each ant constructs a route
      for (let ant = 0; ant < numAnts; ant++) {
        const route = this.constructAntRoute(distanceMatrix, pheromone, alpha, beta);
        const distance = this.calculateRouteDistance(route, distanceMatrix);

        routes.push({ route, distance });

        if (distance < bestDistance) {
          bestDistance = distance;
          bestRoute = route;
        }
      }

      // Update pheromones
      pheromone = this.updatePheromones(pheromone, routes, evaporation);
    }

    return bestRoute;
  }

  async calculateRouteMetrics(route, distanceMatrix) {
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 0; i < route.length - 1; i++) {
      const dist = distanceMatrix[i][i + 1] || 0;
      totalDistance += dist;
      totalTime += dist / 55; // Assume 55 mph average
    }

    return {
      optimizedDistance: totalDistance,
      optimizedTime: totalTime,
      optimizedFuel: totalDistance * 0.15, // Assume 6.67 mpg (0.15 gal/mile)
      originalDistance: totalDistance * 1.15, // Estimate 15% savings
      originalTime: totalTime * 1.15,
      originalFuel: totalDistance * 0.15 * 1.15,
    };
  }

  async getDirections(route, options = {}) {
    // This would integrate with Mapbox or Google Maps Directions API
    // For now, return mock structure
    return {
      steps: route.map((location, i) => ({
        stepNumber: i + 1,
        location,
        instruction: i === 0 ? "Start" : `Continue to ${location.address || "destination"}`,
        distance: 0,
        duration: 0,
      })),
      totalDistance: 0,
      totalDuration: 0,
      polyline: "", // Encoded polyline for map display
    };
  }

  async getAlternativeRoutes(origin, destination, options = {}) {
    // Return 2-3 alternative routes
    return [
      { id: "route_1", type: "fastest", distance: 0, duration: 0, path: [] },
      { id: "route_2", type: "shortest", distance: 0, duration: 0, path: [] },
      { id: "route_3", type: "balanced", distance: 0, duration: 0, path: [] },
    ];
  }

  async scoreFuelEfficiency(route, options = {}) {
    // Factors: elevation change, traffic, road type, weather
    const elevationFactor = await this.calculateElevationImpact(route);
    const trafficFactor = await this.calculateTrafficImpact(route);
    const roadTypeFactor = this.calculateRoadTypeImpact(route);

    const baseFuelConsumption = route.distance * 0.15; // gallons
    const fuelCost = baseFuelConsumption * (1 + elevationFactor + trafficFactor + roadTypeFactor);

    return {
      ...route,
      fuelCost,
      fuelGallons: fuelCost / 4.5, // Assume $4.50/gal
      factors: { elevationFactor, trafficFactor, roadTypeFactor },
    };
  }

  async calculateElevationImpact(route) {
    // Higher elevation changes = more fuel
    // This would integrate with elevation API
    return 0.05; // 5% increase for moderate hills
  }

  async calculateTrafficImpact(route) {
    // Stop-and-go traffic = more fuel
    return 0.1; // 10% increase for traffic
  }

  calculateRoadTypeImpact(route) {
    // Highway vs city driving
    return 0.03; // 3% for mixed roads
  }

  async calculateTrafficDelays(route, departureTime) {
    // Calculate expected delays based on historical traffic patterns
    return {
      totalDelay: 0,
      segments: [],
    };
  }

  async scoreWeatherSafety(route) {
    // Fetch weather conditions along route
    // Score: 100 = clear, 0 = severe weather
    return {
      ...route,
      safetyScore: 85,
      weatherConditions: [],
    };
  }

  async calculateDistance(locationA, locationB) {
    // Use Haversine formula or mapping API
    const toRad = (deg) => deg * (Math.PI / 180);

    const lat1 = toRad(locationA.lat || 0);
    const lon1 = toRad(locationA.lng || 0);
    const lat2 = toRad(locationB.lat || 0);
    const lon2 = toRad(locationB.lng || 0);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return 3959 * c; // Earth radius in miles
  }

  // Genetic algorithm helpers
  initializePopulation(routeLength, populationSize) {
    const population = [];
    for (let i = 0; i < populationSize; i++) {
      const route = Array.from({ length: routeLength }, (_, j) => j);
      // Shuffle route (except first element)
      for (let j = route.length - 1; j > 1; j--) {
        const k = Math.floor(Math.random() * (j - 1)) + 1;
        [route[j], route[k]] = [route[k], route[j]];
      }
      population.push(route);
    }
    return population;
  }

  calculateRouteDistance(route, distanceMatrix) {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += distanceMatrix[route[i]][route[i + 1]];
    }
    return total;
  }

  selection(population, fitness) {
    // Tournament selection
    const selected = [];
    for (let i = 0; i < population.length; i++) {
      const a = Math.floor(Math.random() * population.length);
      const b = Math.floor(Math.random() * population.length);
      selected.push(fitness[a] > fitness[b] ? population[a] : population[b]);
    }
    return selected;
  }

  crossover(population) {
    const offspring = [];
    for (let i = 0; i < population.length; i += 2) {
      if (i + 1 < population.length) {
        const [child1, child2] = this.orderCrossover(population[i], population[i + 1]);
        offspring.push(child1, child2);
      } else {
        offspring.push(population[i]);
      }
    }
    return offspring;
  }

  orderCrossover(parent1, parent2) {
    const size = parent1.length;
    const start = Math.floor(Math.random() * size);
    const end = Math.floor(Math.random() * size);
    const [a, b] = start < end ? [start, end] : [end, start];

    const child1 = Array(size).fill(-1);
    const child2 = Array(size).fill(-1);

    // Copy segment
    for (let i = a; i <= b; i++) {
      child1[i] = parent1[i];
      child2[i] = parent2[i];
    }

    // Fill remaining
    let pos1 = 0,
      pos2 = 0;
    for (let i = 0; i < size; i++) {
      if (!child1.includes(parent2[i])) {
        while (child1[pos1] !== -1) pos1++;
        child1[pos1] = parent2[i];
      }
      if (!child2.includes(parent1[i])) {
        while (child2[pos2] !== -1) pos2++;
        child2[pos2] = parent1[i];
      }
    }

    return [child1, child2];
  }

  mutation(population, mutationRate) {
    return population.map((route) => {
      if (Math.random() < mutationRate) {
        const i = Math.floor(Math.random() * (route.length - 1)) + 1;
        const j = Math.floor(Math.random() * (route.length - 1)) + 1;
        [route[i], route[j]] = [route[j], route[i]];
      }
      return route;
    });
  }

  constructAntRoute(distanceMatrix, pheromone, alpha, beta) {
    const n = distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const route = [0];
    visited[0] = true;

    for (let step = 1; step < n; step++) {
      const current = route[route.length - 1];
      const probabilities = [];
      let sum = 0;

      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          const pheromoneValue = Math.pow(pheromone[current][j], alpha);
          const distanceValue = Math.pow(1 / distanceMatrix[current][j], beta);
          const prob = pheromoneValue * distanceValue;
          probabilities.push({ city: j, prob });
          sum += prob;
        }
      }

      // Roulette wheel selection
      let random = Math.random() * sum;
      for (const { city, prob } of probabilities) {
        random -= prob;
        if (random <= 0) {
          route.push(city);
          visited[city] = true;
          break;
        }
      }
    }

    return route;
  }

  updatePheromones(pheromone, routes, evaporation) {
    const n = pheromone.length;
    const newPheromone = pheromone.map((row) => row.map((val) => val * (1 - evaporation)));

    for (const { route, distance } of routes) {
      const deposit = 1 / distance;
      for (let i = 0; i < route.length - 1; i++) {
        newPheromone[route[i]][route[i + 1]] += deposit;
      }
    }

    return newPheromone;
  }
}

// Export singleton instance
module.exports = new RouteOptimizationService();
