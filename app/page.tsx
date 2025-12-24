import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ClipioAI – Turn Videos Into Viral Clips",
  description:
    "Submit your videos and get clear, actionable feedback to turn them into viral short-form content.",
};

function CtaLink({
  href,
  variant,
  children,
  className = "",
}: {
  href: string;
  variant: "primary" | "secondary" | "dark";
  children: React.ReactNode;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : variant === "dark"
      ? "bg-black text-white hover:opacity-90"
      : "border border-gray-300 hover:bg-gray-100";

  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Turn Any Video Into <span className="text-blue-600">Viral Clips</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10">
          Upload a video. Get clear hook, pacing, and retention feedback creators
          actually use to grow.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <CtaLink href="/pricing" variant="primary">
            Get Started
          </CtaLink>

          <CtaLink href="/dashboard" variant="secondary">
            View Dashboard
          </CtaLink>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            How ClipioAI Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-white rounded-xl shadow">
              <h3 className="text-xl font-semibold mb-2">1. Upload</h3>
              <p className="text-gray-600">
                Upload a video or paste a TikTok link in seconds.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow">
              <h3 className="text-xl font-semibold mb-2">2. Analyze</h3>
              <p className="text-gray-600">
                We review hooks, pacing, and retention drop-offs.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow">
              <h3 className="text-xl font-semibold mb-2">3. Improve</h3>
              <p className="text-gray-600">
                Get actionable feedback you can apply immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-10">Simple Pricing</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="border rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <p className="text-gray-600 mb-4">10 credits / month</p>

              <CtaLink href="/pricing" variant="dark" className="w-full px-6 py-3">
                Choose Starter
              </CtaLink>
            </div>

            <div className="border rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-gray-600 mb-4">30 credits / month</p>

              <CtaLink href="/pricing" variant="primary" className="w-full px-6 py-3">
                Choose Pro
              </CtaLink>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8 text-center text-gray-500">
        © {new Date().getFullYear()} ClipioAI. All rights reserved.
      </footer>
    </main>
  );
}
