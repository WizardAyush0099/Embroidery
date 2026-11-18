"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import {
  createReferenceUploadUrls,
  submitCustomRequest,
  type CustomRequestState,
} from "@/lib/actions/custom-request";
import { formatINR } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Product } from "@/lib/types";

const initialState: CustomRequestState = { status: "idle" };

const fonts = [
  { id: "Dilofé Serif Classic", note: "High-contrast luxury", className: "font-display" },
  { id: "Artisan Gothic", note: "Fine flourishes", className: "font-display italic" },
  { id: "Architectural Sans", note: "Geometric clean", className: "font-body uppercase tracking-[0.2em]" },
  { id: "Ivy Appliqué", note: "Heritage collage", className: "font-display italic tracking-wide" },
];

const threads = [
  { name: "Terracotta silk", hex: "#914b34" },
  { name: "Noir filament", hex: "#202020" },
  { name: "Imperial gold", hex: "#b39352" },
  { name: "Eucalyptus green", hex: "#4e5c4e" },
  { name: "Raw ecru", hex: "#8a857d" },
  { name: "Oxblood", hex: "#6d2b2b" },
];

const placements = [
  { id: "Left chest", note: "Satin monogram · 4×4″" },
  { id: "Centre chest", note: "Balanced crest · up to 7″" },
  { id: "Left sleeve", note: "Continuous line · 3″" },
  { id: "Upper back", note: "Statement panel · up to 12″" },
];

const placementStyles: Record<string, { top: string; left: string; fontSize: string }> = {
  "Left chest": { top: "38%", left: "62%", fontSize: "1.15rem" },
  "Centre chest": { top: "45%", left: "50%", fontSize: "1.6rem" },
  "Left sleeve": { top: "52%", left: "16%", fontSize: "0.85rem" },
  "Upper back": { top: "27%", left: "50%", fontSize: "1.8rem" },
};

