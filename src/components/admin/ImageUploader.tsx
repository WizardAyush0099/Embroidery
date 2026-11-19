"use client";

import { useRef, useState } from "react";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 10;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ImageUploader({ initialImages = [] }: { initialImages?: string[] }) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[] | null) {
    const selected = files ? Array.from(files) : [];
    if (selected.length === 0) return;
    setError(null);

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`You can keep up to ${MAX_IMAGES} photographs per garment.`);
      return;
    }

    const accepted: File[] = [];
    for (const file of selected.slice(0, room)) {
      if (!ALLOWED.includes(file.type)) {
        setError(`${file.name} must be a JPG, PNG, WEBP or AVIF image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 8 MB.`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    setUploading(true);
    try {
      const body = new FormData();
      accepted.forEach((file) => body.append("files", file));

      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const result = (await response.json().catch(() => ({}))) as {
        urls?: string[];
        failures?: string[];
        error?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "The upload failed. Please try again.");
        return;
      }

      if (result.urls?.length) {
        setImages((current) => [...current, ...(result.urls ?? [])].slice(0, MAX_IMAGES));
      }
      if (result.failures?.length) setError(result.failures.join(" "));
    } catch {
      setError("The upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((current) => current.filter((image) => image !== url));
  }

  function makeCover(url: string) {
    setImages((current) => [url, ...current.filter((image) => image !== url)]);
  }

  function moveImage(url: string, direction: -1 | 1) {
    setImages((current) => {
      const index = current.indexOf(url);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div>
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((url, index) => (
          <div
            key={url}
            className="group relative aspect-[4/5] overflow-hidden border border-outline-variant bg-surface-container"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 font-label-sm text-[8px] uppercase tracking-wider text-on-primary">
                Cover
              </span>
            )}
            <span className="absolute right-1 top-1 rounded bg-primary/80 px-1.5 py-0.5 font-label-sm text-[8px] tabular-nums text-on-primary">
              {index + 1}/{images.length}
            </span>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-primary/85 p-1.5">
              <button
                type="button"
                onClick={() => moveImage(url, -1)}
                disabled={index === 0}
                className="material-symbols-outlined text-[15px] text-on-primary hover:text-secondary-fixed disabled:opacity-30"
                aria-label={`Move image ${index + 1} earlier`}
              >
                chevron_left
              </button>
              {index !== 0 ? (
                <button
                  type="button"
                  onClick={() => makeCover(url)}
                  className="font-label-sm text-[8px] uppercase tracking-wider text-on-primary hover:text-secondary-fixed"
                >
                  Make cover
                </button>
              ) : (
                <span className="font-label-sm text-[8px] uppercase tracking-wider text-on-primary/70">Storefront</span>
              )}
              <button
                type="button"
                onClick={() => moveImage(url, 1)}
                disabled={index === images.length - 1}
                className="material-symbols-outlined text-[15px] text-on-primary hover:text-secondary-fixed disabled:opacity-30"
                aria-label={`Move image ${index + 1} later`}
              >
                chevron_right
              </button>
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="material-symbols-outlined text-[15px] text-on-primary hover:text-error-container"
                aria-label={`Remove image ${index + 1}`}
              >
                delete
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          disabled={uploading || images.length >= MAX_IMAGES}
          className={`flex aspect-[4/5] flex-col items-center justify-center gap-1 border border-dashed bg-surface-container-low px-2 text-center font-label-sm text-[9px] uppercase tracking-wider transition-colors disabled:opacity-50 ${
            dragging ? "border-secondary text-secondary" : "border-outline-variant text-outline hover:border-primary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {uploading ? "progress_activity" : "add_photo_alternate"}
          </span>
          {uploading ? "Uploading…" : images.length >= MAX_IMAGES ? "10 max" : "Upload or drop"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <p className="mt-1.5 font-body-sm text-[11px] text-outline">
        First photograph is the storefront cover; every photograph appears on the product page. Use the
        arrows to reorder, and keep each file under 8 MB.
      </p>
      {error && <p className="mt-1 font-body-sm text-[11px] text-error">{error}</p>}
      {images.length === 0 && !error && (
        <p className="mt-1 font-body-sm text-[11px] text-error">At least one photograph is required.</p>
      )}
    </div>
  );
}
