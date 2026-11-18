import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { adminSettings } from "@/lib/admin-data";
import { defaultSettings } from "@/lib/catalog";
import {
  SUPABASE_URL,
  adminEmails,
  isRazorpayConfigured,
  isSupabaseConfigured,
} from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atelier Settings",
  robots: { index: false },
};

export default async function AdminSettingsPage() {
  const settings = (await adminSettings()) ?? defaultSettings;
  const razorpayMode = process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live")
    ? "Live keys"
    : process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test")
      ? "Test keys"
      : "Not connected";

  const integrations = [
    {
      name: "Supabase database & auth",
      status: isSupabaseConfigured ? "Connected" : "Missing env",
      detail: isSupabaseConfigured
        ? new URL(SUPABASE_URL).host
        : "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ok: isSupabaseConfigured,
    },
    {
      name: "Service role (server only)",
      status: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Configured" : "Missing env",
      detail: "Required for checkout, uploads and admin writes",
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    {
      name: "Razorpay payments",
      status: isRazorpayConfigured ? razorpayMode : "Not configured",
      detail: isRazorpayConfigured
        ? "Signature verification active on the server"
        : "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable online payment",
      ok: isRazorpayConfigured,
    },
    {
      name: "Admin allow-list",
      status: adminEmails.length > 0 ? `${adminEmails.length} address(es)` : "Database only",
      detail: adminEmails.length > 0 ? adminEmails.join(", ") : "Add ADMIN_EMAILS or manage admin_users",
      ok: adminEmails.length > 0,
    },
    {
      name: "Image storage",
      status: "Supabase Storage",
      detail: "product-images (public) · custom-references (private, signed URLs)",
      ok: true,
    },
  ];

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-2 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
            Atelier configuration
          </span>
          <h1 className="mt-1 font-display text-headline-lg">Atelier settings</h1>
        </div>
        <p className="max-w-sm font-body-sm text-[11px] text-on-surface-variant">
          These values drive the storefront announcement, delivery fees, contact details and checkout
          payment options.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-12">
        <div className="xl:col-span-8">
          <SettingsForm settings={settings} />
        </div>

        <aside className="flex flex-col gap-space-md xl:col-span-4">
          <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <h2 className="mb-space-sm font-headline-sm text-headline-sm">Integrations</h2>
            <div className="flex flex-col divide-y divide-outline-variant/50">
              {integrations.map((item) => (
                <div key={item.name} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-body-sm text-[12px] font-semibold">{item.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${
                      item.ok
                        ? "border-[#c5d8bf] bg-[#e7efe4] text-[#3d5a38]"
                        : "border-[#ddcfae] bg-[#f3ecdd] text-[#7a5a1e]"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-0.5 break-words font-body-sm text-[10px] text-outline">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <h2 className="mb-space-sm font-headline-sm text-headline-sm">Access control</h2>
            <p className="font-body-sm text-[11px] leading-relaxed text-on-surface-variant">
              Admin access requires a Google sign-in whose email appears in{" "}
              <code className="rounded bg-surface-container px-1 py-0.5 text-[10px]">admin_users</code> or the{" "}
              <code className="rounded bg-surface-container px-1 py-0.5 text-[10px]">ADMIN_EMAILS</code>{" "}
              environment variable. Row Level Security independently enforces the same list for database
              writes.
            </p>
            <p className="mt-2 font-body-sm text-[11px] text-outline">
              To revoke access, delete the row from admin_users and remove the env address.
            </p>
          </section>

          <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <h2 className="mb-space-sm font-headline-sm text-headline-sm">Runbook</h2>
            <ol className="list-decimal space-y-1 pl-4 font-body-sm text-[11px] leading-relaxed text-on-surface-variant">
              <li>Run supabase/schema.sql once in the Supabase SQL editor.</li>
              <li>Enable the Google provider in Supabase Auth and add the callback URL.</li>
              <li>Set ADMIN_EMAILS and insert the same address into admin_users.</li>
              <li>Add Razorpay keys as project secrets to accept online payment.</li>
              <li>Publish products — the storefront reads the database on every request.</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
