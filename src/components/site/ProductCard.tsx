import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { firstImage } from "@/lib/utils";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : 0;

  return (
    <article className="group flex flex-col bg-surface-container-lowest">
      <Link
        href={`/shop/${product.slug}`}
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
            View Garment & Sizes
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </span>
        </div>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.stitch_count ? (
            <span className="bg-surface-container-lowest/90 px-2.5 py-1 font-label-sm text-[9px] uppercase tracking-wider text-on-surface backdrop-blur-sm">
              ✦ {product.stitch_count.toLocaleString("en-IN")} stitches
            </span>
          ) : null}
          {discount > 0 && (
            <span className="bg-secondary px-2.5 py-1 font-label-sm text-[9px] uppercase tracking-wider text-on-secondary">
              −{discount}%
            </span>
          )}
          {product.is_new_arrival && (
            <span className="bg-surface-container-lowest/90 px-2.5 py-1 font-label-sm text-[9px] uppercase tracking-wider text-sage backdrop-blur-sm">
              New arrival
            </span>
          )}
        </div>
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
            <span className="border border-on-surface px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest">
              Sold out
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-grow flex-col justify-between p-space-md">
        <div>
          <div className="mb-1 flex items-start justify-between gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              {product.categories?.name ?? product.fabric_label ?? "Atelier"}
            </span>
            <span className="flex items-baseline gap-1.5 whitespace-nowrap font-body-md text-body-md font-semibold tabular-nums">
              {formatINR(product.price)}
              {discount > 0 && (
                <span className="font-body-sm text-body-sm font-normal text-outline line-through">
                  {formatINR(product.compare_at_price)}
                </span>
              )}
            </span>
          </div>
          <h3 className="mb-2 font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-secondary">
            <Link href={`/shop/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className="mb-space-sm font-body-sm text-body-sm text-on-surface-variant">
            {product.technique ?? product.fabric_label ?? "Hand-finished embroidery"}
          </p>
        </div>
        <div className="flex items-center justify-between bg-surface-container-low px-space-sm py-2">
          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={`${product.id}-${color.name}`}
                title={color.name}
                className="h-4 w-4 rounded-full ring-1 ring-outline-variant"
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {product.colors.length === 0 && (
              <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">
                Signature finish
              </span>
            )}
          </div>
          <span className="font-label-sm text-[9px] font-bold uppercase tracking-wider text-secondary">
            {product.fabric_label ?? (product.stock > 0 ? "In stock" : "Sold out")}
          </span>
        </div>
      </div>
    </article>
  );
}
