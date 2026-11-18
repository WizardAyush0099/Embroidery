import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminCategories } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add Product",
  robots: { index: false },
};

export default async function NewProductPage() {
  const categories = await adminCategories();

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-2 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <nav className="flex items-center gap-2 font-label-sm text-[8px] uppercase tracking-widest text-outline">
            <Link href="/admin/products" className="hover:text-on-surface">
              Catalogue
            </Link>
            <span>/</span>
            <span className="text-secondary">New garment</span>
          </nav>
          <h1 className="mt-1 font-display text-headline-lg">Add a garment</h1>
        </div>
        <p className="max-w-sm font-body-sm text-[11px] text-on-surface-variant">
          Publish photography, sizes, colourways and stock. The storefront updates the moment you save.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
