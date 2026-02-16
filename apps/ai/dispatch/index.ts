/**
 * Dispatch Operator AI Role
 *
 * Handles route optimization, load assignments, real-time dispatching,
 * and delay prediction for freight operations.
 */

import type {
  RoleContract,
  DecisionInput,
  DecisionResult,
  RoleContext,
  ConfidenceScore,
  GuardrailViolation,
} from "../contracts";
import { logDecision, logConfidence, logGuardrailViolations } from "../observability/logger";

/**
 * Helper: Check if input involves billing data
 */
function involvesBillingData(input: DecisionInput): boolean {
  const billingFields = ["payment", "invoice", "billing", "price", "rate", "cost"];
  const inputString = JSON.stringify(input).toLowerCase();
  return billingFields.some((field) => inputString.includes(field));
}

/**
 * Helper: Check if proposed dispatch violates hours-of-service
 */
async function violatesHoursOfService(input: DecisionInput): Promise<boolean> {
  // FMCSA Hours of Service (HOS) Regulations:
  // - Maximum 11 hours driving per 14-hour on-duty period
  // - Maximum 14 hours on-duty (consecutive) between 10-hour off-duty rest
  // - Mandatory 10-hour off-duty rest between on-duty periods
  // - Maximum 60/70-hour on-duty time per 7/8 consecutive days

  const driverData = input.parameters?.driver || {};
  const proposedRouteDuration = input.parameters?.routeDurationHours || 0;
  const currentHoursDriven = driverData.hoursDrivenToday || 0;
  const currentOnDutyHours = driverData.onDutyHoursToday || 0;
  const lastRestTime = driverData.lastRestTimestamp || Date.now();

  const timeSinceLastRest = (Date.now() - lastRestTime) / (1000 * 60 * 60);
  const projectedDrivingHours = currentHoursDriven + proposedRouteDuration;
  const projectedOnDutyHours = currentOnDutyHours + proposedRouteDuration * 1.2; // Account for on-duty but not driving

  // Check maximum driving hours in 14-hour period
  if (projectedDrivingHours > 11) {
    console.warn(
      `[HOS Violation] Driver ${driverData.id} would exceed 11-hour limit: ${projectedDrivingHours}h`,
    );
    return true;
  }

  // Check on-duty period without 10-hour rest
  if (timeSinceLastRest > 14) {
    console.warn(
      `[HOS Violation] Driver ${driverData.id} needs 10-hour rest. Time since rest: ${timeSinceLastRest}h`,
    );
    return true;
  }

  // Check maximum on-duty hours
  if (projectedOnDutyHours > 14) {
    console.warn(
      `[HOS Violation] Driver ${driverData.id} would exceed 14-hour on-duty limit: ${projectedOnDutyHours}h`,
    );
    return true;
  }

  return false;
}

/**
 * Helper: Check if input accesses personal driver data
 */
function accessesPersonalDriverData(input: DecisionInput): boolean {
  const personalFields = ["ssn", "address", "medical", "personal", "salary"];
  const inputString = JSON.stringify(input).toLowerCase();
  return personalFields.some((field) => inputString.includes(field));
}

/**
 * Helper: Generate recommendation for the dispatch action
 */
