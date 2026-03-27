export const PAYMENT_LINKS = {
  BOOKING: process.env.NEXT_PUBLIC_GODADDY_BOOKING_LINK ?? "",
  DISPATCH: process.env.NEXT_PUBLIC_GODADDY_DISPATCH_LINK ?? "",
  RESERVATION: process.env.NEXT_PUBLIC_GODADDY_RESERVATION_LINK ?? "",
  PREMIUM: process.env.NEXT_PUBLIC_GODADDY_PREMIUM_LINK ?? "",
} as const;

export type PaymentLinkType = keyof typeof PAYMENT_LINKS;
