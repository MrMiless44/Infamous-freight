# Recommendation Expansion Notes

## Generation Process
- **1000 Pack:** Created by taking the 100 enriched recommendations and generating 10 variations each using a round-robin assignment of 8 personas, 6 contexts, and 6 metrics.
- **21000 Pack:** Created by generating 210 variations per base recommendation (100 * 210 = 21,000). Variations are systematic, incorporating combinations of Region, Fleet Size, and Freight Mode to ensure unique scenarios.

## How to Filter
- **By Persona:** Use the `scenarioPersona` field to narrow down to specific user types (e.g., "Dispatcher").
- **By Priority:** Filter by the original `priority` or the calculated `roiScore`.
- **By Scenario:** Use `scenarioContext` to find performance recommendations linked to specific market events like "Port Congestion".
- **Search:** The `recommendation` text now includes the fleet size and freight mode (e.g., "Enterprise Ocean operations").
