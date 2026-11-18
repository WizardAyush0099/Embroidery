"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { imagery } from "@/lib/imagery";

const threads = [
  { name: "Terracotta silk", hex: "#914b34" },
  { name: "Noir filament", hex: "#202020" },
  { name: "Imperial gold", hex: "#b39352" },
  { name: "Eucalyptus", hex: "#4e5c4e" },
  { name: "Parchment", hex: "#8a857d" },
];

export function StudioTeaser() {
  const [text, setText] = useState("A • B");
  const [thread, setThread] = useState(threads[0]);

  return (
    <div className="flex h-full flex-col justify-between rounded-lg bg-surface-container-lowest p-space-lg shadow-xl">
      <div>
        <div className="mb-space-md flex items-center justify-between border-b border-surface-container-high pb-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
            Studio Live Configurator
          </span>
          <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Live preview
          </span>
        </div>

        <div className="relative mb-space-md flex aspect-square w-full items-center justify-center overflow-hidden rounded bg-surface-container-low p-space-lg">
          <Image
            src={imagery.studioMockup}
            alt="Heavyweight crewneck presented for bespoke monogramming"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-contain p-6"
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="rounded bg-surface-container-lowest/80 p-4 text-center shadow-lg backdrop-blur-sm">
              <span
                className="block font-display text-3xl font-bold tracking-widest drop-shadow-sm transition-colors duration-300"
                style={{ color: thread.hex }}
              >
                {text || "YOUR TEXT"}
              </span>
              <span className="mt-1 block font-label-sm text-[10px] uppercase tracking-widest text-outline">
                Satin stitch · Left chest
              </span>
            </div>
          </div>
        </div>

        <label htmlFor="teaser-monogram" className="atelier-label">
          Type monogram initials
        </label>
        <input
          id="teaser-monogram"
          value={text}
          maxLength={12}
          onChange={(event) => setText(event.target.value.toUpperCase())}
          className="w-full rounded bg-surface-container px-space-md py-2.5 font-display text-lg tracking-widest text-on-surface outline-none focus:ring-1 focus:ring-primary"
          placeholder="A • B"
        />

        <div className="mt-space-md">
          <span className="atelier-label">Thread palette</span>
          <div className="flex flex-wrap items-center gap-space-sm">
            {threads.map((option) => (
              <button
                key={option.name}
                type="button"
                title={option.name}
                aria-label={option.name}
                aria-pressed={thread.name === option.name}
                onClick={() => setThread(option)}
                className={`h-8 w-8 rounded-full transition-all duration-300 ${
                  thread.name === option.name
                    ? "ring-2 ring-primary ring-offset-2"
                    : "ring-1 ring-outline-variant hover:ring-outline"
                }`}
                style={{ backgroundColor: option.hex }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-space-lg rounded bg-surface-container p-space-md">
        <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
          <span>Master digitising proof</span>
          <span className="font-semibold text-on-surface">Within 24 hours</span>
        </div>
        <div className="mt-1 flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
          <span>Hand-guided needlework</span>
          <span className="font-semibold text-on-surface">Ships in 5–7 days</span>
        </div>
        <Link href="/custom" className="btn-primary mt-space-md w-full">
          Open the custom studio
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
