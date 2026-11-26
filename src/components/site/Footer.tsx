import Link from "next/link";
import { BrandMark } from "@/components/site/BrandMark";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { STUDIO_PHONE_TEL, whatsAppUrlFromPhone } from "@/lib/contact";
import type { Category, StoreSettings } from "@/lib/types";

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-space-2xl border-t border-outline-variant/70 bg-surface">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-gutter px-margin-mobile py-space-2xl md:grid-cols-2 md:px-margin-tablet lg:grid-cols-12 lg:px-margin">
        <div className="lg:col-span-4">
          <div className="mb-space-md flex items-center gap-2">
            <BrandMark className="h-7 w-7 text-on-surface" accentClassName="text-secondary" />
            <span className="font-display text-[20px] uppercase leading-none tracking-[0.16em]">
              {settings.brand_name}
            </span>
          </div>
          <p className="max-w-sm font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            Premium heavyweight streetwear and bespoke hand embroidery. Garments are designed in Mumbai
            and stitched by master karigars using mulberry silk, Egyptian cotton and raw Belgian flax.
          </p>
          <div className="mt-space-md flex items-center gap-space-xs border border-outline-variant/70 bg-surface-container-low px-3 py-2">
            <span className="material-symbols-outlined text-[16px] text-sage">verified</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-sage">
              Certified pure mulberry silk · Master guild lot
            </span>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-space-sm font-label-md text-label-md uppercase tracking-widest text-outline">
            Collections
          </h3>
          <ul className="flex flex-col gap-2">
            {categories.slice(0, 5).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-secondary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop" className="font-body-sm text-body-sm text-on-surface transition-colors hover:text-secondary">
                The Full Archive
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-space-sm font-label-md text-label-md uppercase tracking-widest text-outline">
            Atelier Care
          </h3>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/custom" className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-secondary">
                Bespoke Consultation
              </Link>
            </li>
            <li>
              <Link href="/track" className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-secondary">
                Track Your Commission
              </Link>
            </li>
            <li>
              <Link href="/about" className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-secondary">
                Thread & Silk Provenance
              </Link>
            </li>
            <li>
              <Link href="/contact" className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-secondary">
                White-Glove Delivery
              </Link>
            </li>
            <li>
              <Link href="/account" className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-secondary">
                My Orders & Commissions
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h3 className="mb-space-sm font-label-md text-label-md uppercase tracking-widest text-outline">
            The Gazette Privée
          </h3>
          <p className="mb-space-sm max-w-sm font-body-sm text-body-sm text-on-surface-variant">
            Receive private invitations to thread lot releases and atelier compositions.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-outline-variant/70">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-margin-mobile py-4 font-label-sm text-[10px] uppercase tracking-widest text-flax-grey md:flex-row md:px-margin-tablet lg:px-margin">
          <p>
            © {year} {settings.brand_name}. All rights reserved.
          </p>
          <p className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px]">location_on</span>
            {settings.address}
          </p>
          <a
            href={`tel:${STUDIO_PHONE_TEL}`}
            className="flex items-center gap-2 transition-colors hover:text-secondary"
          >
            <span className="material-symbols-outlined text-[15px]">call</span>
            {settings.contact_phone}
          </a>
          <a
            href={whatsAppUrlFromPhone(settings.contact_phone)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 transition-colors hover:text-secondary"
          >
            <span className="material-symbols-outlined text-[15px]">chat</span>
            WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
