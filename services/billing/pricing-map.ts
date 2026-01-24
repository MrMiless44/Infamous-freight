export const AI_LOOKUP_KEYS = {
  ai_chat_1k_tokens: "ai_chat_1k_tokens",
  ai_dispatch: "ai_dispatch",
  ai_invoice_audit: "ai_invoice_audit",
  ai_route_optimization: "ai_route_optimization",
  ai_predictive_eta: "ai_predictive_eta",
  ai_fleet_health_scan: "ai_fleet_health_scan",
  ai_fraud_detection: "ai_fraud_detection",
  ai_load_match: "ai_load_match",
} as const;

export type AiMeteredFeature = keyof typeof AI_LOOKUP_KEYS;
