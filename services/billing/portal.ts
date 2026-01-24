import { stripe } from "./stripe";

export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}
