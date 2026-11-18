import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/site/ProductCard";
import { getCategories, getCategoryCounts, getProducts, getProductsForFilters } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop the Collection",
  description:
    "Shop heavyweight hoodies, archival French terry, oversized tees, structured caps and raw linen overshirts — each with hand-guided embroidery.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = single(params.q).trim();
  const category = single(params.category);
  const size = single(params.size);
  const color = single(params.color);
  const minPrice = Number(single(params.min)) || undefined;
  const maxPrice = Number(single(params.max)) || undefined;
  const inStock = single(params.inStock) === "1";
  const sort = single(params.sort) || "featured";
  const page = Math.max(1, Number(single(params.page)) || 1);
  const perPage = 12;

  const [products, categories, counts, filterOptions] = await Promise.all([
    getProducts({ q, category, size, color, minPrice, maxPrice, inStock, sort }),
    getCategories(),
    getCategoryCounts(),
    getProductsForFilters(),
  ]);

  const totalPages = Math.max(1, Math.ceil(products.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const visible = products.slice((currentPage - 1) * perPage, currentPage * perPage);
  const activeCategory = categories.find((item) => item.slug === category);

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const base: Record<string, string> = {
      q,
      category,
      size,
      color,
      min: minPrice ? String(minPrice) : "",
      max: maxPrice ? String(maxPrice) : "",
      inStock: inStock ? "1" : "",
      sort,
    };
    for (const [key, value] of Object.entries({ ...base, ...overrides })) {
      if (value) next.set(key, value);
    }
    const query = next.toString();
    return query ? `/shop?${query}` : "/shop";
  };

  return (
    <>
      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile pb-space-lg pt-space-md md:px-margin-tablet lg:px-margin">
        <div className="flex flex-col justify-between gap-space-lg border-b border-outline-variant pb-space-lg lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-space-xs flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-widest text-secondary">
              <span>Édition permanente</span>
              <span className="text-outline-variant">•</span>
              <span>Crafted in Mumbai</span>
            </div>
            <h1 className="font-display text-headline-lg uppercase tracking-tight text-on-surface">
              {activeCategory ? activeCategory.name : "The Ready-to-Wear & Custom Canvas Collection"}
            </h1>
            <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">
              {activeCategory?.description ??
                "Archival blanks engineered for high-tension needlework, alongside our seasonal in-house embroidered drops."}
            </p>
          </div>

          <form action="/shop" className="flex w-full flex-col gap-space-xs lg:w-[420px]">
            {category && <input type="hidden" name="category" value={category} />}
            {sort !== "featured" && <input type="hidden" name="sort" value={sort} />}
            <div className="relative flex items-center border border-outline-variant bg-surface-container-low transition-colors focus-within:border-primary">
              <span className="material-symbols-outlined pl-3 text-[18px] text-outline">search</span>
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search garment, motif or technique…"
                className="w-full bg-transparent px-space-sm py-2.5 font-body-sm text-body-sm text-on-surface outline-none placeholder:text-outline"
              />
              <button type="submit" className="pr-3 font-label-sm text-[10px] uppercase tracking-widest text-outline hover:text-on-surface">
                Search
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm text-outline">
              <span className="uppercase tracking-wider">Try:</span>
              {["Hoodie", "French Terry", "Cap", "Linen"].map((term) => (
                <Link
                  key={term}
                  href={`/shop?q=${encodeURIComponent(term)}`}
                  className="text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:text-secondary hover:decoration-secondary"
                >
                  {term}
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile pb-space-lg md:px-margin-tablet lg:px-margin">
        <div className="no-scrollbar flex items-center gap-space-xs overflow-x-auto border-b border-outline-variant/60 pb-space-sm">
          <Link
            href={buildQuery({ category: undefined, page: undefined })}
            className={`whitespace-nowrap px-4 py-2 font-label-sm text-label-sm uppercase tracking-widest ${
              !category
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            All garments ({Object.values(counts).reduce((sum, value) => sum + value, 0)})
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={buildQuery({ category: item.slug, page: undefined })}
              className={`whitespace-nowrap px-4 py-2 font-label-sm text-label-sm uppercase tracking-widest ${
                category === item.slug
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              {item.name} ({counts[item.id] ?? 0})
            </Link>
          ))}
        </div>

        <form action="/shop" className="grid grid-cols-2 items-end gap-space-sm pt-space-md font-label-sm text-label-sm uppercase tracking-wider md:grid-cols-3 lg:grid-cols-6">
          <input type="hidden" name="category" value={category} />
          {q && <input type="hidden" name="q" value={q} />}

          <label className="flex flex-col gap-1">
            <span className="text-outline">Size</span>
            <select name="size" defaultValue={size} className="w-full border border-outline-variant bg-surface-container-lowest px-2.5 py-2.5 text-on-surface outline-none focus:border-primary">
              <option value="">All sizes</option>
              {filterOptions.sizes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-outline">Shade</span>
            <select name="color" defaultValue={color} className="w-full border border-outline-variant bg-surface-container-lowest px-2.5 py-2.5 text-on-surface outline-none focus:border-primary">
              <option value="">All shades</option>
              {filterOptions.colors.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-outline">Min ₹</span>
            <input
              type="number"
              name="min"
              min={0}
              step={500}
              defaultValue={minPrice ?? ""}
              placeholder="0"
              className="w-full border border-outline-variant bg-surface-container-lowest px-2.5 py-2.5 text-on-surface outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-outline">Max ₹</span>
            <input
              type="number"
              name="max"
              min={0}
              step={500}
              defaultValue={maxPrice ?? ""}
              placeholder="No limit"
              className="w-full border border-outline-variant bg-surface-container-lowest px-2.5 py-2.5 text-on-surface outline-none focus:border-primary"
            />
          </label>

          <label className="flex items-center gap-2 border border-outline-variant bg-surface-container-lowest px-2.5 py-2.5">
            <input type="checkbox" name="inStock" value="1" defaultChecked={inStock} className="h-3.5 w-3.5 accent-secondary" />
            <span className="text-on-surface-variant">In stock</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-outline">Sort</span>
            <select name="sort" defaultValue={sort} className="w-full border border-outline-variant bg-surface-container px-2.5 py-2.5 font-semibold text-on-surface outline-none focus:border-primary">
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price · low to high</option>
              <option value="price-desc">Price · high to low</option>
              <option value="name">Alphabetical</option>
            </select>
          </label>

          <div className="col-span-2 flex items-center gap-3 md:col-span-3 lg:col-span-6">
            <button type="submit" className="btn-primary py-2.5">
              Apply filters
            </button>
            <Link
              href="/shop"
              className="font-label-sm text-[10px] uppercase tracking-widest text-outline underline underline-offset-4 hover:text-on-surface"
            >
              Clear all
            </Link>
            <span className="ml-auto font-body-sm text-[12px] normal-case tracking-normal text-on-surface-variant">
              {products.length} {products.length === 1 ? "garment" : "garments"}
            </span>
          </div>
        </form>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile pb-space-xl md:px-margin-tablet lg:px-margin">
        {visible.length > 0 ? (
          <>
            <div className="mb-space-md flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline">
                Active in-stock editions
              </span>
              <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline">
                Displaying {visible.length} of {products.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-space-xl flex items-center justify-center gap-2" aria-label="Catalogue pages">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const target = index + 1;
                  return (
                    <Link
                      key={target}
                      href={buildQuery({ page: target === 1 ? undefined : String(target) })}
                      aria-current={target === currentPage ? "page" : undefined}
                      className={`flex h-9 min-w-9 items-center justify-center border px-3 font-label-sm text-[11px] ${
                        target === currentPage
                          ? "border-primary bg-primary text-on-primary"
                          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-on-surface"
                      }`}
                    >
                      {target}
                    </Link>
                  );
                })}
              </nav>
            )}
          </>
        ) : (
          <div className="border border-outline-variant/70 bg-surface-container-lowest px-space-lg py-space-2xl text-center">
            <span className="material-symbols-outlined text-[30px] text-secondary">search_off</span>
            <h2 className="mt-2 font-headline-md text-headline-md">No garments match this search</h2>
            <p className="mx-auto mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
              {q || category || size || color || minPrice || maxPrice || inStock
                ? "Try widening the filters, or commission exactly what you have in mind."
                : "The first drop is being catalogued. Commission a bespoke piece in the meantime."}
            </p>
            <div className="mt-space-md flex flex-col items-center justify-center gap-space-sm sm:flex-row">
              <Link href="/shop" className="btn-secondary">
                Reset filters
              </Link>
              <Link href="/custom" className="btn-primary">
                Open custom studio
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-outline-variant/70 bg-surface-container-low">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-margin-mobile py-5 text-center font-label-sm text-[10px] uppercase tracking-widest text-flax-grey md:flex-row md:px-margin-tablet lg:px-margin">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px]">local_shipping</span>
            Complimentary white-glove delivery above ₹25,000
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            Lifetime repair & thread restoration
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px]">sync</span>
            Free size exchange within 14 days
          </span>
        </div>
      </section>
    </>
  );
}