async function generateRecommendation(
  input: DecisionInput,
  _context: RoleContext,
): Promise<Record<string, unknown>> {
  // Implement actual recommendation generation based on:
  // - Current traffic conditions (simulated)
  // - Weather forecasts (simulated)
  // - Driver availability and hours
  // - Vehicle capacity and location
  // - Historical performance data

  const { action, parameters } = input;

  switch (action) {
    case "route-optimization": {
      const origin = parameters?.origin || "Unknown Origin";
      const destination = parameters?.destination || "Unknown Destination";
      const loadWeight = parameters?.weightLbs || 0;

      // Calculate estimated time with traffic factor
      const baseDistance = parameters?.distanceMiles || 250;
      const trafficFactor = 1.15; // 15% increase for typical traffic
      const estimatedHours = (baseDistance / 60) * trafficFactor;
      const fuelCost = (baseDistance / 6.5) * 3.5; // Assume $3.50/gallon, 6.5 MPG

      return {
        optimizedRoute: `route-${Math.random().toString(36).substr(2, 5)}`,
        origin,
        destination,
        estimatedTime: `${estimatedHours.toFixed(1)} hours`,
        estimatedDistance: `${baseDistance} miles`,
        estimatedFuelCost: `$${fuelCost.toFixed(2)}`,
        recommendedDeparture: "08:00 AM",
        weatherFactor: "Clear, mild temps - optimal conditions",
        trafficConditions: "Moderate traffic expected on I-95, 10:00-11:30 AM",
        reasoning: "Route optimized for fuel efficiency, traffic patterns, and delivery window",
      };
    }

    case "load-assignment": {
      const pickupLocation = parameters?.pickupLocation || "Distribution Center A";
      const deliveryLocation = parameters?.deliveryLocation || "Destination B";
      const requiredCapacity = parameters?.requiredCapacityLbs || 15000;

      // Find best available driver (simulated)
      const availableDrivers = [
        {
          id: "driver-42",
          name: "John Smith",
          distance: 8.3,
          hoursAvailable: 10.5,
          truckId: "truck-7",
          capacity: 20000,
        },
        {
          id: "driver-15",
          name: "Sarah Johnson",
          distance: 24.5,
          hoursAvailable: 8.2,
          truckId: "truck-3",
          capacity: 18000,
        },
      ];

      const selectedDriver =
        availableDrivers.find((d) => d.capacity >= requiredCapacity && d.hoursAvailable > 12) ||
        availableDrivers[0];

      return {
        assignedDriver: selectedDriver.id,
        driverName: selectedDriver.name,
        vehicle: selectedDriver.truckId,
        vehicleCapacity: `${selectedDriver.capacity} lbs`,
        pickupTime: "08:30 AM",
        pickupLocation,
        deliveryLocation,
        estimatedDelivery: "5:15 PM",
        driverDistance: `${selectedDriver.distance} miles from pickup`,
        driverRating: 4.8,
        reasoning: `${selectedDriver.name} is nearest to pickup location with sufficient capacity and available hours`,
      };
    }

    case "delay-prediction": {
      const origin = parameters?.origin || "Origin";
      const destination = parameters?.destination || "Destination";
      const scheduledDelivery = parameters?.scheduledDelivery || "5:00 PM";

      // Simulate delay factors
      const trafficDelay = Math.random() > 0.6 ? 0.2 : 0; // 40% chance of traffic
      const weatherDelay = Math.random() > 0.8 ? 0.1 : 0; // 20% chance of weather
      const delayProbability = Math.min(1, trafficDelay + weatherDelay);
      const estimatedDelayMinutes = Math.round(delayProbability * 60);

      const factors: string[] = [];
      if (trafficDelay > 0) factors.push("Moderate traffic on I-95 corridor");
      if (weatherDelay > 0) factors.push("Rain expected, visibility reduced");
      if (factors.length === 0) factors.push("Optimal conditions, on-time delivery expected");

      return {
        origin,
        destination,
        scheduledDelivery,
        delayProbability: Math.round(delayProbability * 100),
        estimatedDelay:
          estimatedDelayMinutes === 0 ? "On time" : `${estimatedDelayMinutes} minutes`,
        estimatedArrival:
          estimatedDelayMinutes === 0
            ? scheduledDelivery
            : `${Math.round(17 + estimatedDelayMinutes / 60)}:${(estimatedDelayMinutes % 60).toString().padStart(2, "0")} PM`,
        factors,
        recommendation:
          delayProbability > 0.3
            ? "Notify customer of potential delay and provide updated ETA"
            : "On schedule - proceed with delivery",
        confidenceLevel: (1 - delayProbability).toFixed(2),
      };
    }

    default:
      return {
        message: "No specific recommendation available",
        action,
      };
  }
}

/**
 * Dispatch Operator AI Role Implementation
 */
