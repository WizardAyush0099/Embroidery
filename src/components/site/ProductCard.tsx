import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { firstImage } from "@/lib/utils";

/**
 * Storefront card: deliberately short. Only the cover photograph, the title,
 * the price and the discount appear here — the rest of the story (brief
 * description, gallery, sizes, colourways) lives on /shop/[slug].
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const onSale = Boolean(product.compare_at_price && product.compare_at_price > product.price);
  const discount = onSale
    ? Math.round(((Number(product.compare_at_price) - product.price) / Number(product.compare_at_price)) * 100)
    : 0;

  return (
    <article className="group flex flex-col bg-surface-container-lowest">
      <Link
        href={`/shop/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="relative block aspect-[4/5] overflow-hidden bg-surface-container"
      >
        <Image
          src={firstImage(product.images)}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-atelier group-hover:scale-105"
        />
        {product.images[1] && (
          <Image
            src={product.images[1]}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 100vw, 25vw"
            className="hidden object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block"
          />
        )}
        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="flex w-full items-center justify-center gap-2 bg-primary py-2.5 font-label-sm text-label-sm uppercase tracking-widest text-on-primary">
            View garment
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </span>
        </div>
        {discount > 0 && (
          <span className="absolute left-3 top-3 bg-secondary px-2.5 py-1 font-label-sm text-[9px] uppercase tracking-wider text-on-secondary">
            −{discount}% off
          </span>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
            <span className="border border-on-surface px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest">
              Sold out
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-grow flex-col justify-between gap-2 p-space-md">
        <h3 className="font-headline-sm text-headline-sm leading-snug text-on-surface transition-colors group-hover:text-secondary">
          <Link href={`/shop/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-body-lg text-body-lg font-semibold tabular-nums text-on-surface">
            {formatINR(product.price)}
          </span>
          {onSale && (
            <span className="font-body-sm text-body-sm text-outline line-through tabular-nums">
              {formatINR(product.compare_at_price)}
            </span>
          )}
          {discount > 0 && (
            <span className="ml-auto font-label-sm text-[9px] uppercase tracking-wider text-secondary">
              Save {discount}%
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
