import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function planToCredits(plan?: string) {
  if (plan === "pro") return 30;
  if (plan === "starter") return 10;
  return 0;
}

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verify failed:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // When someone successfully checks out (first subscription)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const clerkUserId = session.metadata?.clerkUserId;
      const plan = session.metadata?.plan; // "starter" | "pro"
      const email = session.customer_details?.email ?? session.customer_email ?? null;

      if (!clerkUserId) {
        console.warn("Missing clerkUserId in checkout metadata");
        return NextResponse.json({ received: true });
      }

      const monthlyCredits = planToCredits(plan);
      const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
      const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;

      const { error } = await supabaseAdmin.from("users").upsert(
        {
          clerk_user_id: clerkUserId,
          email,
          plan: plan ?? "free",
          monthly_credits: monthlyCredits,
          used_credits: 0,
          remaining_credits: monthlyCredits,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clerk_user_id" }
      );

      if (error) throw error;
      console.log("✅ credits set (checkout completed):", { clerkUserId, plan, monthlyCredits });
    }

    // Monthly renewal: reset credits when invoice is paid
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (!subId) return NextResponse.json({ received: true });

      const sub = await stripe.subscriptions.retrieve(subId);
      const clerkUserId = sub.metadata?.clerkUserId;
      const plan = sub.metadata?.plan;

      if (!clerkUserId) return NextResponse.json({ received: true });

      const monthlyCredits = planToCredits(plan);

      const { error } = await supabaseAdmin
        .from("users")
        .update({
          plan: plan ?? "free",
          monthly_credits: monthlyCredits,
          used_credits: 0,
          remaining_credits: monthlyCredits,
          stripe_status: sub.status,
          stripe_subscription_id: sub.id,
          stripe_customer_id: typeof sub.customer === "string" ? sub.customer : null,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", clerkUserId);

      if (error) throw error;
      console.log("✅ credits reset (invoice paid):", { clerkUserId, plan, monthlyCredits });
    }

    // Cancel / status changes
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const clerkUserId = sub.metadata?.clerkUserId;
      if (!clerkUserId) return NextResponse.json({ received: true });

      const { error } = await supabaseAdmin
        .from("users")
        .update({
          plan: "free",
          monthly_credits: 0,
          remaining_credits: 0,
          stripe_status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", clerkUserId);

      if (error) throw error;
      console.log("✅ subscription canceled:", { clerkUserId });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Webhook failed" }, { status: 500 });
  }
}
