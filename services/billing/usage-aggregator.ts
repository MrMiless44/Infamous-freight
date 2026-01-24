import type { AiMeteredFeature } from "./pricing-map";

export type UsageTotals = Record<AiMeteredFeature, number>;

export async function computeOverageForTenant(params: {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  includedTokenQuota: number;
}): Promise<UsageTotals> {
  void params;
  // TODO: query your event table(s)
  // Example outputs:
  return {
    ai_chat_1k_tokens: 0,
    ai_dispatch: 0,
    ai_invoice_audit: 0,
    ai_route_optimization: 0,
    ai_predictive_eta: 0,
    ai_fleet_health_scan: 0,
    ai_fraud_detection: 0,
    ai_load_match: 0,
  };
}
