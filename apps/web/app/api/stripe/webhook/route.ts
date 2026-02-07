import Stripe from "stripe";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await req.text();
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const { data, error } = await supabaseAdmin
      .from("company_billing")
      .update({ status: "active" })
      .eq("stripe_customer_id", invoice.customer as string)
      .select();

    if (error) {
      return new Response("Failed to update billing status", { status: 500 });
    }

    if (!data || data.length === 0) {
      return new Response("Billing record not found", { status: 404 });
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const { data, error } = await supabaseAdmin
      .from("company_billing")
      .update({ status: "past_due" })
      .eq("stripe_customer_id", invoice.customer as string)
      .select();

    if (error) {
      return new Response("Failed to update billing status", { status: 500 });
    }

    if (!data || data.length === 0) {
      return new Response("Billing record not found", { status: 404 });
    }
  }

  return new Response("ok");
}
