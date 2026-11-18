import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { updateInventory } from "@/lib/actions/admin-products";
import { adminProducts } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stock & Inventory",
  robots: { index: false },
};

export default async function InventoryPage() {
  const products = await adminProducts();
  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const outOfStock = products.filter((product) => product.stock === 0).length;
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 3).length;

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-2 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
            Loom & shelf control
          </span>
          <h1 className="mt-1 font-display text-headline-lg">Stock & inventory</h1>
        </div>
        <Link href="/admin/products" className="border border-outline-variant px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest hover:border-primary">
          Manage catalogue
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-space-sm sm:grid-cols-3">
        {[
          { label: "Units on hand", value: totalUnits, note: "Across all size variants" },
          { label: "Low stock", value: lowStock, note: "3 units or fewer" },
          { label: "Sold out", value: outOfStock, note: "Hidden from quick add" },
        ].map((card) => (
          <div key={card.label} className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">{card.label}</span>
            <p className="mt-1 font-display text-headline-lg tabular-nums">{card.value}</p>
            <p className="font-body-sm text-[11px] text-on-surface-variant">{card.note}</p>
          </div>
        ))}
      </section>

      {products.length === 0 ? (
        <div className="border border-outline-variant/60 bg-surface-container-lowest p-space-xl text-center">
          <p className="font-body-sm text-[12px] text-on-surface-variant">
            No garments in the catalogue yet — add a product to start tracking stock.
          </p>
          <Link href="/admin/products/new" className="btn-primary mt-space-md">
            Add product
          </Link>
        </div>
      ) : (
        <section className="flex flex-col gap-2">
          {products.map((product) => {
            const sizes = product.sizes.length > 0 ? product.sizes : [];
            return (
              <div key={product.id} className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-surface-container">
                      {product.images[0] ? (
                        <Image src={product.images[0]} alt="" fill sizes="44px" className="object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <Link href={`/admin/products/${product.id}`} className="font-body-sm text-[12px] font-semibold hover:text-secondary">
                        {product.name}
                      </Link>
                      <p className="font-label-sm text-[8px] uppercase tracking-wider text-outline">
                        {product.categories?.name ?? "Uncategorised"} · {product.is_published ? "Live" : "Draft"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-2.5 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${
                      product.stock === 0
                        ? "border-[#e5bdb8] bg-[#f7e3e1] text-[#8f1f1f]"
                        : product.stock <= 3
                          ? "border-[#ddcfae] bg-[#f3ecdd] text-[#7a5a1e]"
                          : "border-[#c5d8bf] bg-[#e7efe4] text-[#3d5a38]"
                    }`}>
                      {product.stock} units
                    </span>
                  </div>
                </div>

                {sizes.length > 0 ? (
                  <form action={updateInventory} className="mt-space-sm flex flex-wrap items-end gap-2 border-t border-outline-variant/50 pt-space-sm">
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="sizes" value={JSON.stringify(sizes)} />
                    {sizes.map((size) => (
                      <label key={size} className="w-20">
                        <span className="block font-label-sm text-[8px] uppercase tracking-wider text-outline">{size}</span>
                        <input
                          type="number"
                          name={`stock_${size}`}
                          min={0}
                          defaultValue={Number(product.size_stock?.[size] ?? 0)}
                          className="atelier-input mt-0.5 py-1.5 text-center tabular-nums"
                        />
                      </label>
                    ))}
                    <button type="submit" className="border border-primary bg-primary px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest text-on-primary hover:bg-secondary">
                      Save stock
                    </button>
                  </form>
                ) : (
                  <p className="mt-2 border-t border-outline-variant/50 pt-2 font-body-sm text-[11px] text-outline">
                    This garment has no size variants. Edit total stock in the product form.
                  </p>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
