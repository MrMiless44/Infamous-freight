import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { activeCompanyId } = await requireActiveCompany(req);

  const { data: billing } = await supabaseAdmin
    .from("company_billing")
    .select("stripe_customer_id")
    .eq("company_id", activeCompanyId)
    .single();

  if (!billing?.stripe_customer_id) {
    return jsonWithRequestId(req, { error: "No stripe customer yet" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${appUrl}/dashboard`,
  });

  return jsonWithRequestId(req, { ok: true, url: session.url });
}
