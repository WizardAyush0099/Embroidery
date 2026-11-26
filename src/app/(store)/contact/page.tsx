import type { Metadata } from "next";
import Link from "next/link";
import { getStoreSettings } from "@/lib/catalog";
import { STUDIO_PHONE_DISPLAY, STUDIO_PHONE_TEL, whatsAppUrlFromPhone } from "@/lib/contact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact the Atelier",
  description:
    "Speak to the Atelier Brodé concierge about orders, bespoke commissions, sizing or press requests.",
};

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const instagramHandle = settings.instagram?.replace(/^@/, "");
  const whatsappLink = whatsAppUrlFromPhone(settings.contact_phone);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-margin-mobile py-space-xl md:px-margin-tablet lg:px-margin">
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="lg:col-span-5">
          <span className="eyebrow">Concierge</span>
          <h1 className="mt-1 font-display text-display-lg-mobile leading-[1.05] text-on-surface md:text-display-lg">
            Speak to the atelier.
          </h1>
          <p className="mt-4 font-body-lg text-body-lg text-on-surface-variant">
            Our concierge answers bespoke, sizing and order questions within one working day. For custom
            commissions, the studio brief form gets you a proof and quotation fastest.
          </p>

          <div className="mt-space-xl flex flex-col divide-y divide-outline-variant/70 border-y border-outline-variant/70">
            <a href={`mailto:${settings.contact_email}`} className="group flex items-center justify-between gap-3 py-space-md">
              <div>
                <p className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Email</p>
                <p className="mt-0.5 font-body-md text-body-md text-on-surface group-hover:text-secondary">
                  {settings.contact_email}
                </p>
              </div>
              <span className="material-symbols-outlined text-[20px] text-outline group-hover:text-secondary">arrow_outward</span>
            </a>
            <a href={`tel:${STUDIO_PHONE_TEL}`} className="group flex items-center justify-between gap-3 py-space-md">
              <div>
                <p className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Telephone</p>
                <p className="mt-0.5 font-body-md text-body-md text-on-surface group-hover:text-secondary">
                  {settings.contact_phone}
                </p>
              </div>
              <span className="material-symbols-outlined text-[20px] text-outline group-hover:text-secondary">arrow_outward</span>
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center justify-between gap-3 py-space-md"
            >
              <div>
                <p className="font-label-sm text-[10px] uppercase tracking-wider text-outline">WhatsApp</p>
                <p className="mt-0.5 font-body-md text-body-md text-on-surface group-hover:text-secondary">
                  Message the studio · {STUDIO_PHONE_DISPLAY}
                </p>
              </div>
              <span className="material-symbols-outlined text-[20px] text-outline group-hover:text-secondary">arrow_outward</span>
            </a>
            {instagramHandle && (
              <a
                href={`https://instagram.com/${instagramHandle}`}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-center justify-between gap-3 py-space-md"
              >
                <div>
                  <p className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Instagram</p>
                  <p className="mt-0.5 font-body-md text-body-md text-on-surface group-hover:text-secondary">
                    @{instagramHandle}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[20px] text-outline group-hover:text-secondary">arrow_outward</span>
              </a>
            )}
          </div>

          <div className="mt-space-lg border border-outline-variant/70 bg-surface-container-low p-space-md">
            <p className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Atelier & showroom</p>
            <p className="mt-1 font-body-md text-body-md text-on-surface">{settings.address}</p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Visits by appointment, Monday to Saturday · 11:00–19:00 IST
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
            {[
              {
                icon: "stylus_note",
                title: "Bespoke commission",
                body: "Monograms, crests, artwork and full custom garments.",
                href: "/custom",
                cta: "Open the studio",
              },
              {
                icon: "package_2",
                title: "Order support",
                body: "Track a commission, change an address or request a size exchange.",
                href: "/track",
                cta: "Track an order",
              },
              {
                icon: "straighten",
                title: "Sizing & fit",
                body: "Every product page lists garment measurements and stock by size.",
                href: "/shop",
                cta: "Browse garments",
              },
              {
                icon: "verified",
                title: "Repairs & restoration",
                body: "Lifetime thread repair is included on every atelier piece.",
                href: "/about",
                cta: "Our guarantee",
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col justify-between border border-outline-variant/70 bg-surface-container-lowest p-space-lg transition-all hover:border-primary hover:shadow-tactile"
              >
                <div>
                  <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded bg-[#f6e7e0] text-[20px] text-secondary">
                    {card.icon}
                  </span>
                  <h2 className="mt-space-sm font-headline-sm text-headline-sm">{card.title}</h2>
                  <p className="mt-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{card.body}</p>
                </div>
                <span className="mt-space-md flex items-center gap-1 font-label-sm text-[10px] uppercase tracking-widest text-secondary">
                  {card.cta}
                  <span className="material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-space-xl">
            <h2 className="mb-space-sm font-headline-md text-headline-md">Frequently asked</h2>
            {[
              {
                q: "How long does a bespoke commission take?",
                a: "Digitising and proofing take 24–48 hours. Hand embroidery and finishing take 5–7 working days from proof approval, plus delivery.",
              },
              {
                q: "Do you ship outside India?",
                a: "Yes. International commissions ship insured via DHL. Duties are calculated at checkout by the courier on delivery.",
              },
              {
                q: "Can I embroider an existing garment?",
                a: "We only embroider garments made by the atelier, because fabric weight and pre-shrinking determine whether embroidery puckers over time.",
              },
              {
                q: "Is online payment secure?",
                a: "Payments are processed by Razorpay. The server verifies the encrypted HMAC signature for every payment before the order is marked paid.",
              },
            ].map((item) => (
              <details key={item.q} className="group border-b border-outline-variant/70">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 font-label-md text-label-md uppercase tracking-wider text-on-surface">
                  {item.q}
                  <span className="material-symbols-outlined text-[18px] text-outline transition-transform group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="pb-4 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
