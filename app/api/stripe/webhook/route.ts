import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs"; // Stripe webhook signature verification needs Node runtime

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

function safeJson(data: any) {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  // ✅ Next.js 15/16: headers() is async
  const h = await headers();
  const sig = h.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 }
    );
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err?.message ?? "Unknown error"}` },
      { status: 400 }
    );
  }

  // ✅ Handle events
  try {
    switch (event.type) {
      /**
       * Most important:
       * - checkout.session.completed fires when a Checkout completes.
       * - We use it to grant credits / set plan.
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // You can identify the user via:
        // - session.client_reference_id (recommended)
        // - session.metadata.userId / email
        // - session.customer_email
        const userId =
          session.client_reference_id ||
          (session.metadata?.userId as string | undefined) ||
          null;

        const email =
          session.customer_details?.email ||
          session.customer_email ||
          (session.metadata?.email as string | undefined) ||
          null;

        const plan =
          (session.metadata?.plan as string | undefined) ||
          (session.metadata?.tier as string | undefined) ||
          "starter";

        const creditsFromMetaRaw = session.metadata?.credits as
          | string
          | undefined;
        const monthlyCredits = creditsFromMetaRaw
          ? Number(creditsFromMetaRaw)
          : plan === "pro"
          ? 30
          : 10;

        // If you don’t have userId, fall back to email (if your DB schema supports it)
        if (!userId && !email) break;

        // Upsert into your "users" table (adjust column names if yours differ)
        // Common schema: id (clerk user id), email, plan, monthly_credits, used_credits, remaining_credits
        const payload: any = {
          plan,
          monthly_credits: monthlyCredits,
          used_credits: 0,
          remaining_credits: monthlyCredits,
          updated_at: new Date().toISOString(),
        };
        if (userId) payload.id = userId;
        if (email) payload.email = email;

        const { error } = await supabaseAdmin
          .from("users")
          .upsert(payload, { onConflict: userId ? "id" : "email" });

        if (error) {
          console.error("Supabase upsert users error:", error);
        }

        break;
      }

      /**
       * Optional: when subscription renews, reset monthly credits
       */
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        // If you set metadata on the subscription / customer, you can restore plan & credits on renewal
        const userId = (invoice.metadata?.userId as string | undefined) || null;
        const email =
          (invoice.customer_email as string | undefined) ||
          (invoice.metadata?.email as string | undefined) ||
          null;

        const plan =
          (invoice.metadata?.plan as string | undefined) ||
          (invoice.metadata?.tier as string | undefined) ||
          "starter";

        const creditsFromMetaRaw = invoice.metadata?.credits as
          | string
          | undefined;
        const monthlyCredits = creditsFromMetaRaw
          ? Number(creditsFromMetaRaw)
          : plan === "pro"
          ? 30
          : 10;

        if (!userId && !email) break;

        const payload: any = {
          plan,
          monthly_credits: monthlyCredits,
          used_credits: 0,
          remaining_credits: monthlyCredits,
          updated_at: new Date().toISOString(),
        };
        if (userId) payload.id = userId;
        if (email) payload.email = email;

        const { error } = await supabaseAdmin
          .from("users")
          .upsert(payload, { onConflict: userId ? "id" : "email" });

        if (error) {
          console.error("Supabase renewal upsert error:", error);
        }

        break;
      }

      /**
       * Optional: downgrade / lock when subscription fails or cancels
       */
      case "customer.subscription.deleted":
      case "invoice.payment_failed": {
        // You can implement downgrade logic here if you want.
        // For now, we do nothing.
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    // We still return 200 so Stripe doesn't spam retries for non-critical logic bugs.
    // If you want strict behavior, return 500 instead.
  }

  return NextResponse.json({ received: true, type: event.type, ok: true, event: safeJson(event) });
}
