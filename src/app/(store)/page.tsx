import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/site/ProductCard";
import { StudioTeaser } from "@/components/site/StudioTeaser";
import {
  getCategories,
  getCategoryCounts,
  getFeaturedProducts,
  getNewArrivals,
  getProducts,
} from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { imagery } from "@/lib/imagery";
import { firstImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

const collectionImagery = [
  imagery.modelChalkHoodie,
  imagery.ecruTees,
  imagery.caps,
  imagery.linenPortrait,
];

const collectionFallbacks = [
  { name: "Heavyweight Hoodies", slug: "heavyweight-hoodies", note: "450–500 GSM fleece" },
  { name: "Botanical Monograms", slug: "oversized-t-shirts", note: "260 GSM organic jersey" },
  { name: "The Atelier Cap", slug: "structured-caps", note: "3D puff twill" },
  { name: "Artisan Linen", slug: "accessories-linen", note: "Raw Belgian flax" },
];

const gallery = [
  { src: imagery.galleryHoodie, alt: "Patron wearing an oversized embroidered hoodie" },
  { src: imagery.galleryClient, alt: "Client holding a bespoke embroidered piece" },
  { src: imagery.galleryCap, alt: "Cream structured cap with gold crest" },
  { src: imagery.galleryMan, alt: "Man wearing an embroidered overshirt in the city" },
  { src: imagery.galleryMonogram, alt: "Close-up of a bespoke monogram" },
  { src: imagery.galleryWoman, alt: "Woman wearing a hand-embroidered jacket" },
];

export default async function HomePage() {
  const [featured, newArrivals, categories, counts, allProducts] = await Promise.all([
    getFeaturedProducts(4),
    getNewArrivals(4),
    getCategories(),
    getCategoryCounts(),
    getProducts(),
  ]);

  const hero = featured[0] ?? newArrivals[0] ?? null;
  const grid = (featured.length > 0 ? featured : newArrivals).slice(0, 4);
  const collections =
    categories.length > 0
      ? categories.slice(0, 4)
      : collectionFallbacks.map((item, index) => ({
          id: `fallback-${index}`,
          name: item.name,
          slug: item.slug,
          description: item.note,
          sort_order: index,
          created_at: "",
        }));

  return (
    <>
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-surface pb-20 pt-6 lg:pb-32">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-gutter px-margin-mobile md:px-margin-tablet lg:grid-cols-12 lg:px-margin">
          <div className="z-10 flex flex-col justify-center lg:col-span-6">
            <div className="mb-space-md inline-flex items-center gap-space-sm">
              <span className="h-[1px] w-8 bg-secondary" />
              <span className="eyebrow">Couture needlecraft • Mumbai atelier</span>
            </div>
            <h1 className="mb-space-md font-display text-display-lg-mobile leading-[1.08] tracking-tight text-on-surface md:text-display-lg">
              Wear Your Story.
              <br />
              <span className="font-normal italic text-secondary">Stitch</span> Your Identity.
            </h1>
            <p className="mb-space-xl max-w-xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
              Bespoke hand-guided and multi-head precision embroidery on sustainably woven Indian organic
              cotton, heavyweight fleece and raw Belgian linen. Every piece is proofed by a master
              digitizer and finished by a karigar.
            </p>
            <div className="mb-space-2xl flex flex-col items-stretch gap-space-md sm:flex-row sm:items-center">
              <Link href="/shop" className="btn-primary shadow-md">
                Shop curated collection
              </Link>
              <Link href="/custom" className="btn-secondary bg-surface-container-lowest shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-secondary">stylus_note</span>
                Launch custom studio
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-space-md rounded-lg bg-surface-container-low p-space-md sm:grid-cols-4">
              {[
                { label: "Purity", value: "100% GOTS cotton" },
                { label: "Origin", value: "Made in India" },
                { label: "Proofing", value: "Under 24 hours" },
                { label: "Heritage", value: "Master guild lot" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-outline">{item.label}</p>
                  <p className="font-body-sm text-body-sm font-semibold text-on-surface">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-space-xl lg:col-span-6 lg:mt-0">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-surface-container-low shadow-xl">
              <Image
                src={hero ? firstImage(hero.images) : imagery.heroEspresso}
                alt={
                  hero
                    ? `${hero.name} — hand-embroidered atelier garment`
                    : "Editorial close-up of an espresso heavyweight hoodie with gold botanical embroidery"
                }
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent" />
              <div className="absolute right-4 top-4 flex flex-col items-end gap-space-xs sm:right-6 sm:top-6">
                <div className="flex items-center gap-space-xs rounded bg-surface-container-lowest/95 px-3 py-2 shadow-md backdrop-blur-md">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                  <span className="font-label-sm text-[9px] uppercase tracking-widest text-on-surface">
                    {hero?.stitch_count
                      ? `${hero.stitch_count.toLocaleString("en-IN")} high-density stitches`
                      : "Hand-guided needlework · Mumbai atelier"}
                  </span>
                </div>
                <div className="rounded bg-surface-container-lowest/90 px-3 py-1.5 shadow-sm">
                  <span className="font-label-sm text-[9px] tracking-wider text-outline">
                    {hero?.fabric_label ?? "100% GOTS organic cotton · 450 GSM"}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded bg-surface/95 p-space-md shadow-lg backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-6">
                <div>
                  <span className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">
                    Atelier signature piece
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    {hero ? (
                      <Link href={`/shop/${hero.slug}`} className="hover:text-secondary">
                        {hero.name}
                      </Link>
                    ) : (
                      "Bespoke commissions open"
                    )}
                  </h2>
                </div>
                <span className="whitespace-nowrap font-body-lg text-body-lg font-semibold text-on-surface">
                  {hero ? formatINR(hero.price) : "By quotation"}
                </span>
              </div>
            </div>

            <div className="absolute -bottom-10 -left-10 z-20 hidden max-w-xs items-center gap-space-md rounded-lg bg-surface-container-lowest p-space-md shadow-2xl xl:flex">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-container-high">
                <Image src={imagery.macroGold} alt="Macro detail of gold silk embroidery" fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
                  Macro inspection
                </span>
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                  Tension calibrated: 0.12mm
                </span>
                <span className="font-label-sm text-[10px] text-outline">Tested against 200+ cold washes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust ticker */}
      <section className="w-full overflow-hidden bg-surface-container-high py-5">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-y-3 px-margin-mobile font-label-md text-label-md uppercase tracking-widest text-on-surface-variant md:px-margin-tablet lg:px-margin">
          {[
            { icon: "eco", label: "Certified organic fibres" },
            { icon: "handyman", label: "Hand-finished in India" },
            { icon: "palette", label: "Small-batch archival thread" },
            { icon: "verified", label: "Bespoke proofing in 24h" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px] text-secondary">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured collections */}
      <section className="w-full bg-surface px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
            <div>
              <span className="eyebrow">Curated themes</span>
              <h2 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
                Featured Collections
              </h2>
            </div>
            <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
              Tactile garments crafted from unbleached natural fibres, engineered as enduring canvases for
              complex bespoke needlework.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
            {collections.map((collection, index) => {
              const count = counts[collection.id] ?? 0;
              return (
                <Link
                  key={collection.id}
                  href={`/shop?category=${collection.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm transition-all duration-500 hover:shadow-xl"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-container">
                    <Image
                      src={collectionImagery[index % collectionImagery.length]}
                      alt={collection.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-primary/20 transition-colors group-hover:bg-primary/10" />
                    <div className="absolute left-4 top-4 rounded bg-surface-container-lowest/90 px-2.5 py-1 font-label-sm text-[9px] uppercase tracking-widest text-on-surface">
                      Collection No. {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="flex flex-grow flex-col justify-between p-space-lg">
                    <div>
                      <h3 className="mb-1 font-headline-md text-headline-md text-on-surface transition-colors group-hover:text-secondary">
                        {collection.name}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {collection.description ?? "Hand-finished atelier silhouettes"}
                      </p>
                    </div>
                    <div className="mt-space-md flex items-center justify-between pt-space-sm font-label-sm text-label-sm font-semibold uppercase tracking-widest text-secondary">
                      <span>{count > 0 ? `View ${count} silhouettes` : "Explore collection"}</span>
                      <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="w-full bg-surface-container-low px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
            <div>
              <span className="eyebrow">Catalogue privé</span>
              <h2 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
                Best-Selling Garments
              </h2>
            </div>
            <Link
              href="/shop"
              className="font-label-md text-label-md uppercase tracking-wider text-on-surface underline decoration-secondary decoration-1 underline-offset-4 transition-colors hover:text-secondary"
            >
              View all garments{allProducts.length > 0 ? ` (${allProducts.length})` : ""}
            </Link>
          </div>

          {grid.length > 0 ? (
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
              {grid.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="border border-outline-variant/70 bg-surface-container-lowest p-space-xl text-center">
              <span className="material-symbols-outlined mb-2 text-[28px] text-secondary">auto_awesome</span>
              <h3 className="font-headline-md text-headline-md">The new collection is being catalogued</h3>
              <p className="mx-auto mt-2 max-w-lg font-body-md text-body-md text-on-surface-variant">
                Our karigars are finishing the first drop. In the meantime, commission a piece made
                entirely to your brief in the custom studio.
              </p>
              <Link href="/custom" className="btn-primary mt-space-md">
                Commission a bespoke piece
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Custom studio experience */}
      <section className="w-full bg-surface px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-space-2xl grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
            <div className="lg:col-span-8">
              <span className="eyebrow">Bespoke atelier service</span>
              <h2 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
                The Custom Studio Experience
              </h2>
              <p className="mt-space-sm max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
                From digital concept to museum-grade needlework. Each commission is reviewed by a master
                digitizer to calibrate thread tension and stitch density before a needle is threaded.
              </p>
            </div>
            <div className="flex lg:col-span-4 lg:justify-end">
              <Link href="/custom" className="btn-primary shadow">
                Open interactive studio
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
            <div className="flex flex-col gap-space-lg lg:col-span-7">
              {[
                {
                  phase: "Phase 01",
                  tag: "Fabric & cut",
                  title: "Select your silhouette & organic fabric",
                  body: "Choose from 450 GSM organic French terry, spun combed jersey, or raw washed Belgian flax linen. Every garment is pre-shrunk to prevent puckering after thread tensioning.",
                  accent: "bg-secondary text-on-secondary",
                },
                {
                  phase: "Phase 02",
                  tag: "Vector or typography",
                  title: "Upload artwork or type a bespoke monogram",
                  body: "Input initials with our archival serif typography or upload custom vector heraldry. Choose from archival Madeira silk dyes and metallic gold filigree accents.",
                  accent: "bg-primary text-on-primary",
                },
                {
                  phase: "Phase 03",
                  tag: "Human craft",
                  title: "Master proofing & artisanal stitching",
                  body: "Receive a macro digital proof within 24 hours. Once authorised, our multi-head precision machines and hand-guided needlecraft execute your piece in the Mumbai atelier.",
                  accent: "bg-outline text-on-primary",
                },
              ].map((step) => (
                <div
                  key={step.phase}
                  className="rounded-lg bg-surface-container-low p-space-lg transition-colors hover:bg-surface-container"
                >
                  <div className="mb-space-xs flex items-center gap-space-sm">
                    <span className={`rounded px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-widest ${step.accent}`}>
                      {step.phase}
                    </span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">{step.title}</h3>
                  <p className="font-body-md leading-relaxed text-body-md text-on-surface-variant">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="lg:col-span-5">
              <StudioTeaser />
            </div>
          </div>
        </div>
      </section>

      {/* Materiality */}
      <section className="w-full bg-primary px-margin-mobile py-space-2xl text-on-primary md:px-margin-tablet lg:px-margin">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-space-2xl grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="eyebrow">The materiality</span>
              <h2 className="mt-1 font-display text-display-sm-mobile text-on-primary md:text-display-sm">
                Archival spools. Horological calibration.
              </h2>
              <p className="mt-space-sm max-w-xl font-body-lg text-body-lg text-on-primary-container">
                We work exclusively with 100% natural mulberry silk filaments, long-staple Egyptian cotton
                threads and spun gold bullion cord sourced from small Indian mills.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-space-md lg:col-span-5">
              <div className="rounded bg-primary-container p-space-md">
                <span className="font-display text-display-sm text-on-primary">1200</span>
                <span className="mt-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container">
                  Stitches per minute
                </span>
                <span className="mt-1 block font-body-sm text-body-sm text-on-primary-container/80">
                  Multi-head precision with tension zero drift.
                </span>
              </div>
              <div className="rounded bg-primary-container p-space-md">
                <span className="font-display text-display-sm text-on-primary">6A</span>
                <span className="mt-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container">
                  Mulberry silk grade
                </span>
                <span className="mt-1 block font-body-sm text-body-sm text-on-primary-container/80">
                  Highest tensile strength and sheen lustre.
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {[
              {
                src: imagery.macroPuff,
                title: "Architectural 3D foam underlay",
                body: "Custom EVA foam core encased in over 14,000 dense satin stitches for sharp tactile volume that never collapses.",
              },
              {
                src: imagery.spools,
                title: "Small-batch vegetable dyes",
                body: "Dyed using non-toxic mineral mordants in small lots, preserving the natural softness of pure organic silk.",
              },
              {
                src: imagery.handsHoop,
                title: "Hand-trimmed & steam finished",
                body: "Every jump thread is individually sheared by hand under magnification before passing our atelier inspection.",
              },
            ].map((card) => (
              <div key={card.title} className="flex flex-col">
                <div className="relative mb-space-md aspect-[4/3] overflow-hidden rounded-lg bg-primary-container shadow-md">
                  <Image
                    src={card.src}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <h3 className="mb-1 font-headline-sm text-headline-sm text-on-primary">{card.title}</h3>
                <p className="font-body-sm text-body-sm text-on-primary-container">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press & patrons */}
      <section className="w-full bg-surface px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-space-2xl grid grid-cols-1 gap-gutter border-b border-surface-container-high pb-space-2xl md:grid-cols-3">
            {[
              {
                source: "Vogue India",
                quote:
                  "“Atelier Brodé has quietly redefined personalised streetwear into a legitimate form of contemporary couture.”",
              },
              {
                source: "GQ Style",
                quote:
                  "“The sheer weight of their 450 GSM hoodies combined with tens of thousands of stitches produces an heirloom garment.”",
              },
              {
                source: "Architectural Digest",
                quote:
                  "“Precision engineering meets textile heritage. It feels like wearing high-density architecture.”",
              },
            ].map((item) => (
              <div key={item.source} className="flex flex-col">
                <div className="mb-space-sm flex items-center gap-space-xs text-secondary">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span className="font-label-md text-label-md font-bold uppercase tracking-widest">
                    {item.source}
                  </span>
                </div>
                <p className="font-display text-headline-sm italic leading-snug text-on-surface">{item.quote}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {[
              {
                quote:
                  "I commissioned a linen overshirt for my anniversary with our family crest. The thread tension is so perfect there is zero fabric pulling. Truly museum quality.",
                name: "Aarav Mehta",
                detail: "Mumbai · Bespoke patron",
                initial: "A",
              },
              {
                quote:
                  "The 24-hour proofing workflow gave me complete confidence before my order was stitched. The hoodie arrived wrapped like an artefact.",
                name: "Camille D'Souza",
                detail: "Bengaluru · Nocturne hoodie",
                initial: "C",
              },
              {
                quote:
                  "The weight of the six-panel twill cap and that 3D puff embroidery is beyond anything from the major houses. You feel the care of the craft immediately.",
                name: "Kabir Rao",
                detail: "Delhi · Atelier cap",
                initial: "K",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex flex-col justify-between rounded-lg bg-surface-container-low p-space-lg"
              >
                <div>
                  <div className="mb-space-sm flex items-center gap-1 text-secondary">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index} className="material-symbols-outlined text-[16px]">
                        star
                      </span>
                    ))}
                  </div>
                  <p className="mb-space-md font-body-md text-body-md text-on-surface">{item.quote}</p>
                </div>
                <div className="flex items-center gap-space-sm pt-space-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest font-display font-bold text-secondary">
                    {item.initial}
                  </span>
                  <div>
                    <p className="font-body-sm text-body-sm font-semibold text-on-surface">{item.name}</p>
                    <p className="font-label-sm text-[10px] text-outline">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="w-full bg-surface-container-low px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
            <div>
              <span className="eyebrow">@atelierbrode</span>
              <h2 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
                The Gallery of Patrons
              </h2>
            </div>
            <Link
              href="/custom"
              className="font-label-md text-label-md uppercase tracking-wider text-on-surface underline decoration-secondary decoration-1 underline-offset-4 hover:text-secondary"
            >
              Commission your own piece
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-gutter md:grid-cols-3 lg:grid-cols-6">
            {gallery.map((image) => (
              <div key={image.src} className="group relative aspect-square overflow-hidden rounded bg-surface-container">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission CTA */}
      <section className="w-full bg-surface px-margin-mobile py-space-2xl text-center md:px-margin-tablet lg:px-margin">
        <div className="mx-auto max-w-2xl">
          <span className="material-symbols-outlined text-[28px] text-secondary">flare</span>
          <h2 className="mt-2 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
            Commission Your Piece
          </h2>
          <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
            Share your monogram, crest or artwork. A master digitizer will reply with a macro proof and a
            quotation within one to two working days.
          </p>
          <div className="mt-space-md flex flex-col items-center justify-center gap-space-sm sm:flex-row">
            <Link href="/custom" className="btn-primary">
              Begin a commission
            </Link>
            <Link href="/contact" className="btn-secondary">
              Speak to the concierge
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
