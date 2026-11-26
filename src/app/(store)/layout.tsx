import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Snowfall } from "@/components/site/Snowfall";
import { getCategories, getStoreSettings } from "@/lib/catalog";
import { isClerkConfigured } from "@/lib/clerk";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-surface">
        <Header
          announcement={settings.announcement}
          brandName={settings.brand_name}
          categories={categories}
          clerkEnabled={isClerkConfigured}
        />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} categories={categories} />
        <Snowfall />
      </div>
    </CartProvider>
  );
}
