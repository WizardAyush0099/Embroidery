"use client";

import { useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ImageUploader({ initialImages = [] }: { initialImages?: string[] }) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase is not connected, so uploads cannot be stored.");
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 8 MB.`);
        continue;
      }
      if (!ALLOWED.includes(file.type)) {
        setError(`${file.name} must be a JPG, PNG, WEBP or AVIF image.`);
        continue;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    if (uploaded.length > 0) setImages((current) => [...current, ...uploaded].slice(0, 10));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(url: string) {
    setImages((current) => current.filter((image) => image !== url));
  }

  function makeCover(url: string) {
    setImages((current) => [url, ...current.filter((image) => image !== url)]);
  }

  return (
    <div>
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((url, index) => (
          <div key={url} className="group relative aspect-[4/5] overflow-hidden border border-outline-variant bg-surface-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 font-label-sm text-[8px] uppercase tracking-wider text-on-primary">
                Cover
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-1 bg-primary/85 p-1.5 transition-transform group-hover:translate-y-0">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(url)}
                  className="font-label-sm text-[8px] uppercase tracking-wider text-on-primary hover:text-secondary-fixed"
                >
                  Make cover
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="ml-auto material-symbols-outlined text-[15px] text-on-primary hover:text-error-container"
                aria-label="Remove image"
              >
                delete
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= 10}
          className="flex aspect-[4/5] flex-col items-center justify-center gap-1 border border-dashed border-outline-variant bg-surface-container-low font-label-sm text-[9px] uppercase tracking-wider text-outline transition-colors hover:border-primary hover:text-on-surface disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[22px]">{uploading ? "progress_activity" : "add_photo_alternate"}</span>
          {uploading ? "Uploading…" : images.length >= 10 ? "10 max" : "Upload"}
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
        First image is the storefront cover. Hover a photo to reorder or delete.
      </p>
      {error && <p className="mt-1 font-body-sm text-[11px] text-error">{error}</p>}
      {images.length === 0 && !error && (
        <p className="mt-1 font-body-sm text-[11px] text-error">At least one photograph is required.</p>
      )}
    </div>
  );
}
