import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { toggleProductFlag, updateProductOrder } from "@/lib/actions/admin-products";
import { adminProducts } from "@/lib/admin-data";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Garment Catalogue",
  robots: { index: false },
};

const tabs = [
  { key: "", label: "All garments" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "featured", label: "Featured" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; saved?: string; deleted?: string }>;
}) {
  const { q, status, saved, deleted } = await searchParams;
  const products = await adminProducts({ search: q, status });

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-3 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
            Catalogue · {products.length} garments
          </span>
          <h1 className="mt-1 font-display text-headline-lg">Garment & catalogue</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action="/admin/products" className="flex items-center border border-outline-variant bg-surface-container-lowest px-2.5">
            <span className="material-symbols-outlined text-[16px] text-outline">search</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search garments"
              className="w-44 bg-transparent px-2 py-2 font-body-sm text-[12px] outline-none"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
          <Link href="/admin/products/new" className="bg-primary px-3 py-2.5 font-label-sm text-[9px] uppercase tracking-widest text-on-primary hover:bg-secondary">
            Add product
          </Link>
        </div>
      </div>

      {saved && (
        <p className="border border-[#c5d8bf] bg-[#e7efe4] px-3 py-2 font-body-sm text-[12px] text-[#3d5a38]">
          “{saved}” saved. The storefront reflects the change immediately.
        </p>
      )}
      {deleted && (
        <p className="border border-outline-variant bg-surface-container-low px-3 py-2 font-body-sm text-[12px] text-on-surface-variant">
          Product deleted.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const params = new URLSearchParams();
          if (tab.key) params.set("status", tab.key);
          if (q) params.set("q", q);
          const href = params.toString() ? `/admin/products?${params}` : "/admin/products";
          const active = (status ?? "") === tab.key;
          return (
            <Link
              key={tab.key || "all"}
              href={href}
              className={`border px-3 py-1.5 font-label-sm text-[9px] uppercase tracking-wider ${
                active ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant hover:border-primary"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <section className="border border-outline-variant/60 bg-surface-container-lowest">
        {products.length === 0 ? (
          <div className="p-space-xl text-center">
            <span className="material-symbols-outlined text-[28px] text-secondary">checkroom</span>
            <h2 className="mt-2 font-headline-sm text-headline-sm">No garments here yet</h2>
            <p className="mx-auto mt-1 max-w-md font-body-sm text-[12px] text-on-surface-variant">
              Add your first product with photography, sizes and stock. It will publish to the storefront
              instantly.
            </p>
            <Link href="/admin/products/new" className="btn-primary mt-space-md">
              Add product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/60 text-left">
                  {["Order", "Garment", "Category", "Price", "Stock", "Visibility", "Flags", ""].map((heading) => (
                    <th key={heading} className="px-space-sm py-2.5 font-label-sm text-[8px] uppercase tracking-widest text-outline">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container-low">
                    <td className="px-space-sm py-2.5">
                      <form action={updateProductOrder} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={product.id} />
                        <input
                          name="sort_order"
                          type="number"
                          step={1}
                          defaultValue={product.sort_order ?? 0}
                          aria-label={`Display order for ${product.name}`}
                          className="w-14 border border-outline-variant bg-surface-container-lowest px-1.5 py-1 font-body-sm text-[12px] tabular-nums outline-none focus:border-primary"
                        />
                        <button
                          type="submit"
                          className="material-symbols-outlined text-[17px] text-outline hover:text-secondary"
                          aria-label={`Save display order for ${product.name}`}
                        >
                          check
                        </button>
                      </form>
                      <span className="mt-1 block font-label-sm text-[8px] uppercase tracking-wider text-outline">
                        lower first
                      </span>
                    </td>
                    <td className="px-space-sm py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-surface-container">
                          {product.images[0] ? (
                            <Image src={product.images[0]} alt="" fill sizes="44px" className="object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${product.id}`} className="block max-w-[240px] truncate font-body-sm text-[12px] font-semibold hover:text-secondary">
                            {product.name}
                          </Link>
                          <span className="font-label-sm text-[8px] uppercase tracking-wider text-outline">
                            {product.fabric_label ?? "Atelier"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-sm py-2.5 font-body-sm text-[11px] text-on-surface-variant">
                      {product.categories?.name ?? "Uncategorised"}
                    </td>
                    <td className="px-space-sm py-2.5 font-body-sm text-[12px] tabular-nums">
                      {formatINR(product.price)}
                      {product.compare_at_price ? (
                        <span className="block text-[10px] text-outline line-through">{formatINR(product.compare_at_price)}</span>
                      ) : null}
                    </td>
                    <td className="px-space-sm py-2.5">
                      <span className={`font-body-sm text-[12px] font-semibold tabular-nums ${product.stock === 0 ? "text-error" : product.stock <= 3 ? "text-[#7a5a1e]" : ""}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-space-sm py-2.5">
                      <form action={toggleProductFlag}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="field" value="is_published" />
                        <input type="hidden" name="value" value={String(!product.is_published)} />
                        <button
                          type="submit"
                          className={`rounded-full border px-2 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${
                            product.is_published
                              ? "border-[#c5d8bf] bg-[#e7efe4] text-[#3d5a38]"
                              : "border-outline-variant bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {product.is_published ? "Published" : "Draft"}
                        </button>
                      </form>
                    </td>
                    <td className="px-space-sm py-2.5">
                      <div className="flex flex-wrap gap-1">
                        <form action={toggleProductFlag}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="field" value="is_featured" />
                          <input type="hidden" name="value" value={String(!product.is_featured)} />
                          <button
                            type="submit"
                            className={`rounded px-1.5 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${
                              product.is_featured ? "bg-secondary text-on-secondary" : "bg-surface-container text-outline"
                            }`}
                          >
                            Featured
                          </button>
                        </form>
                        <form action={toggleProductFlag}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="field" value="is_new_arrival" />
                          <input type="hidden" name="value" value={String(!product.is_new_arrival)} />
                          <button
                            type="submit"
                            className={`rounded px-1.5 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${
                              product.is_new_arrival ? "bg-sage text-white" : "bg-surface-container text-outline"
                            }`}
                          >
                            New
                          </button>
                        </form>
                      </div>
                    </td>
                    <td className="px-space-sm py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/shop/${product.slug}`} target="_blank" className="material-symbols-outlined text-[16px] text-outline hover:text-secondary" aria-label="View on storefront">
                          open_in_new
                        </Link>
                        <Link href={`/admin/products/${product.id}`} className="material-symbols-outlined text-[16px] text-outline hover:text-secondary" aria-label="Edit product">
                          edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
