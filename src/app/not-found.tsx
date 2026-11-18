import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-margin-mobile py-space-2xl">
      <div className="max-w-lg text-center">
        <span className="material-symbols-outlined text-[32px] text-secondary">search_off</span>
        <p className="mt-2 font-label-sm text-[10px] uppercase tracking-[0.2em] text-outline">404 · Not in the archive</p>
        <h1 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
          This piece has left the atelier.
        </h1>
        <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
          The page or garment you are looking for is no longer catalogued. Explore the current collection, or
          commission something made only for you.
        </p>
        <div className="mt-space-lg flex flex-col items-center justify-center gap-space-sm sm:flex-row">
          <Link href="/shop" className="btn-primary">
            Shop the collection
          </Link>
          <Link href="/custom" className="btn-secondary">
            Custom studio
          </Link>
        </div>
      </div>
    </div>
  );
}
