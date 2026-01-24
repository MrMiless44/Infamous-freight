import { stripe } from "./stripe";
import type { AiMeteredFeature } from "./pricing-map";

function featureKeyFromLookupKey(lookupKey: string | null): AiMeteredFeature | null {
  if (!lookupKey) return null;
  const allowed = new Set([
    "ai_chat_1k_tokens",
    "ai_dispatch",
    "ai_invoice_audit",
    "ai_route_optimization",
    "ai_predictive_eta",
    "ai_fleet_health_scan",
    "ai_fraud_detection",
    "ai_load_match",
  ]);
  return allowed.has(lookupKey) ? (lookupKey as AiMeteredFeature) : null;
}

// You must implement these against your DB
async function upsertTenantBillingFromSubscription(args: {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  items: Record<string, string>; // feature -> si_...
  plan: string | null;
  tenantId: string | null;
}) {
  // TODO: persist in DB
  void args;
}

export async function handleSubscriptionUpsert(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });

  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const items: Record<string, string> = {};
  for (const it of sub.items.data) {
    const price = it.price;
    const lookupKey = (price as { lookup_key?: string | null }).lookup_key ?? null;
    const key = featureKeyFromLookupKey(lookupKey);
    if (key) items[key] = it.id;
  }

  const tenantId = (sub.metadata?.tenantId as string) ?? null;
  const plan = (sub.metadata?.plan as string) ?? null;

  await upsertTenantBillingFromSubscription({
    stripeCustomerId,
    stripeSubscriptionId: sub.id,
    items,
    plan,
    tenantId,
  });
}
