export const PAYMENT_LINKS = {
  BOOKING: process.env.NEXT_PUBLIC_PAYMENT_LINK_BOOKING ?? "https://your-link-1",
  DISPATCH: process.env.NEXT_PUBLIC_PAYMENT_LINK_DISPATCH ?? "https://your-link-2",
  RESERVATION: process.env.NEXT_PUBLIC_PAYMENT_LINK_RESERVATION ?? "https://your-link-3",
  PREMIUM: process.env.NEXT_PUBLIC_PAYMENT_LINK_PREMIUM ?? "https://your-link-4",
} as const;

export type PaymentLinkType = keyof typeof PAYMENT_LINKS;
