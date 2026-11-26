import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/site/BrandMark";
import { getStoreSettings } from "@/lib/catalog";
import { imagery } from "@/lib/imagery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Craft & Atelier",
  description:
    "Atelier Brodé is a Mumbai house of heavyweight streetwear and bespoke hand embroidery. Meet the karigars, the fibres and the proofing discipline behind every piece.",
};

export default async function AboutPage() {
  const settings = await getStoreSettings();

  return (
    <>
      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile pb-space-2xl pt-space-xl md:px-margin-tablet lg:px-margin">
        <div className="grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="eyebrow">The house</span>
            <h1 className="mt-1 font-display text-display-lg-mobile leading-[1.05] text-on-surface md:text-display-lg">
              An Indian atelier of needlework and heavyweight cloth.
            </h1>
            <p className="mt-4 font-body-lg text-body-lg text-on-surface-variant">
              {settings.brand_name} began with a simple conviction: that a garment carrying a person&apos;s
              own story should be built to outlive trend cycles. We pair 450 GSM organic fleece and washed
              Belgian flax with hand-guided aari, zardozi and tambour embroidery, executed by karigars whose
              families have served the craft for generations.
            </p>
            <div className="mt-space-lg flex flex-wrap gap-space-sm">
              <Link href="/shop" className="btn-primary">
                Explore the collection
              </Link>
              <Link href="/custom" className="btn-secondary">
                Begin a commission
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-gutter">
              <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-lg">
                <Image
                  src={imagery.linenPortrait}
                  alt="Artisan tailor in a raw linen overshirt"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={imagery.handsHoop} alt="Hands embroidering with a brass hoop" fill sizes="25vw" className="object-cover" />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={imagery.spools} alt="Archival thread spools" fill sizes="25vw" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-outline-variant/70 bg-surface-container-low">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-gutter px-margin-mobile py-space-2xl md:grid-cols-3 md:px-margin-tablet lg:px-margin">
          {[
            { value: "1,200", label: "Stitches per minute", note: "Multi-head precision, tension held at zero drift." },
            { value: "6A", label: "Mulberry silk grade", note: "Highest tensile strength and a lasting lustre." },
            { value: "12+", label: "Hours per commission", note: "Hand-guided work by a single master karigar." },
          ].map((item) => (
            <div key={item.label} className="border-l border-outline-variant pl-space-md">
              <span className="font-display text-display-sm text-on-surface">{item.value}</span>
              <span className="mt-1 block font-label-sm text-[10px] uppercase tracking-wider text-outline">
                {item.label}
              </span>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin">
        <div className="mb-space-xl max-w-2xl">
          <span className="eyebrow">The discipline</span>
          <h2 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
            From brief to heirloom
          </h2>
          <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
            Embroidery permanently modifies a garment&apos;s surface. We treat that responsibility as an
            engineering problem as much as an aesthetic one.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "01",
              title: "Fibre selection",
              body: "GOTS-certified organic cotton, 450–500 GSM French terry and raw Belgian flax, pre-shrunk so thread tension never puckers the cloth.",
            },
            {
              step: "02",
              title: "Digitising",
              body: "A master digitizer converts your monogram or artwork into stitch paths, calibrating density, underlay and pull compensation.",
            },
            {
              step: "03",
              title: "Macro proof",
              body: "You receive a high-resolution simulation within 24 hours. Nothing is stitched until you approve the proof in writing.",
            },
            {
              step: "04",
              title: "Hand finishing",
              body: "Jump threads are individually sheared under magnification, the piece is steam-finished and signed with a guild certificate.",
            },
          ].map((item) => (
            <div key={item.step} className="border-t border-outline-variant pt-space-md">
              <span className="font-display text-headline-md text-secondary">{item.step}</span>
              <h3 className="mt-1 font-headline-sm text-headline-sm">{item.title}</h3>
              <p className="mt-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary text-on-primary">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-gutter px-margin-mobile py-space-2xl md:px-margin-tablet lg:grid-cols-12 lg:px-margin">
          <div className="lg:col-span-6">
            <span className="eyebrow">Guild standards</span>
            <h2 className="mt-1 font-display text-display-sm-mobile text-on-primary md:text-display-sm">
              Made by hand, in a room you could visit.
            </h2>
            <p className="mt-3 max-w-xl font-body-md text-body-md text-on-primary-container">
              Our karkhana sits above the {settings.address.split(",")[1]?.trim() ?? "Mumbai"} studio. Master
              karigars work in daylight, not on conveyor lines. Every piece carries a numbered certificate and
              a lifetime thread-repair promise.
            </p>
            <dl className="mt-space-lg grid grid-cols-2 gap-space-md">
              {[
                { term: "Provenance", detail: "Mumbai, India" },
                { term: "Fibres", detail: "GOTS organic · Belgian flax" },
                { term: "Proofing", detail: "Digital macro within 24h" },
                { term: "Repairs", detail: "Lifetime thread restoration" },
              ].map((item) => (
                <div key={item.term}>
                  <dt className="font-label-sm text-[10px] uppercase tracking-wider text-on-primary-container">{item.term}</dt>
                  <dd className="mt-1 font-body-sm text-body-sm text-on-primary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-gutter">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Image src={imagery.macroPuff} alt="Raised 3D puff embroidery detail" fill sizes="25vw" className="object-cover" />
              </div>
              <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-lg">
                <Image src={imagery.heraldicCrest} alt="Heraldic crest embroidery" fill sizes="25vw" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile py-space-2xl text-center md:px-margin-tablet lg:px-margin">
        <div className="mx-auto max-w-2xl">
          <BrandMark className="mx-auto block h-11 w-11 text-on-surface" accentClassName="text-secondary" />
          <h2 className="mt-2 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
            Commission your piece
          </h2>
          <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
            Tell us the story you want to wear. A master digitizer will reply within one to two working days
            with a proof and a quotation.
          </p>
          <div className="mt-space-md flex flex-col items-center justify-center gap-space-sm sm:flex-row">
            <Link href="/custom" className="btn-primary">
              Open the custom studio
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
