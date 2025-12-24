import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    const { plan } = await req.json();

    const starter = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID;
    const pro = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

    if (!starter || !pro) {
      return NextResponse.json(
        { error: "Missing Stripe price IDs in .env.local" },
        { status: 500 }
      );
    }

    const priceId = plan === "pro" ? pro : starter;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancel`,
      metadata: {
        clerkUserId: userId,
        plan,
      },
      subscription_data: {
        metadata: {
          clerkUserId: userId,
          plan,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err?.message || "Checkout failed" },
      { status: 500 }
    );
  }
}
