import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Your Commission",
  description: "Follow your Atelier Brodé order through proofing, production and white-glove dispatch.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; email?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = (params.order ?? "").trim();
  const email = (params.email ?? "").trim().toLowerCase();
  let error: string | null = null;

  if (orderNumber && email) {
    try {
      const admin = createSupabaseAdminClient();
      const { data } = await admin
        .from("orders")
        .select("id, email, order_number")
        .ilike("order_number", orderNumber)
        .maybeSingle();

      if (data && data.email.toLowerCase() === email) {
        redirect(`/orders/${data.id}?email=${encodeURIComponent(email)}`);
      }
      error = "We could not match that order number and email. Check the confirmation email and try again.";
    } catch (lookupError) {
      if (lookupError instanceof Error && lookupError.message === "NEXT_REDIRECT") throw lookupError;
      error = "Order tracking is temporarily unavailable. Please contact the concierge.";
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-margin-mobile py-space-2xl md:px-margin-tablet">
      <div className="text-center">
        <span className="material-symbols-outlined text-[30px] text-secondary">package_2</span>
        <h1 className="mt-2 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
          Track Your Commission
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Enter the order number from your confirmation email along with the email used at checkout.
        </p>
      </div>

      <form action="/track" method="get" className="mt-space-xl border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
        <label className="mb-space-md block">
          <span className="atelier-label">Order number</span>
          <input name="order" defaultValue={orderNumber} placeholder="AB-26-1001" className="atelier-input" required />
        </label>
        <label className="mb-space-md block">
          <span className="atelier-label">Email</span>
          <input type="email" name="email" defaultValue={email} placeholder="you@example.com" className="atelier-input" required />
        </label>

        {error && (
          <p role="alert" className="mb-space-md border border-error/30 bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full">
          Track order
        </button>

        <p className="mt-3 text-center font-body-sm text-[12px] text-on-surface-variant">
          Signed in?{" "}
          <Link href="/account" className="text-secondary underline underline-offset-4">
            See every order in your account
          </Link>
          .
        </p>
      </form>

      <div className="mt-space-lg grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: "draw", title: "Digital proof", body: "Macro proof within 24 hours for embroidered pieces." },
          { icon: "precision_manufacturing", title: "Atelier stitching", body: "Hand-guided and multi-head needlework." },
          { icon: "local_shipping", title: "White-glove dispatch", body: "Tracked, insured and wrapped in linen." },
        ].map((item) => (
          <div key={item.title} className="border border-outline-variant/60 bg-surface-container-low p-space-sm">
            <span className="material-symbols-outlined text-[18px] text-secondary">{item.icon}</span>
            <p className="mt-1 font-label-md text-label-md uppercase tracking-wider">{item.title}</p>
            <p className="mt-1 font-body-sm text-[12px] text-on-surface-variant">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
