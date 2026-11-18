"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/format";

export function CartView({
  shippingFee,
  freeShippingThreshold,
}: {
  shippingFee: number;
  freeShippingThreshold: number;
}) {
  const { lines, hydrated, subtotal, setQuantity, remove } = useCart();

  if (!hydrated) {
    return (
      <div className="border border-outline-variant/60 bg-surface-container-lowest p-space-xl text-center font-body-sm text-body-sm text-outline">
        Preparing your bag…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="border border-outline-variant/70 bg-surface-container-lowest px-space-lg py-space-2xl text-center">
        <span className="material-symbols-outlined text-[30px] text-secondary">shopping_bag</span>
        <h2 className="mt-2 font-headline-md text-headline-md">Your bag is empty</h2>
        <p className="mx-auto mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
          Explore the collection, or commission a piece stitched entirely to your brief.
        </p>
        <div className="mt-space-md flex flex-col items-center justify-center gap-space-sm sm:flex-row">
          <Link href="/shop" className="btn-primary">
            Shop the collection
          </Link>
          <Link href="/custom" className="btn-secondary">
            Open custom studio
          </Link>
        </div>
      </div>
    );
  }

  const shipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = subtotal + shipping;

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="border-t border-outline-variant/70">
          {lines.map((line) => (
            <div
              key={`${line.productId}-${line.size}-${line.color}`}
              className="flex gap-space-md border-b border-outline-variant/70 py-space-md"
            >
              <Link href={`/shop/${line.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden bg-surface-container">
                <Image src={line.image} alt={line.name} fill sizes="96px" className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm">
                        <Link href={`/shop/${line.slug}`} className="hover:text-secondary">
                          {line.name}
                        </Link>
                      </h3>
                      <p className="mt-1 font-label-sm text-[10px] uppercase tracking-wider text-outline">
                        Size {line.size}
                        {line.color ? ` · ${line.color}` : ""}
                      </p>
                    </div>
                    <span className="whitespace-nowrap font-body-md text-body-md font-semibold tabular-nums">
                      {formatINR(line.price * line.quantity)}
                    </span>
                  </div>
                </div>
                <div className="mt-space-sm flex items-center justify-between">
                  <div className="flex items-center border border-outline-variant">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(line.productId, line.size, line.color, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      className="px-2.5 py-1.5 text-outline hover:text-on-surface disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>
                    <span className="min-w-7 text-center font-body-sm text-body-sm font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(line.productId, line.size, line.color, line.quantity + 1)}
                      disabled={line.quantity >= 10}
                      className="px-2.5 py-1.5 text-outline hover:text-on-surface disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.productId, line.size, line.color)}
                    className="font-label-sm text-[10px] uppercase tracking-widest text-outline underline underline-offset-4 hover:text-error"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link href="/shop" className="mt-space-md inline-flex items-center gap-1 font-label-sm text-[10px] uppercase tracking-widest text-on-surface hover:text-secondary">
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          Continue shopping
        </Link>
      </div>

      <aside className="lg:col-span-5">
        <div className="sticky top-32 border border-outline-variant/70 bg-surface-container-lowest p-space-lg shadow-tactile">
          <h2 className="font-headline-md text-headline-md">Order summary</h2>
          <div className="mt-space-md space-y-2 border-b border-outline-variant/70 pb-space-md font-body-sm text-body-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-semibold tabular-nums">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">White-glove delivery</span>
              <span className="font-semibold tabular-nums">{shipping === 0 ? "Complimentary" : formatINR(shipping)}</span>
            </div>
            {freeShippingThreshold > 0 && subtotal < freeShippingThreshold && (
              <p className="pt-1 font-label-sm text-[10px] uppercase tracking-wider text-secondary">
                Add {formatINR(freeShippingThreshold - subtotal)} for complimentary delivery
              </p>
            )}
          </div>
          <div className="flex items-baseline justify-between py-space-md">
            <span className="font-headline-sm text-headline-sm">Total</span>
            <span className="font-headline-md text-headline-md font-semibold tabular-nums">{formatINR(total)}</span>
          </div>
          <Link href="/checkout" className="btn-primary w-full">
            Proceed to checkout
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
          <p className="mt-2 text-center font-label-sm text-[9px] uppercase tracking-wider text-outline">
            Secure checkout · Razorpay & pay on delivery
          </p>
        </div>
      </aside>
    </div>
  );
}
