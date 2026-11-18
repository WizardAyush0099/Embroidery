import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAdminUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atelier Operations Sign In",
  robots: { index: false },
};

export default async function AdminLoginPage() {
  const admin = await getAdminUser();
  if (admin) redirect("/admin");

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[#1c1b1a] p-space-xl text-[#f3f0e9] lg:flex">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px] text-[#c2a267]">flare</span>
            <span className="font-display text-[20px] uppercase tracking-[0.16em]">Atelier Brodé</span>
          </div>
          <p className="mt-2 font-label-sm text-[9px] uppercase tracking-[0.2em] text-white/35">
            Operations & workshop portal
          </p>
        </div>

        <div>
          <p className="font-display text-[36px] leading-tight">
            The atelier, <span className="italic text-[#c2a267]">in real time.</span>
          </p>
          <p className="mt-3 max-w-md font-body-sm text-body-sm text-white/55">
            Manage garments, stock, orders and bespoke commissions. Every action is written straight to
            Supabase with row level security, so only the authorised atelier account can change the catalogue.
          </p>
          <div className="mt-space-lg grid grid-cols-2 gap-space-md border-t border-white/10 pt-space-md">
            {[
              { label: "Catalogue", value: "Live" },
              { label: "Storage", value: "Supabase" },
              { label: "Payments", value: "Razorpay" },
              { label: "Access", value: "Google" },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-label-sm text-[9px] uppercase tracking-wider text-white/35">{item.label}</p>
                <p className="mt-0.5 font-body-sm text-body-sm text-white/80">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="font-label-sm text-[8px] uppercase tracking-wider text-white/25">
          Restricted access · authorised Gmail accounts only
        </p>
      </div>

      <div className="flex items-center justify-center bg-surface px-margin-mobile py-space-xl">
        <div className="w-full max-w-sm">
          <div className="text-center lg:text-left">
            <span className="material-symbols-outlined text-[26px] text-secondary">lock</span>
            <h1 className="mt-2 font-display text-headline-lg text-on-surface">Atelier sign in</h1>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Use the authorised Google account for this atelier.
            </p>
          </div>

          <div className="mt-space-lg border border-outline-variant/70 bg-surface-container-lowest p-space-lg shadow-tactile">
            <LoginForm configured={isSupabaseConfigured} nextPath="/admin" />
          </div>

          <p className="mt-4 text-center font-body-sm text-[12px] text-on-surface-variant">
            <Link href="/" className="text-secondary underline underline-offset-4">
              Return to the storefront
            </Link>
          </p>
          <p className="mt-2 text-center font-label-sm text-[8px] uppercase tracking-wider text-outline">
            Access is verified against ADMIN_EMAILS and the admin_users table
          </p>
        </div>
      </div>
    </div>
  );
}
