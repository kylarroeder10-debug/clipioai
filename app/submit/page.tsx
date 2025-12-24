"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/credits/use", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          router.push("/pricing");
          return;
        }
        throw new Error(data?.error || "Failed to use credits");
      }

      // ✅ Credits deducted — continue submission flow
      // For now, just confirm success:
      alert(`Credits used! Remaining: ${data.remaining}`);

      // TODO: proceed to upload/analyze step
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">Submit a Video</h1>
        <p className="text-gray-600 mb-8">
          Each submission costs <strong>2 credits</strong>.
        </p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Checking credits..." : "Submit (2 credits)"}
        </button>
      </div>
    </main>
  );
}