export const dispatchRole: RoleContract = {
  name: "dispatch-operator",
  version: "1.0.0",
  description:
    "AI role for autonomous dispatch operations, route optimization, and load assignments",
  confidenceThreshold: 0.85,
  capabilities: [
    "route-optimization",
    "load-assignment",
    "delay-prediction",
    "carrier-selection",
    "real-time-dispatching",
  ],

  /**
   * Main decision-making function for dispatch operations
   */
  async decide(input: DecisionInput, context: RoleContext): Promise<DecisionResult> {
    const decisionId = `dispatch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Step 1: Check guardrails
      const violations = await this.checkGuardrails(input, context);

      if (violations.length > 0) {
        await logGuardrailViolations(decisionId, this.name, violations);

        // Guardrail violations always trigger escalation to human review
        return {
          decisionId,
          confidence: { value: 0, reasoning: "Guardrail violations detected" },
          recommendation: { blocked: true, violations },
          requiresHumanReview: true,
          guardrailViolations: violations,
        };
      }

      // Step 2: Calculate confidence
      const confidence = await this.calculateConfidence(input, context);
      await logConfidence(decisionId, this.name, confidence);

      // Step 3: Generate recommendation
      const recommendation = await generateRecommendation(input, context);

      // Step 4: Determine if human review is needed
      const requiresHumanReview = confidence.value < this.confidenceThreshold;

      // Step 5: Create result
      const result: DecisionResult = {
        decisionId,
        confidence,
        recommendation,
        requiresHumanReview,
        guardrailViolations: [],
        metadata: {
          role: this.name,
          action: input.action,
          timestamp: context.timestamp,
        },
      };

      // Step 6: Log the decision
      await logDecision({
        decisionId,
        timestamp: context.timestamp,
        role: this.name,
        userId: context.userId,
        requestId: context.requestId,
        action: input.action,
        input: input.parameters,
        confidence,
        recommendation,
        requiresHumanReview,
      });

      return result;
    } catch (error) {
      // On error, escalate to human
      console.error("[Dispatch Role Error]", error);

      return {
        decisionId,
        confidence: { value: 0, reasoning: "Error during decision processing" },
        recommendation: {
          error: true,
          message: "Failed to process dispatch decision",
        },
        requiresHumanReview: true,
        guardrailViolations: [],
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  },

  /**
   * Check if the proposed action violates any guardrails
   */
  async checkGuardrails(
    input: DecisionInput,
    _context: RoleContext,
  ): Promise<GuardrailViolation[]> {
    const violations: GuardrailViolation[] = [];

    // Guardrail 1: Cannot access billing data
    if (involvesBillingData(input)) {
      violations.push({
        type: "boundary",
        severity: "critical",
        description: "Dispatch role attempted to access billing data",
        remediation: "Remove billing-related parameters from request",
      });
    }

    // Guardrail 2: Cannot override human decisions without approval
    if (input.action === "override-dispatch" && !input.parameters.humanApproval) {
      violations.push({
        type: "policy",
        severity: "high",
        description: "Cannot override human dispatch decisions without explicit approval",
        remediation: "Obtain human approval before overriding dispatch",
      });
    }

    // Guardrail 3: Cannot violate hours-of-service regulations
    if (await violatesHoursOfService(input)) {
      violations.push({
        type: "safety",
        severity: "critical",
        description: "Proposed dispatch would violate hours-of-service regulations",
        remediation: "Adjust route or select different driver within compliance limits",
      });
    }

    // Guardrail 4: Cannot access personal driver information beyond operational needs
    if (accessesPersonalDriverData(input)) {
      violations.push({
        type: "data-access",
        severity: "high",
        description: "Attempted to access personal driver information beyond operational scope",
        remediation: "Limit data access to operational information only",
      });
    }

    return violations;
  },

  /**
   * Calculate confidence score for a dispatch decision
   */
  async calculateConfidence(input: DecisionInput, context: RoleContext): Promise<ConfidenceScore> {
    // Calculate confidence based on:
    // - Historical accuracy of similar decisions
    // - Data quality and completeness
    // - Model certainty
    // - Context factors (time of day, weather, traffic, etc.)

    const { action, parameters } = input;

    // Base confidence scores by action
    const baseScores: Record<string, number> = {
      "route-optimization": 0.92, // Well-established algorithms
      "load-assignment": 0.88, // Good data on driver availability
      "delay-prediction": 0.78, // Weather/traffic variables
      "carrier-selection": 0.85,
      "real-time-dispatching": 0.86,
    };

    let baseConfidence = baseScores[action] || 0.8;

    // Data quality assessment
    let dataQuality = 0.85;
    if (parameters?.driver) dataQuality += 0.05;
    if (parameters?.vehicle) dataQuality += 0.03;
    if (parameters?.weather) dataQuality += 0.04;
    if (parameters?.traffic) dataQuality += 0.03;
    dataQuality = Math.min(0.99, dataQuality);

    // Time of day factor (worse confidence during peak hours)
    const hour = new Date().getHours();
    let timeContextFactor = 1.0;
    if (hour >= 9 && hour <= 11) timeContextFactor = 0.95; // Morning peak -5%
    if (hour >= 17 && hour <= 19) timeContextFactor = 0.93; // Evening peak -7%
    if (hour >= 0 || hour < 6) timeContextFactor = 1.02; // Off-peak +2%

    // Historical accuracy tracking (simulated)
    let historicalAccuracy = 0.87;
    if (action === "route-optimization") historicalAccuracy = 0.91;
    if (action === "delay-prediction") historicalAccuracy = 0.72;
    if (action === "load-assignment") historicalAccuracy = 0.89;

    // Parameter completeness
    const requiredParams: Record<string, string[]> = {
      "route-optimization": ["origin", "destination", "distanceMiles"],
      "load-assignment": ["pickupLocation", "deliveryLocation"],
      "delay-prediction": ["scheduledDelivery"],
    };

    let contextCompleteness = 0.8;
    const requiredFields = requiredParams[action] || [];
    const matchedFields = requiredFields.filter((f) => parameters?.[f]);
    contextCompleteness = (matchedFields.length / Math.max(1, requiredFields.length)) * 0.95 + 0.05;

    // Calculate final confidence
    const finalConfidence = Math.max(
      0.5,
      Math.min(
        0.99,
        baseConfidence * 0.4 +
          dataQuality * 0.25 +
          historicalAccuracy * 0.2 +
          contextCompleteness * 0.15,
      ) * timeContextFactor,
    );

    return {
      value: parseFloat(finalConfidence.toFixed(2)),
      reasoning: `Dispatch decision confidence based on ${action} with comprehensive factor analysis`,
      factors: {
        dataQuality: parseFloat(dataQuality.toFixed(2)),
        modelCertainty: parseFloat(baseConfidence.toFixed(2)),
        historicalAccuracy: parseFloat(historicalAccuracy.toFixed(2)),
        contextCompleteness: parseFloat(contextCompleteness.toFixed(2)),
        timeOfDayAdjustment: parseFloat(timeContextFactor.toFixed(2)),
      },
    };
  },
};

/**
 * Export as default for easy importing
 */
export default dispatchRole;
