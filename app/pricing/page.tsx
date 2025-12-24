"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [loading, setLoading] = useState<null | "starter" | "pro">(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: "starter" | "pro") {
    try {
      setError(null);
      setLoading(plan);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Checkout failed (${res.status})`);
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("No checkout URL returned.");
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Pricing</h1>
        <p className="text-gray-600 mb-8">
          Choose a plan to get monthly credits.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}{" "}
            {error.toLowerCase().includes("unauthorized") && (
              <>
                — <Link className="underline" href="/sign-in">Sign in</Link>
              </>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h2 className="text-xl font-semibold">Starter</h2>
            <p className="text-gray-600 mb-4">10 credits / month</p>
            <button
              onClick={() => startCheckout("starter")}
              disabled={loading !== null}
              className="w-full px-6 py-3 rounded-lg bg-black text-white font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {loading === "starter" ? "Redirecting..." : "Buy Starter"}
            </button>
          </div>

          <div className="border rounded-xl p-6">
            <h2 className="text-xl font-semibold">Pro</h2>
            <p className="text-gray-600 mb-4">30 credits / month</p>
            <button
              onClick={() => startCheckout("pro")}
              disabled={loading !== null}
              className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading === "pro" ? "Redirecting..." : "Buy Pro"}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <Link className="underline text-gray-700" href="/">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
