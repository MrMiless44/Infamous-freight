import { PaymentEventType } from "@infamous-freight/shared";
import type { PaymentEvent } from "@infamous-freight/shared";

import { triggerEnforcementWorkflow } from "../compliance/api/enforcement";
import { logAction } from "../compliance/audit/logger";

export function handlePaymentEvent(event: PaymentEvent): void {
  if (event.type !== PaymentEventType.CHARGEBACK) {
    return;
  }

  const chargebackReason =
    typeof event.payload["reason"] === "string" ? event.payload["reason"] : "chargeback";

  logAction("payment.chargeback", {
    eventId: event.id,
    userId: event.userId,
    payload: event.payload,
    reason: chargebackReason,
  });

  triggerEnforcementWorkflow(event.userId, chargebackReason);
}

/**
 * Public adapter for routing payment webhooks into the chargeback handler.
 * This is intended to be called by API webhook routes or other integration layers.
 */
export function processPaymentEvent(event: PaymentEvent): void {
  handlePaymentEvent(event);
}
