import { stripe } from "./stripe";
import type { UsageTotals } from "./usage-aggregator";

export async function reportUsageForTenant(params: {
  stripeSubscriptionItems: Record<string, string>; // feature -> si_...
  usage: UsageTotals; // overage only
  timestamp?: number;
}) {
  const ts = params.timestamp ?? Math.floor(Date.now() / 1000);

  for (const [feature, qty] of Object.entries(params.usage)) {
    if (!qty || qty <= 0) continue;

    const subscriptionItemId = params.stripeSubscriptionItems[feature];
    if (!subscriptionItemId) continue;

    await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity: Math.floor(qty),
      timestamp: ts,
      action: "increment",
    });
  }
}
