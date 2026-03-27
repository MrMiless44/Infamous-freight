import {
  PAYMENT_LINKS,
  type PaymentLinkType,
} from "@infamous-freight/shared/payments/config";

export function openPayLink(type: PaymentLinkType) {
  const url = PAYMENT_LINKS[type];
  if (!url) {
    throw new Error(`Missing GoDaddy pay link for ${type}`);
  }

  window.location.href = url;
}
