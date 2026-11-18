import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ProductPurchasePanel } from "@/components/site/ProductPurchasePanel";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Garment not found" };
  return {
    title: product.name,
    description: product.description ?? `${product.name} — hand-embroidered atelier garment.`,
    openGraph: {
      title: product.name,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

const accordionContent = (product: Product) => [
  {
    title: "Carbon & fabric integrity",
    body: `${product.fabric_label ?? "Premium organic cotton"} · ${
      product.fabric_label?.toLowerCase().includes("linen")
        ? "washed Belgian flax with a softened hand feel"
        : "GOTS-certified organic cotton, pre-shrunk under tension"
    }. Garment weight and weave are calibrated for high-density embroidery so the fabric recovers cleanly around every stitch.`,
  },
  {
    title: "Embroidery care & longevity",
    body: "Dry clean or hand wash cold inside out. Never tumble dry. Press around — never directly on — the embroidery with a cloth barrier to protect the silk lustre and raised relief.",
  },
  {
    title: "Complimentary proofing & delivery",
    body: "Every order includes a macro digital proof for embroidered pieces, dispatched within 24 hours. Ready-to-wear garments leave the atelier in 3–5 working days, wrapped in recycled linen and archival tissue.",
  },
];

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category_id, product.id, 3);

  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] px-margin-mobile pt-space-md md:px-margin-tablet lg:px-margin">
        <nav className="flex flex-wrap items-center gap-2 font-label-sm text-[10px] uppercase tracking-widest text-outline">
          <Link href="/" className="hover:text-on-surface">
            Atelier
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-on-surface">
            Catalogue
          </Link>
          {product.categories && (
            <>
              <span>/</span>
              <Link href={`/shop?category=${product.categories.slug}`} className="hover:text-on-surface">
                {product.categories.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-on-surface">{product.name}</span>
        </nav>
      </div>

      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile pb-space-xl pt-space-md md:px-margin-tablet lg:px-margin">
        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ProductGallery
              images={product.images}
              name={product.name}
              stitchCount={product.stitch_count}
              fabricLabel={product.fabric_label}
            />
            <p className="mt-space-sm flex items-center gap-2 font-label-sm text-[10px] uppercase tracking-widest text-outline">
              <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
              Photographed in natural atelier light · Colour may vary on screen
            </p>
          </div>

          <div className="lg:col-span-5">
            <ProductPurchasePanel product={product} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile pb-space-2xl md:px-margin-tablet lg:px-margin">
        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="mb-space-sm font-headline-md text-headline-md">Atelier specification</h2>
            <dl className="border-t border-outline-variant/70">
              {[
                { label: "Fabrication", value: product.fabric_label ?? "Organic cotton" },
                { label: "Embroidery technique", value: product.technique ?? "Hand-guided satin stitch" },
                {
                  label: "Stitch volume",
                  value: product.stitch_count ? `${product.stitch_count.toLocaleString("en-IN")} stitches` : "Per motif proof",
                },
                { label: "Colourways", value: product.colors.map((color) => color.name).join(" · ") || "Signature" },
                { label: "Sizes", value: product.sizes.join(" · ") || "One size" },
                { label: "Atelier", value: "Mumbai · Master karigar guild" },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-1 gap-1 border-b border-outline-variant/70 py-3 sm:grid-cols-2">
                  <dt className="font-label-sm text-[10px] uppercase tracking-wider text-flax-grey">{row.label}</dt>
                  <dd className="font-body-md text-body-md text-on-surface">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5">
            {accordionContent(product).map((item) => (
              <details key={item.title} className="group border-b border-outline-variant/70">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 font-label-md text-label-md uppercase tracking-wider text-on-surface">
                  {item.title}
                  <span className="material-symbols-outlined text-[18px] text-outline transition-transform group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="pb-4 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{item.body}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-outline-variant/70 bg-surface-container-low">
          <div className="mx-auto w-full max-w-[1440px] px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin">
            <div className="mb-space-xl flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Continue the collection</span>
                <h2 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
                  Worn together
                </h2>
              </div>
              <Link
                href="/shop"
                className="font-label-md text-label-md uppercase tracking-wider text-on-surface underline decoration-secondary decoration-1 underline-offset-4 hover:text-secondary"
              >
                All garments
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
