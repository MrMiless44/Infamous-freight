const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required payment link environment variable: ${name}`);
  }
  return value;
};

export const PAYMENT_LINKS = {
  BOOKING: getRequiredEnv("NEXT_PUBLIC_PAYMENT_LINK_BOOKING"),
  DISPATCH: getRequiredEnv("NEXT_PUBLIC_PAYMENT_LINK_DISPATCH"),
  RESERVATION: getRequiredEnv("NEXT_PUBLIC_PAYMENT_LINK_RESERVATION"),
  PREMIUM: getRequiredEnv("NEXT_PUBLIC_PAYMENT_LINK_PREMIUM"),
} as const;

export type PaymentLinkType = keyof typeof PAYMENT_LINKS;
