"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { saveProduct, type ProductFormState } from "@/lib/actions/admin-products";
import type { Category, Product } from "@/lib/types";

const initialState: ProductFormState = { status: "idle" };
const presetSizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
const presetColours = [
  { name: "Washed Noir", hex: "#202020" },
  { name: "Raw Ecru", hex: "#e8e4da" },
  { name: "Mineral Sage", hex: "#7d8a76" },
  { name: "Espresso", hex: "#4a3b32" },
  { name: "Terracotta", hex: "#914b34" },
  { name: "Natural Flax", hex: "#d1c7b7" },
  { name: "Imperial Gold", hex: "#b39352" },
  { name: "Forest", hex: "#27382b" },
];

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: Product;
}) {
  const [state, formAction, pending] = useActionState(saveProduct, initialState);
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? ["S", "M", "L", "XL"]);
  const [customSize, setCustomSize] = useState("");
  const [sizeStock, setSizeStock] = useState<Record<string, number>>(() => {
    const initialStock: Record<string, number> = {};
    for (const size of initial?.sizes ?? ["S", "M", "L", "XL"]) {
      initialStock[size] = Number(initial?.size_stock?.[size] ?? 0);
    }
    return initialStock;
  });
  const [colours, setColours] = useState(initial?.colors ?? presetColours.slice(0, 3));
  const [colourName, setColourName] = useState("");
  const [colourHex, setColourHex] = useState("#914b34");

  function toggleSize(size: string) {
    setSizes((current) => {
      if (current.includes(size)) {
        const next = current.filter((value) => value !== size);
        setSizeStock((stock) => {
          const copy = { ...stock };
          delete copy[size];
          return copy;
        });
        return next;
      }
      setSizeStock((stock) => ({ ...stock, [size]: stock[size] ?? 0 }));
      return [...current, size];
    });
  }

  function addCustomSize() {
    const value = customSize.trim().toUpperCase();
    if (!value || sizes.includes(value)) return;
    setSizes((current) => [...current, value]);
    setSizeStock((stock) => ({ ...stock, [value]: 0 }));
    setCustomSize("");
  }

  function addColour() {
    const name = colourName.trim();
    if (!name) return;
    setColours((current) =>
      current.some((colour) => colour.name === name || colour.hex === colourHex)
        ? current
        : [...current, { name, hex: colourHex }],
    );
    setColourName("");
  }

  const totalStock = sizes.reduce((sum, size) => sum + (Number(sizeStock[size]) || 0), 0);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-space-md xl:grid-cols-12">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="sizes" value={JSON.stringify(sizes)} />
      <input type="hidden" name="colors" value={JSON.stringify(colours)} />
      <input type="hidden" name="size_stock" value={JSON.stringify(sizeStock)} />

      <div className="flex flex-col gap-space-md xl:col-span-8">
        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <h2 className="mb-space-sm font-headline-sm text-headline-sm">Garment identity</h2>
          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="atelier-label">Product name</span>
              <input name="name" required defaultValue={initial?.name} className="atelier-input" placeholder="The Sovereign Heavyweight Hoodie" />
              {state.fieldErrors?.name && <span className="mt-1 block font-body-sm text-[11px] text-error">{state.fieldErrors.name}</span>}
            </label>
            <label>
              <span className="atelier-label">URL slug (optional)</span>
              <input name="slug" defaultValue={initial?.slug} className="atelier-input" placeholder="sovereign-heavyweight-hoodie" />
            </label>
            <label>
              <span className="atelier-label">Category</span>
              <select name="category_id" defaultValue={initial?.category_id ?? ""} className="atelier-input">
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="atelier-label">Description</span>
              <textarea name="description" rows={4} defaultValue={initial?.description ?? ""} className="atelier-input resize-y" placeholder="450 GSM organic French terry with a hand-guided botanical monogram…" />
            </label>
            <label>
              <span className="atelier-label">Fabric label</span>
              <input name="fabric_label" defaultValue={initial?.fabric_label ?? ""} className="atelier-input" placeholder="450 GSM Organic Fleece" />
            </label>
            <label>
              <span className="atelier-label">Embroidery technique</span>
              <input name="technique" defaultValue={initial?.technique ?? ""} className="atelier-input" placeholder="Satin Stitch & Micro-Chain" />
            </label>
            <label>
              <span className="atelier-label">Stitch count</span>
              <input name="stitch_count" type="number" min={0} step={100} defaultValue={initial?.stitch_count ?? ""} className="atelier-input" placeholder="22400" />
            </label>
          </div>
        </section>

        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <h2 className="mb-space-sm font-headline-sm text-headline-sm">Photography</h2>
          <ImageUploader initialImages={initial?.images ?? []} />
          {state.fieldErrors?.images && <p className="mt-1 font-body-sm text-[11px] text-error">{state.fieldErrors.images}</p>}
        </section>

        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <div className="mb-space-sm flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm">Sizes & stock</h2>
            <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">
              Total {totalStock} units
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {presetSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`border px-3 py-1.5 font-label-sm text-[9px] uppercase tracking-wider transition-colors ${
                  sizes.includes(size)
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant text-on-surface-variant hover:border-primary"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <input
              value={customSize}
              onChange={(event) => setCustomSize(event.target.value)}
              placeholder="Custom size (e.g. 3XL)"
              className="atelier-input py-2"
            />
            <button type="button" onClick={addCustomSize} className="border border-outline-variant px-3 font-label-sm text-[9px] uppercase tracking-wider hover:border-primary">
              Add
            </button>
          </div>

          {sizes.length > 0 ? (
            <div className="mt-space-sm grid grid-cols-2 gap-2 sm:grid-cols-3">
              {sizes.map((size) => (
                <div key={size} className="border border-outline-variant/60 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-[10px] uppercase tracking-wider">{size}</span>
                    <button
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="material-symbols-outlined text-[14px] text-outline hover:text-error"
                      aria-label={`Remove ${size}`}
                    >
                      close
                    </button>
                  </div>
                  <label className="mt-1 block">
                    <span className="font-label-sm text-[8px] uppercase tracking-wider text-outline">Units in stock</span>
                    <input
                      type="number"
                      min={0}
                      value={sizeStock[size] ?? 0}
                      onChange={(event) =>
                        setSizeStock((stock) => ({
                          ...stock,
                          [size]: Math.max(0, Number(event.target.value) || 0),
                        }))
                      }
                      className="atelier-input mt-0.5 py-1.5"
                    />
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <label className="mt-space-sm block max-w-xs">
              <span className="atelier-label">Total stock (no size variants)</span>
              <input name="stock" type="number" min={0} defaultValue={initial?.stock ?? 0} className="atelier-input" />
            </label>
          )}
        </section>

        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <h2 className="mb-space-sm font-headline-sm text-headline-sm">Colourways</h2>
          <div className="flex flex-wrap gap-2">
            {colours.map((colour) => (
              <div key={`${colour.name}-${colour.hex}`} className="flex items-center gap-2 border border-outline-variant/60 px-2 py-1.5">
                <span className="h-4 w-4 rounded-full ring-1 ring-outline-variant" style={{ backgroundColor: colour.hex }} />
                <span className="font-label-sm text-[9px] uppercase tracking-wider">{colour.name}</span>
                <button
                  type="button"
                  onClick={() => setColours((current) => current.filter((item) => item.name !== colour.name))}
                  className="material-symbols-outlined text-[13px] text-outline hover:text-error"
                  aria-label={`Remove ${colour.name}`}
                >
                  close
                </button>
              </div>
            ))}
            {colours.length === 0 && (
              <span className="font-body-sm text-[11px] text-outline">No colourways yet.</span>
            )}
          </div>

          <div className="mt-space-sm flex flex-wrap items-end gap-2">
            <label>
              <span className="atelier-label">Colour name</span>
              <input value={colourName} onChange={(event) => setColourName(event.target.value)} placeholder="Mineral Sage" className="atelier-input py-2" />
            </label>
            <label>
              <span className="atelier-label">Hex</span>
              <input type="color" value={colourHex} onChange={(event) => setColourHex(event.target.value)} className="h-[42px] w-16 border border-outline-variant bg-surface-container-lowest p-1" />
            </label>
            <button type="button" onClick={addColour} className="border border-outline-variant px-3 py-3 font-label-sm text-[9px] uppercase tracking-wider hover:border-primary">
              Add colour
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {presetColours.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setColours((current) => (current.some((colour) => colour.name === preset.name) ? current : [...current, preset]))}
                className="flex items-center gap-1.5 border border-outline-variant/60 px-2 py-1 font-label-sm text-[8px] uppercase tracking-wider text-on-surface-variant hover:border-primary"
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.hex }} />
                {preset.name}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-space-md xl:col-span-4">
        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <h2 className="mb-space-sm font-headline-sm text-headline-sm">Pricing</h2>
          <label className="block">
            <span className="atelier-label">Selling price (₹)</span>
            <input name="price" type="number" min={0} step={1} required defaultValue={initial?.price ?? ""} className="atelier-input" />
            {state.fieldErrors?.price && <span className="mt-1 block font-body-sm text-[11px] text-error">{state.fieldErrors.price}</span>}
          </label>
          <label className="mt-2 block">
            <span className="atelier-label">Original price (₹, optional)</span>
            <input name="compare_at_price" type="number" min={0} step={1} defaultValue={initial?.compare_at_price ?? ""} className="atelier-input" />
            {state.fieldErrors?.compare_at_price && (
              <span className="mt-1 block font-body-sm text-[11px] text-error">{state.fieldErrors.compare_at_price}</span>
            )}
          </label>
          <p className="mt-2 font-body-sm text-[11px] text-outline">
            Prices are inclusive of GST and shown in INR across the storefront. When the original price is
            higher than the selling price, the storefront prints the discount amount and percentage
            automatically.
          </p>
        </section>

        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <h2 className="mb-space-sm font-headline-sm text-headline-sm">Storefront visibility</h2>
          <div className="flex flex-col gap-2 font-body-sm text-[12px]">
            {[
              { name: "is_published", label: "Published (visible in shop)", checked: initial?.is_published ?? true },
              { name: "is_featured", label: "Featured on homepage", checked: initial?.is_featured ?? false },
              { name: "is_new_arrival", label: "New arrival badge", checked: initial?.is_new_arrival ?? false },
              { name: "is_customisable", label: "Available in custom studio", checked: initial?.is_customisable ?? false },
            ].map((flag) => (
              <label key={flag.name} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" name={flag.name} defaultChecked={flag.checked} className="h-3.5 w-3.5 accent-secondary" />
                {flag.label}
              </label>
            ))}
          </div>

          <label className="mt-space-sm block border-t border-outline-variant/60 pt-space-sm">
            <span className="atelier-label">Display order</span>
            <input
              name="sort_order"
              type="number"
              step={1}
              defaultValue={initial?.sort_order ?? 0}
              className="atelier-input"
            />
            <span className="mt-1 block font-body-sm text-[11px] text-outline">
              Lower numbers appear first — 1, 2, 3… pins the catalogue order. Leave 0 for new garments so
              they sit on top until you number them.
            </span>
          </label>
        </section>

        {state.status === "error" && state.message && (
          <p role="alert" className="border border-error/30 bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">
            {state.message}
          </p>
        )}

        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Saving…" : initial ? "Save changes" : "Publish product"}
          </button>
          <Link href="/admin/products" className="btn-secondary mt-2 w-full">
            Cancel
          </Link>
          <p className="mt-2 text-center font-label-sm text-[8px] uppercase tracking-wider text-outline">
            Changes appear on the storefront immediately
          </p>
        </section>
      </div>
    </form>
  );
}
