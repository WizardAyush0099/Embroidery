import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { deleteProduct } from "@/lib/actions/admin-products";
import { adminCategories, adminProduct } from "@/lib/admin-data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Product",
  robots: { index: false },
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([adminProduct(id), adminCategories()]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-2 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <nav className="flex items-center gap-2 font-label-sm text-[8px] uppercase tracking-widest text-outline">
            <Link href="/admin/products" className="hover:text-on-surface">
              Catalogue
            </Link>
            <span>/</span>
            <span className="text-secondary">Edit</span>
          </nav>
          <h1 className="mt-1 font-display text-headline-lg">{product.name}</h1>
          <p className="mt-1 font-label-sm text-[8px] uppercase tracking-wider text-outline">
            Updated {formatDate(product.updated_at, true)} · /shop/{product.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/shop/${product.slug}`} target="_blank" className="border border-outline-variant px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest hover:border-primary">
            View live
          </Link>
          <Link href="/admin/products/new" className="bg-primary px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest text-on-primary hover:bg-secondary">
            Add another
          </Link>
        </div>
      </div>

      <ProductForm categories={categories} initial={product} />

      <section className="border border-error/30 bg-[#fdf6f5] p-space-md">
        <h2 className="font-headline-sm text-headline-sm text-[#8f1f1f]">Retire this garment</h2>
        <p className="mt-1 max-w-xl font-body-sm text-[12px] text-on-surface-variant">
          Deleting removes the product from the storefront and custom studio permanently. Existing orders
          keep their item snapshot. To hide it temporarily, unpublish it instead.
        </p>
        <form action={deleteProduct} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="hidden" name="id" value={product.id} />
          <label className="flex items-center gap-2 font-body-sm text-[12px]">
            <input type="checkbox" name="confirm" value="yes" required className="h-3.5 w-3.5 accent-secondary" />
            I understand this cannot be undone
          </label>
          <button type="submit" className="border border-error px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest text-error hover:bg-error hover:text-on-error">
            Delete product
          </button>
        </form>
      </section>
    </div>
  );
}
