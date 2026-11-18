import type { Metadata } from "next";
import Link from "next/link";
import { CustomStudio } from "@/components/site/CustomStudio";
import { getCustomisableProducts, getProducts, getStoreSettings } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Custom Embroidery Studio",
  description:
    "Compose a bespoke monogram, crest or artwork. Choose a garment, placement, thread and font — a master digitizer replies with a proof and quotation within 48 hours.",
};

export default async function CustomPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const [{ product }, settings, customisable, allProducts] = await Promise.all([
    searchParams,
    getStoreSettings(),
    getCustomisableProducts(),
    getProducts(),
  ]);

  const garments = customisable.length > 0 ? customisable : allProducts;

  return (
    <>
      <div className="border-b border-outline-variant/70 bg-surface">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-3 px-margin-mobile py-3 font-label-sm text-[10px] uppercase tracking-widest text-outline sm:flex-row sm:items-center md:px-margin-tablet lg:px-margin">
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/" className="hover:text-on-surface">
              Atelier
            </Link>
            <span>/</span>
            <Link href="/custom" className="hover:text-on-surface">
              Custom bespoke
            </Link>
            <span>/</span>
            <span className="text-secondary">Live embroidery atelier</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-secondary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
              Master karigar active · Lot 24
            </span>
            <span className="text-outline-variant">|</span>
            <span>Handcraft lead time: 5–7 days</span>
          </div>
        </div>
      </div>

      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile py-space-xl md:px-margin-tablet lg:px-margin">
        <div className="mb-space-lg max-w-3xl">
          <span className="eyebrow">Bespoke atelier service</span>
          <h1 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
            Compose a piece that could only belong to you
          </h1>
          <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
            Choose your garment, placement, thread and typography. Submit artwork or a written brief and our
            master digitizer will return a macro proof with a quotation — no payment until you approve.
          </p>
        </div>

        <CustomStudio
          garments={garments}
          initialSlug={product}
          contactEmail={settings.contact_email}
        />
      </section>

      <section className="border-t border-outline-variant/70 bg-surface-container-low">
        <div className="mx-auto max-w-[1440px] px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin">
          <div className="mb-space-xl grid grid-cols-1 gap-gutter lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="eyebrow">Guild standards</span>
              <h2 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
                The anatomy of pure hand karigari
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Completely devoid of industrial flat-bed machines or automated looms. Pure hand-guided aari,
                zardozi and tambour needlecraft with heritage lustred silk.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {[
              {
                icon: "spa",
                title: "Pure hand-guided aari & tambour",
                body: "Hand-stitching using traditional awl needle hooks on stretched wooden frames for organic, unhurried stitch depth.",
              },
              {
                icon: "draw",
                title: "Hand-turned vector stencil transfer",
                body: "Zero automated computerised puckers. Each graphic is perforated onto helium parchment and chalk-dusted by hand.",
              },
              {
                icon: "verified",
                title: "Individually signed by master artisan",
                body: "Crafted over 12+ hours by master karigars. Each piece includes a numbered guild provenance certificate.",
              },
            ].map((card) => (
              <div key={card.title} className="border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
                <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded bg-[#f6e7e0] text-[20px] text-secondary">
                  {card.icon}
                </span>
                <h3 className="mt-space-sm font-headline-sm text-headline-sm">{card.title}</h3>
                <p className="mt-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
