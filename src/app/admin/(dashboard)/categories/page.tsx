import type { Metadata } from "next";
import Link from "next/link";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { deleteCategory } from "@/lib/actions/admin-categories";
import { adminCategories, adminProducts } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Merchandising",
  robots: { index: false },
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; deleted?: string }>;
}) {
  const { edit, deleted } = await searchParams;
  const [categories, products] = await Promise.all([adminCategories(), adminProducts()]);
  const editing = categories.find((category) => category.id === edit);

  const counts = products.reduce<Record<string, number>>((acc, product) => {
    if (!product.category_id) return acc;
    acc[product.category_id] = (acc[product.category_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-2 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
            Storefront merchandising
          </span>
          <h1 className="mt-1 font-display text-headline-lg">Collections & categories</h1>
        </div>
        <span className="font-body-sm text-[11px] text-on-surface-variant">
          {categories.length} collections · {products.length} garments
        </span>
      </div>

      {deleted && (
        <p className="border border-outline-variant bg-surface-container-low px-3 py-2 font-body-sm text-[12px] text-on-surface-variant">
          Collection deleted. Any garments it held are now uncategorised.
        </p>
      )}

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-12">
        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md xl:col-span-4">
          <h2 className="mb-space-sm font-headline-sm text-headline-sm">
            {editing ? "Edit collection" : "New collection"}
          </h2>
          <CategoryForm category={editing} />
        </section>

        <section className="border border-outline-variant/60 bg-surface-container-lowest xl:col-span-8">
          <div className="border-b border-outline-variant/60 px-space-md py-3">
            <h2 className="font-headline-sm text-headline-sm">All collections</h2>
          </div>
          {categories.length === 0 ? (
            <p className="p-space-lg text-center font-body-sm text-[12px] text-on-surface-variant">
              No collections yet. Create one to structure the shop filters.
            </p>
          ) : (
            <div className="divide-y divide-outline-variant/50">
              {categories.map((category) => (
                <div key={category.id} className="flex flex-col gap-2 px-space-md py-space-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-body-sm text-[12px] font-semibold">{category.name}</p>
                    <p className="font-label-sm text-[8px] uppercase tracking-wider text-outline">
                      /shop?category={category.slug} · {counts[category.id] ?? 0} garments · order {category.sort_order}
                    </p>
                    {category.description && (
                      <p className="mt-0.5 max-w-lg font-body-sm text-[11px] text-on-surface-variant">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/categories?edit=${category.id}`} className="material-symbols-outlined text-[17px] text-outline hover:text-secondary" aria-label="Edit collection">
                      edit
                    </Link>
                    <details className="relative">
                      <summary className="cursor-pointer list-none material-symbols-outlined text-[17px] text-outline hover:text-error" aria-label="Delete collection">
                        delete
                      </summary>
                      <form action={deleteCategory} className="absolute right-0 z-10 mt-1 w-56 border border-outline-variant bg-surface-container-lowest p-3 shadow-float">
                        <input type="hidden" name="id" value={category.id} />
                        <p className="font-body-sm text-[11px] text-on-surface-variant">
                          Delete “{category.name}”? Garments become uncategorised.
                        </p>
                        <label className="mt-2 flex items-center gap-2 font-body-sm text-[11px]">
                          <input type="checkbox" name="confirm" value="yes" required className="h-3.5 w-3.5 accent-secondary" />
                          Confirm
                        </label>
                        <button type="submit" className="mt-2 w-full border border-error px-2 py-1.5 font-label-sm text-[8px] uppercase tracking-wider text-error hover:bg-error hover:text-on-error">
                          Delete
                        </button>
                      </form>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
