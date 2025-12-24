import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabaseServer";

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) {
    // middleware should prevent this, but just in case
    return (
      <main className="min-h-screen bg-white text-black px-6 py-16">
        <div className="max-w-3xl mx-auto">Not signed in.</div>
      </main>
    );
  }

  const { data, error } = await supabaseServer
    .from("users")
    .select("plan, monthly_credits, used_credits, remaining_credits, stripe_status")
    .eq("clerk_user_id", userId)
    .single();

  // If user exists in Clerk but not yet in DB (never bought)
  const plan = data?.plan ?? "free";
  const monthly = data?.monthly_credits ?? 0;
  const used = data?.used_credits ?? 0;
  const remaining = data?.remaining_credits ?? 0;
  const status = data?.stripe_status ?? "inactive";

  return (
    <main className="min-h-screen bg-white text-black px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Your plan and credits are tracked automatically.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            Couldn&apos;t load your credits yet. If you just subscribed, refresh
            in a second.
          </div>
        )}

        <div className="border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm text-gray-500">Plan</div>
              <div className="text-xl font-semibold">{cap(plan)}</div>
              <div className="text-sm text-gray-500">Status: {status}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Credits remaining</div>
              <div className="text-4xl font-bold">{remaining}</div>
              <div className="text-sm text-gray-500">
                Used: {used} • Monthly: {monthly}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/submit"
            className="inline-flex justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Submit a video (2 credits)
          </Link>

          <Link
            href="/pricing"
            className="inline-flex justify-center px-6 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-100"
          >
            {plan === "free" ? "Get credits" : "Manage / Upgrade"}
          </Link>
        </div>

        <div className="mt-10 text-sm text-gray-500">
          {plan === "free" ? (
            <p>
              You&apos;re on Free. Subscribe to get monthly credits and start submitting.
            </p>
          ) : (
            <p>
              Credits refill monthly after successful invoice payment.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
