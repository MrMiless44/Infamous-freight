const { stripeClient } = require("./stripe");
const persist = require("./persist");
const { getPrisma } = require("../db/prisma");

const FEATURE_UNITS = {
  ai_routing: "run",
  ai_invoice_audit: "invoice",
  genesis_ai_agent: "tokens_1k",
  ocr_parsing: "doc",
};

// Heuristic parameters for estimating token usage from raw text length.
// We assume ~4 characters per token on average (common OpenAI/Anthropic guidance),
// and bill in units of 1,000 tokens.
//
// NOTE: This is an approximation used when we do not have provider-reported token
// counts available. For accurate billing, prefer passing real token counts from the
// AI provider into billing, and periodically validate this heuristic against actual
// usage to tune ESTIMATED_CHARS_PER_TOKEN and TOKENS_PER_BILLING_UNIT as needed.
const ESTIMATED_CHARS_PER_TOKEN = 4;
const TOKENS_PER_BILLING_UNIT = 1000;

/**
 * Estimate billable 1k-token units for a given text payload.
 *
 * The estimation is:
 *   - approximateTokens ≈ ceil(text.length / ESTIMATED_CHARS_PER_TOKEN)
 *   - units = ceil(approximateTokens / TOKENS_PER_BILLING_UNIT)
 *
 * The result is always at least 1 to avoid recording zero usage.
 *
 * This is a heuristic and may deviate from true token usage. Callers that have
 * access to actual token counts from the AI provider should prefer using those
 * counts to derive billable units instead of relying solely on this function.
 */
function estimateTokenUnits(text) {
  if (!text) return 1;
  const estimatedTokens = Math.max(
    1,
    Math.ceil(text.length / ESTIMATED_CHARS_PER_TOKEN)
  );
  return Math.max(
    1,
    Math.ceil(estimatedTokens / TOKENS_PER_BILLING_UNIT)
  );
}

async function recordUsage({
  tenantId,
  feature,
  quantity,
  timestamp,
  subscriptionItemId,
}) {
  if (!tenantId || !feature || quantity <= 0) {
    return { ok: false, reason: "missing_params" };
  }

  const stripe = stripeClient();
  const entitlements = await persist.getEntitlements(tenantId);
  const resolvedSubscriptionItemId =
    subscriptionItemId || entitlements?.stripe_ai_subscription_item_id;

  if (!stripe || !resolvedSubscriptionItemId) {
    return { ok: false, reason: "stripe_unavailable" };
  }

  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    resolvedSubscriptionItemId,
    {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action: "increment",
    }
  );

  const prisma = getPrisma();
  if (prisma) {
    await prisma.aiUsageRecord.create({
      data: {
        tenantId,
        feature,
        stripeSubscriptionItemId: resolvedSubscriptionItemId,
        quantity,
        stripeUsageRecordId: usageRecord.id,
      },
    });
  }

  return {
    ok: true,
    feature,
    unit: FEATURE_UNITS[feature] || "unit",
    quantity,
    usageRecordId: usageRecord.id,
  };
}

module.exports = {
  recordUsage,
  estimateTokenUnits,
  FEATURE_UNITS,
};
