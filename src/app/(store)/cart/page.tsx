import type { Metadata } from "next";
import { CartView } from "@/components/site/CartView";
import { getStoreSettings } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Atelier Bag",
  robots: { index: false },
};

export default async function CartPage() {
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto w-full max-w-[1440px] px-margin-mobile py-space-xl md:px-margin-tablet lg:px-margin">
      <div className="mb-space-xl flex flex-col justify-between gap-3 border-b border-outline-variant/70 pb-space-md sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">Atelier checkout</span>
          <h1 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
            Your Selection
          </h1>
        </div>
        <p className="flex items-center gap-2 font-label-sm text-[10px] uppercase tracking-widest text-outline">
          <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
          Encrypted private session
        </p>
      </div>

      <CartView
        shippingFee={settings.shipping_fee}
        freeShippingThreshold={settings.free_shipping_threshold}
      />
    </div>
  );
}
