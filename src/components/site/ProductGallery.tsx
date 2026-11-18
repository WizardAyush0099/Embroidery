"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({
  images,
  name,
  stitchCount,
  fabricLabel,
}: {
  images: string[];
  name: string;
  stitchCount: number | null;
  fabricLabel: string | null;
}) {
  const gallery = images.length > 0 ? images : ["/images/stitch/s28-editorial-garment-photograph-of-the-sovereign-heavyweight.jpg"];
  const [active, setActive] = useState(0);
  const [origin, setOrigin] = useState("50% 50%");
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="flex flex-col gap-space-sm sm:flex-row">
      {gallery.length > 1 && (
        <div className="no-scrollbar order-2 flex gap-2 overflow-x-auto sm:order-1 sm:w-20 sm:flex-col sm:overflow-visible">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${name}`}
              aria-pressed={active === index}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden border bg-surface-container transition-all sm:w-full ${
                active === index ? "border-primary" : "border-outline-variant/60 hover:border-outline"
              }`}
            >
              <Image src={image} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="order-1 flex-1 sm:order-2">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-low">
          <div
            className="absolute inset-0 cursor-zoom-in"
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * 100;
              const y = ((event.clientY - rect.top) / rect.height) * 100;
              setOrigin(`${x}% ${y}%`);
            }}
          >
            <Image
              src={gallery[active]}
              alt={`${name} — atelier photograph ${active + 1}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition-transform duration-500 ease-atelier"
              style={{ transform: zoomed ? "scale(1.6)" : "scale(1)", transformOrigin: origin }}
            />
          </div>

          <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5">
            {stitchCount ? (
              <span className="rounded bg-surface-container-lowest/90 px-2.5 py-1 font-label-sm text-[9px] uppercase tracking-wider text-on-surface backdrop-blur-sm">
                ✦ {stitchCount.toLocaleString("en-IN")} stitches
              </span>
            ) : null}
            {fabricLabel && (
              <span className="rounded bg-surface-container-lowest/90 px-2.5 py-1 font-label-sm text-[9px] uppercase tracking-wider text-outline backdrop-blur-sm">
                {fabricLabel}
              </span>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded bg-primary px-2.5 py-1.5 text-on-primary">
            <span className="material-symbols-outlined text-[14px]">zoom_in</span>
            <span className="font-label-sm text-[9px] uppercase tracking-widest">Hover to inspect thread</span>
          </div>
        </div>
      </div>
    </div>
  );
}