export function CustomStudio({
  garments,
  initialSlug,
  contactEmail,
}: {
  garments: Product[];
  initialSlug?: string;
  contactEmail: string;
}) {
  const [state, formAction, pending] = useActionState(submitCustomRequest, initialState);

  const [garmentId, setGarmentId] = useState(
    (initialSlug && garments.find((garment) => garment.slug === initialSlug)?.id) || garments[0]?.id || "",
  );
  const garment = garments.find((item) => item.id === garmentId) ?? garments[0];
  const [size, setSize] = useState(garment?.sizes[0] ?? "One Size");
  const [color, setColor] = useState(garment?.colors[0]?.name ?? "");
  const [customText, setCustomText] = useState("");
  const [fontStyle, setFontStyle] = useState(fonts[0].id);
  const [thread, setThread] = useState(threads[0]);
  const [placement, setPlacement] = useState(placements[0].id);
  const [description, setDescription] = useState("");
  const [uploads, setUploads] = useState<Array<{ name: string; path: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleReferenceFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const selected = Array.from(files).slice(0, 4);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadError(null);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setUploadError("Storage is not connected yet, so reference artwork cannot be uploaded.");
      return;
    }

    setUploading(true);
    try {
      const prepared = await createReferenceUploadUrls(
        selected.map((file) => ({ name: file.name, type: file.type, size: file.size })),
      );
      if (!prepared.ok) {
        setUploadError(prepared.error);
        return;
      }

      const uploaded: Array<{ name: string; path: string }> = [];
      for (let index = 0; index < prepared.uploads.length; index += 1) {
        const target = prepared.uploads[index];
        const file = selected[index];
        const { error } = await supabase.storage
          .from("custom-references")
          .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
        if (error) {
          setUploadError(`${file.name} could not be uploaded: ${error.message}`);
        } else {
          uploaded.push({ name: target.name, path: target.path });
        }
      }

      if (uploaded.length > 0) setUploads((current) => [...current, ...uploaded].slice(0, 4));
    } catch (error) {
      console.error("reference upload failed", error);
      setUploadError("The reference upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const selectedFont = useMemo(
    () => fonts.find((font) => font.id === fontStyle) ?? fonts[0],
    [fontStyle],
  );
  const previewStyle = placementStyles[placement] ?? placementStyles["Left chest"];

  function chooseGarment(next: Product) {
    setGarmentId(next.id);
    setSize(next.sizes[0] ?? "One Size");
    setColor(next.colors[0]?.name ?? "");
  }

  if (garments.length === 0) {
    return (
      <div className="border border-outline-variant/70 bg-surface-container-lowest px-space-lg py-space-2xl text-center">
        <span className="material-symbols-outlined text-[30px] text-secondary">stylus_note</span>
        <h2 className="mt-2 font-headline-md text-headline-md">The studio is being prepared</h2>
        <p className="mx-auto mt-2 max-w-lg font-body-md text-body-md text-on-surface-variant">
          Customisable atelier garments have not been published yet. Write to the concierge at{" "}
          <a href={`mailto:${contactEmail}`} className="text-secondary underline underline-offset-4">
            {contactEmail}
          </a>{" "}
          and we will prepare your commission personally.
        </p>
        <Link href="/shop" className="btn-primary mt-space-md">
          Browse the collection
        </Link>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div className="mx-auto max-w-2xl border border-outline-variant/70 bg-surface-container-lowest p-space-xl text-center shadow-tactile">
        <span className="material-symbols-outlined text-[34px] text-secondary">check_circle</span>
        <h2 className="mt-2 font-display text-display-sm-mobile md:text-display-sm">Your brief is with the atelier</h2>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{state.message}</p>
        <p className="mt-4 inline-block border border-outline-variant bg-surface-container-low px-4 py-2 font-label-md text-label-md uppercase tracking-widest">
          Request {state.requestNumber}
        </p>
        <div className="mt-space-lg grid grid-cols-1 gap-2 text-left font-body-sm text-body-sm text-on-surface-variant sm:grid-cols-2">
          <p>
            <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Garment</span>
            <br />
            {garment?.name}
          </p>
          <p>
            <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Specification</span>
            <br />
            {size}
            {color ? ` · ${color}` : ""}
          </p>
          <p>
            <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Placement</span>
            <br />
            {placement} · {fontStyle}
          </p>
          <p>
            <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Thread</span>
            <br />
            {thread.name}
          </p>
        </div>
        <div className="mt-space-lg flex flex-col items-center justify-center gap-space-sm sm:flex-row">
          <Link href="/account" className="btn-primary">
            View my commissions
          </Link>
          <Link href="/shop" className="btn-secondary">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      <input type="hidden" name="garment_id" value={garmentId} />
      <input type="hidden" name="size" value={size} />
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="font_style" value={fontStyle} />
      <input type="hidden" name="placement" value={placement} />
      <input type="hidden" name="thread_color" value={thread.name} />
      <input type="hidden" name="reference_paths" value={JSON.stringify(uploads.map((file) => file.path))} />

      <div className="lg:col-span-7">
        <div className="sticky top-32">
          <div className="border border-outline-variant/70 bg-surface-container-lowest p-space-md shadow-tactile">
            <div className="mb-space-sm flex items-center justify-between">
              <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline">
                Live embroidery atelier
              </span>
              <span className="flex items-center gap-1.5 font-label-sm text-[10px] uppercase tracking-wider text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                {placement}
              </span>
            </div>

            <div className="relative aspect-[4/5] w-full overflow-hidden rounded bg-surface-container-low">
              <Image
                src={garment?.images[0] ?? "/images/stitch/s50-ultra-heavy-500-gsm-dense-canvas-cotton.jpg"}
                alt={garment?.name ?? "Selected garment"}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/25 via-transparent to-transparent" />
              <div
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center ${selectedFont.className}`}
                style={{
                  top: previewStyle.top,
                  left: previewStyle.left,
                  color: thread.hex,
                  fontSize: previewStyle.fontSize,
                  textShadow: "0 1px 2px rgba(255,255,255,0.35)",
                }}
              >
                {customText || "YOUR TEXT"}
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded bg-surface/90 px-3 py-2 backdrop-blur-sm">
                <span className="font-label-sm text-[9px] uppercase tracking-wider text-on-surface">
                  {garment?.fabric_label ?? "Atelier canvas"}
                </span>
                <span className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">
                  {garment?.stitch_count
                    ? `✦ ${garment.stitch_count.toLocaleString("en-IN")} stitches`
                    : "Stitch count on proof"}
                </span>
              </div>
            </div>

            <div className="mt-space-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {garment?.colors.slice(0, 5).map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    title={option.name}
                    aria-label={option.name}
                    onClick={() => setColor(option.name)}
                    className={`h-6 w-6 rounded-full transition-all ${
                      color === option.name ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-outline-variant"
                    }`}
                    style={{ backgroundColor: option.hex }}
                  />
                ))}
              </div>
              <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">
                {color || "Signature shade"}
              </span>
            </div>
          </div>

          <div className="mt-space-sm flex items-start gap-2 border border-outline-variant/60 bg-surface-container-low p-3">
            <span className="material-symbols-outlined text-[18px] text-secondary">handyman</span>
            <p className="font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
              Master karigar hand-stitching. Hand-drawn needlework carton and stencil transfer with pure
              hand-guided aari and zardozi needlework.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-space-lg lg:col-span-5">
        <div className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <div className="mb-space-sm flex items-center justify-between">
            <h2 className="font-display text-headline-md">Atelier Bespoke</h2>
            <span className="rounded bg-secondary px-2 py-0.5 font-label-sm text-[9px] uppercase tracking-widest text-on-secondary">
              Edition 2026
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Compose bespoke monograms or submit custom iconography. Every motif is hand-drawn, stencilled
            and embroidered by master karigars.
          </p>
          <ol className="mt-space-md grid grid-cols-4 gap-1 border-t border-outline-variant/70 pt-space-sm font-label-sm text-[9px] uppercase tracking-wider">
            {["Garment", "Placement", "Artwork", "Review"].map((step, index) => (
              <li key={step} className={index === 0 ? "text-secondary" : "text-outline"}>
                <span className="mr-1 font-bold">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <div className="mb-space-sm flex items-center justify-between">
            <h3 className="font-label-md text-label-md uppercase tracking-widest">1 · Garment silhouette</h3>
            <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">
              {garments.length} available
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {garments.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => chooseGarment(option)}
                className={`flex items-center gap-3 border p-2 text-left transition-all ${
                  garmentId === option.id ? "border-primary bg-surface-container-low" : "border-outline-variant hover:border-outline"
                }`}
              >
                <span className="relative h-14 w-12 shrink-0 overflow-hidden bg-surface-container">
                  <Image src={option.images[0] ?? "/images/stitch/s50-ultra-heavy-500-gsm-dense-canvas-cotton.jpg"} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="flex-1">
                  <span className="block font-body-sm text-body-sm font-semibold">{option.name}</span>
                  <span className="block font-label-sm text-[9px] uppercase tracking-wider text-outline">
                    {option.fabric_label ?? "Atelier canvas"}
                  </span>
                </span>
                <span className="font-body-sm text-body-sm font-semibold tabular-nums">{formatINR(option.price)}</span>
              </button>
            ))}
          </div>

          <div className="mt-space-md">
            <span className="atelier-label">Size</span>
            <div className="flex flex-wrap gap-2">
              {(garment?.sizes.length ? garment.sizes : ["One Size"]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSize(option)}
                  className={`min-w-[44px] border px-3 py-2 font-label-sm text-[10px] uppercase tracking-wider transition-all ${
                    size === option
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface-container-lowest hover:border-primary"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <h3 className="mb-space-sm font-label-md text-label-md uppercase tracking-widest">2 · Bespoke text & artwork</h3>
          <label className="block">
            <span className="atelier-label">Primary text / monogram initials</span>
            <input
              name="custom_text"
              value={customText}
              onChange={(event) => setCustomText(event.target.value.toUpperCase())}
              maxLength={120}
              placeholder="e.g. A • B or आपका नाम"
              className="atelier-input"
            />
            <span className="mt-1 block font-body-sm text-[11px] text-flax-grey">{customText.length}/120 characters</span>
          </label>

          <div className="mt-space-md">
            <span className="atelier-label">Embroidery font typography</span>
            <div className="grid grid-cols-2 gap-2">
              {fonts.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setFontStyle(font.id)}
                  className={`border p-2.5 text-left transition-all ${
                    fontStyle === font.id ? "border-primary bg-surface-container-low" : "border-outline-variant hover:border-outline"
                  }`}
                >
                  <span className={`block text-[15px] text-on-surface ${font.className}`}>{font.id.split(" ")[0]}</span>
                  <span className="mt-0.5 block font-label-sm text-[8px] uppercase tracking-wider text-outline">
                    {font.note}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-space-md">
            <span className="atelier-label">Thread palette</span>
            <div className="flex flex-wrap items-center gap-2.5">
              {threads.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  title={option.name}
                  aria-label={option.name}
                  aria-pressed={thread.name === option.name}
                  onClick={() => setThread(option)}
                  className={`h-8 w-8 rounded-full transition-all ${
                    thread.name === option.name ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-outline-variant"
                  }`}
                  style={{ backgroundColor: option.hex }}
                />
              ))}
            </div>
            <p className="mt-1.5 font-label-sm text-[9px] uppercase tracking-wider text-outline">{thread.name}</p>
          </div>

          <div className="mt-space-md">
            <span className="atelier-label">Embroidery placement</span>
            <div className="flex flex-col gap-2">
              {placements.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPlacement(option.id)}
                  className={`flex items-center justify-between border px-3 py-2 text-left transition-all ${
                    placement === option.id ? "border-primary bg-surface-container-low" : "border-outline-variant hover:border-outline"
                  }`}
                >
                  <span className="font-label-sm text-[10px] uppercase tracking-wider text-on-surface">{option.id}</span>
                  <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">{option.note}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <h3 className="mb-space-sm font-label-md text-label-md uppercase tracking-widest">3 · Reference & brief</h3>

          <label className="block">
            <span className="atelier-label">Describe your design</span>
            <textarea
              name="description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Thread direction, motif references, a crest or phrase, the story behind the piece…"
              className="atelier-input resize-y"
            />
          </label>

          <div className="mt-space-md">
            <span className="atelier-label">Reference images or logo (up to 4)</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
              onChange={(event) => void handleReferenceFiles(event.target.files)}
              disabled={uploading || uploads.length >= 4}
              className="w-full border border-dashed border-outline-variant bg-surface-container-low px-3 py-3 font-body-sm text-body-sm file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-label-sm file:uppercase file:tracking-widest file:text-on-primary hover:border-primary disabled:opacity-60"
            />
            <span className="mt-1 block font-body-sm text-[11px] text-flax-grey">
              {uploading
                ? "Uploading reference artwork…"
                : "JPG, PNG, WEBP or PDF · up to 8 MB each. Stored privately; only the atelier can open them."}
            </span>
            {uploadError && <p className="mt-1 font-body-sm text-[11px] text-error">{uploadError}</p>}
            {uploads.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {uploads.map((file) => (
                  <li
                    key={file.path}
                    className="flex max-w-full items-center gap-1.5 rounded-full border border-outline-variant/70 bg-surface-container-low px-2.5 py-1 font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploads((current) => current.filter((entry) => entry.path !== file.path))}
                      className="material-symbols-outlined text-[12px] hover:text-error"
                      aria-label={`Remove ${file.name}`}
                    >
                      close
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-space-md grid grid-cols-1 gap-space-sm sm:grid-cols-2">
            <label>
              <span className="atelier-label">Your name</span>
              <input name="name" required className="atelier-input" autoComplete="name" />
            </label>
            <label>
              <span className="atelier-label">Email</span>
              <input name="email" type="email" required className="atelier-input" autoComplete="email" />
            </label>
            <label className="sm:col-span-2">
              <span className="atelier-label">Phone</span>
              <input name="phone" required className="atelier-input" autoComplete="tel" placeholder="+91 98200 00000" />
            </label>
          </div>
        </section>

        <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-headline-md">Atelier valuation</h3>
            <span className="rounded bg-surface-container px-2 py-0.5 font-label-sm text-[9px] uppercase tracking-wider text-outline">
              Lot #AB-26
            </span>
          </div>
          <div className="mt-space-sm space-y-2 font-body-sm text-body-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">{garment?.name}</span>
              <span className="font-semibold tabular-nums">{formatINR(garment?.price ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Bespoke digitising & hand-work</span>
              <span className="text-on-surface-variant">Quoted after proof</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Stencil transfer & proof</span>
              <span className="font-semibold text-sage">Included</span>
            </div>
          </div>
          <div className="my-space-sm flex items-baseline justify-between border-t border-outline-variant/70 pt-space-sm">
            <span className="font-headline-sm text-headline-sm">Base garment</span>
            <span className="font-display text-headline-md font-semibold tabular-nums">
              {formatINR(garment?.price ?? 0)}
            </span>
          </div>
          <p className="font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
            Hand-work is quoted per motif after the master digitizer reviews your brief. No payment is taken
            now — you approve the quotation before a needle is threaded.
          </p>

          {state.status === "error" && (
            <p role="alert" className="mt-space-sm border border-error/30 bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">
              {state.message}
            </p>
          )}

          <button type="submit" disabled={pending || uploading} className="btn-primary mt-space-md w-full py-4">
            {pending ? "Sending your brief…" : uploading ? "Uploading artwork…" : "Submit bespoke request"}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <p className="mt-2 text-center font-label-sm text-[9px] uppercase tracking-wider text-outline">
            Reply within 1–2 working days · No obligation to proceed
          </p>
        </section>
      </div>
    </form>
  );
}
