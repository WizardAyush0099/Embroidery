"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const primaryLinks = [
  { href: "/shop", label: "Shop All" },
  { href: "/custom", label: "Custom Embroidery Studio" },
  { href: "/about", label: "The Craft & Atelier" },
  { href: "/contact", label: "Contact" },
];

export function Header({
  announcement,
  brandName,
  categories,
}: {
  announcement: string | null;
  brandName: string;
  categories: Category[];
}) {
  const { count, hydrated } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
    setSearchOpen(false);
  }

  const [firstWord, ...rest] = brandName.split(" ");

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-primary px-4 py-2 text-center">
        <p className="truncate font-label-sm text-[10px] uppercase tracking-[0.2em] text-on-primary/90">
          {announcement ??
            "Complimentary bespoke hand monogramming on orders above ₹25,000 · Pure handcraft by master karigars"}
        </p>
      </div>

      <div className="border-b border-outline-variant/70 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-margin-mobile py-4 md:px-margin-tablet lg:px-margin">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="material-symbols-outlined text-[22px] text-on-surface lg:hidden"
            >
              {menuOpen ? "close" : "menu"}
            </button>
            <Link href="/" className="group flex items-center gap-2.5" aria-label={`${brandName} home`}>
              <span className="material-symbols-outlined text-[26px] text-secondary transition-transform duration-500 group-hover:rotate-45">
                flare
              </span>
              <span className="font-display text-[19px] uppercase leading-none tracking-[0.16em] text-on-surface md:text-[22px]">
                {firstWord}
                {rest.length > 0 && (
                  <span className="mt-1 block font-normal italic tracking-[0.22em] text-secondary">
                    {rest.join(" ")}
                  </span>
                )}
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 font-label-md text-label-md uppercase tracking-widest text-on-surface-variant transition-colors hover:text-secondary"
              >
                Collections
                <span className="material-symbols-outlined text-[15px]">expand_more</span>
              </button>
              <div className="invisible absolute left-0 top-full w-64 translate-y-2 border border-outline-variant/70 bg-surface-container-lowest p-2 opacity-0 shadow-float transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <Link
                  href="/shop"
                  className="block px-3 py-2.5 font-label-sm text-label-sm uppercase tracking-widest text-secondary hover:bg-surface-container"
                >
                  All Garments
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/shop?category=${category.slug}`}
                    className="block px-3 py-2.5 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-label-md text-label-md uppercase tracking-widest transition-colors hover:text-secondary",
                  pathname === link.href ? "text-secondary" : "text-on-surface-variant",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen((open) => !open)}
              className="material-symbols-outlined p-2 text-[21px] text-on-surface transition-colors hover:text-secondary"
            >
              search
            </button>
            <Link
              href="/account"
              aria-label="Account"
              className="material-symbols-outlined hidden p-2 text-[21px] text-on-surface transition-colors hover:text-secondary sm:block"
            >
              person
            </Link>
            <Link
              href="/cart"
              aria-label={`Shopping bag, ${count} items`}
              className="relative flex items-center p-2 text-on-surface transition-colors hover:text-secondary"
            >
              <span className="material-symbols-outlined text-[21px]">shopping_bag</span>
              {hydrated && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 font-label-sm text-[9px] font-bold text-on-secondary">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-outline-variant/60 bg-surface-container-low px-margin-mobile py-3 md:px-margin-tablet lg:px-margin">
            <form onSubmit={submitSearch} className="mx-auto flex max-w-[1440px] items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-outline">search</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a garment, motif or technique…"
                className="w-full border-b border-outline-variant bg-transparent py-2 font-body-md text-body-md outline-none placeholder:text-outline focus:border-primary"
              />
              <button type="submit" className="btn-primary py-2">
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      {menuOpen && (
        <div className="absolute inset-x-0 top-full z-40 max-h-[80vh] overflow-y-auto border-b border-outline-variant bg-surface px-margin-mobile pb-8 pt-4 shadow-float lg:hidden">
          <form onSubmit={submitSearch} className="mb-4 flex items-center gap-2 border border-outline-variant bg-surface-container-lowest px-3">
            <span className="material-symbols-outlined text-[18px] text-outline">search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the atelier…"
              className="w-full bg-transparent py-2.5 font-body-sm text-body-sm outline-none"
            />
          </form>
          <p className="eyebrow mb-2">Collections</p>
          <div className="mb-4 flex flex-col divide-y divide-outline-variant/50 border-y border-outline-variant/50">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="flex items-center justify-between py-3 font-body-md text-body-md"
              >
                {category.name}
                <span className="material-symbols-outlined text-[16px] text-outline">arrow_outward</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-label-md text-label-md uppercase tracking-widest text-on-surface"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/account" className="font-label-md text-label-md uppercase tracking-widest text-on-surface">
              My Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
