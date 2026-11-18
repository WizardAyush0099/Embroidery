"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { firstImage } from "@/lib/utils";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const { add } = useCart();
  const sizes = product.sizes.length > 0 ? product.sizes : ["One Size"];
  const colours = product.colors;

  const stockFor = useMemo(
    () => (size: string) => {
      if (product.sizes.length === 0) return product.stock;
      return Number(product.size_stock?.[size] ?? 0);
    },
    [product],
  );

  const firstAvailable = sizes.find((size) => stockFor(size) > 0) ?? sizes[0];
  const [size, setSize] = useState(firstAvailable);
  const [colour, setColour] = useState(colours[0]?.name ?? "");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const available = stockFor(size);
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? product.compare_at_price - product.price
      : 0;

  function handleAdd() {
    if (available <= 0) {
      setFeedback("That size is sold out. Choose another size or commission a bespoke piece.");
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: firstImage(product.images),
      price: product.price,
      size,
      color: colour,
      quantity,
    });
    setFeedback(`${product.name} · ${size}${colour ? ` · ${colour}` : ""} added to your bag.`);
  }

  return (
    <div className="flex flex-col">
      <div className="mb-space-sm flex items-center gap-space-sm">
        <span className="rounded bg-secondary px-2.5 py-1 font-label-sm text-[9px] font-bold uppercase tracking-widest text-on-secondary">
          {product.technique ?? "Hand-guided embroidery"}
        </span>
        {product.is_new_arrival && (
          <span className="font-label-sm text-[9px] uppercase tracking-widest text-sage">New arrival</span>
        )}
      </div>

      <h1 className="font-display text-display-sm-mobile leading-tight text-on-surface md:text-display-sm">
        {product.name}
      </h1>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        {product.description ?? "An atelier garment engineered as a canvas for hand embroidery."}
      </p>

      <div className="mt-space-md flex flex-wrap items-baseline gap-3 border-b border-outline-variant/70 pb-space-md">
        <span className="font-headline-lg text-headline-lg font-semibold tabular-nums text-on-surface">
          {formatINR(product.price)}
        </span>
        {discount > 0 && (
          <>
            <span className="font-body-md text-body-md text-outline line-through tabular-nums">
              {formatINR(product.compare_at_price)}
            </span>
            <span className="font-label-sm text-[10px] uppercase tracking-widest text-secondary">
              Save {formatINR(discount)}
            </span>
          </>
        )}
        <span className="ml-auto font-label-sm text-[10px] uppercase tracking-widest text-outline">
          Inclusive of GST
        </span>
      </div>

      {colours.length > 0 && (
        <div className="mt-space-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              Shade · {colour || "Signature"}
            </span>
            <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">
              {colours.length} colourway{colours.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {colours.map((option) => (
              <button
                key={option.name}
                type="button"
                onClick={() => setColour(option.name)}
                aria-label={option.name}
                aria-pressed={colour === option.name}
                title={option.name}
                className={`h-9 w-9 rounded-full transition-all duration-300 ${
                  colour === option.name
                    ? "ring-2 ring-primary ring-offset-2"
                    : "ring-1 ring-outline-variant hover:ring-outline"
                }`}
                style={{ backgroundColor: option.hex }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-space-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Select size</span>
          <span className={`font-label-sm text-[10px] uppercase tracking-wider ${available > 0 ? "text-sage" : "text-error"}`}>
            {available > 0
              ? available <= 3
                ? `Only ${available} left in ${size}`
                : `In stock · ${size}`
              : `Sold out · ${size}`}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((option) => {
            const stock = stockFor(option);
            const disabled = stock <= 0;
            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSize(option);
                  setQuantity(1);
                  setFeedback(null);
                }}
                aria-pressed={size === option}
                className={`min-w-[48px] border px-3 py-2.5 font-label-md text-label-md uppercase tracking-wider transition-all ${
                  size === option
                    ? "border-primary bg-primary text-on-primary"
                    : disabled
                      ? "cursor-not-allowed border-outline-variant/50 bg-surface-container text-outline/50 line-through"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-space-lg flex flex-col gap-space-sm sm:flex-row">
        <div className="flex items-center border border-outline-variant bg-surface-container-lowest">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label="Decrease quantity"
            className="px-3 py-3 text-outline hover:text-on-surface disabled:opacity-40"
            disabled={quantity <= 1}
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <span className="min-w-8 text-center font-body-md text-body-md font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(10, available || 10, value + 1))}
            aria-label="Increase quantity"
            className="px-3 py-3 text-outline hover:text-on-surface disabled:opacity-40"
            disabled={quantity >= 10 || quantity >= available}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={available <= 0}
          className="btn-primary flex-1 py-3.5 disabled:bg-outline"
        >
          <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
          {available > 0 ? `Add to bag · ${formatINR(product.price * quantity)}` : "Sold out"}
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className="mt-space-sm flex flex-wrap items-center justify-between gap-2 border border-outline-variant/70 bg-surface-container-low px-space-sm py-2.5 font-body-sm text-body-sm"
        >
          <span>{feedback}</span>
          <Link href="/cart" className="font-label-sm text-[10px] uppercase tracking-widest text-secondary underline underline-offset-4">
            View bag
          </Link>
        </div>
      )}

      <Link
        href={`/custom?product=${product.slug}`}
        className="btn-secondary mt-space-sm w-full"
      >
        <span className="material-symbols-outlined text-[18px] text-secondary">stylus_note</span>
        Personalise in custom studio
      </Link>

      <div className="mt-space-md grid grid-cols-2 gap-2 border-t border-outline-variant/70 pt-space-md font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-secondary">local_shipping</span>
          Dispatch in 3–5 days
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-secondary">sync</span>
          14-day exchange
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
          Digital proof included
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-secondary">spa</span>
          GOTS organic fibre
        </span>
      </div>
    </div>
  );
}
