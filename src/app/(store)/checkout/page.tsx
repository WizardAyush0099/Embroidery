import type { Metadata } from "next";
import { CheckoutForm } from "@/components/site/CheckoutForm";
import { getSessionUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";
import { isRazorpayConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secure Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [settings, user] = await Promise.all([getStoreSettings(), getSessionUser()]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-margin-mobile py-space-xl md:px-margin-tablet lg:px-margin">
      <div className="mb-space-xl flex flex-col justify-between gap-4 border-b border-outline-variant/70 pb-space-md md:flex-row md:items-end">
        <div>
          <span className="eyebrow">Atelier vault checkout</span>
          <h1 className="mt-1 flex items-center gap-2 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
            <span className="material-symbols-outlined text-[26px] text-secondary">lock</span>
            Encrypted Private Session
          </h1>
        </div>
        <ol className="flex flex-wrap items-center gap-3 font-label-sm text-[10px] uppercase tracking-widest text-outline">
          <li className="flex items-center gap-1.5 text-on-surface">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] text-on-primary">1</span>
            Bag
          </li>
          <li className="text-outline-variant">·</li>
          <li className="flex items-center gap-1.5 text-secondary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[9px] text-on-secondary">2</span>
            Delivery
          </li>
          <li className="text-outline-variant">·</li>
          <li className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-outline-variant text-[9px]">3</span>
            Payment
          </li>
        </ol>
      </div>

      <CheckoutForm
        shippingFee={settings.shipping_fee}
        freeShippingThreshold={settings.free_shipping_threshold}
        razorpayEnabled={isRazorpayConfigured}
        codEnabled={settings.cod_enabled}
        defaultName={(user?.user_metadata?.full_name as string) ?? ""}
        defaultEmail={user?.email ?? ""}
      />

      <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-center font-label-sm text-[9px] uppercase tracking-widest text-outline">
        <span className="material-symbols-outlined text-[14px]">verified_user</span>
        Payments secured by Razorpay · TLS encrypted · Card details never touch our servers
      </p>
    </div>
  );
}
