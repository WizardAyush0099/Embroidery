"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "@/lib/actions/auth";

const navItems = [
  { href: "/admin", label: "Executive overview", icon: "space_dashboard", exact: true },
  { href: "/admin/requests", label: "Custom embroidery queue", icon: "stylus_note", badge: "requests" as const },
  { href: "/admin/orders", label: "Orders & fulfilment", icon: "receipt_long", badge: "orders" as const },
  { href: "/admin/products", label: "Garment & catalogue", icon: "checkroom" },
  { href: "/admin/inventory", label: "Stock & inventory", icon: "inventory_2" },
  { href: "/admin/categories", label: "Storefront merchandising", icon: "category" },
  { href: "/admin/settings", label: "Atelier settings", icon: "tune" },
];

export function AdminShell({
  brandName,
  email,
  pendingOrders,
  pendingRequests,
  children,
}: {
  brandName: string;
  email: string;
  pendingOrders: number;
  pendingRequests: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const badges = { orders: pendingOrders, requests: pendingRequests };

  return (
    <div className="min-h-screen bg-surface">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-[#1c1b1a] text-[#f3f0e9] transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-space-md py-space-md">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] text-[#c2a267]">flare</span>
              <span className="font-display text-[19px] uppercase leading-none tracking-[0.14em]">
                {brandName}
              </span>
            </Link>
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-label-sm text-[8px] uppercase tracking-wider text-white/70">
              Ops v1
            </span>
          </div>
          <p className="mt-2 font-label-sm text-[9px] uppercase tracking-[0.16em] text-white/40">
            Operations & workshop portal
          </p>
        </div>

        <div className="px-space-md py-space-sm">
          <div className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-2.5 py-2">
            <span className="material-symbols-outlined text-[16px] text-[#c2a267]">badge</span>
            <span className="truncate font-body-sm text-[11px] text-white/80">{email}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const badge = item.badge ? badges[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-0.5 flex items-center gap-2.5 rounded px-3 py-2.5 font-label-md text-[11px] uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white/85"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="rounded bg-[#914b34] px-1.5 py-0.5 font-label-sm text-[9px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-space-md">
          <Link
            href="/"
            target="_blank"
            className="mb-2 flex items-center gap-2 font-label-sm text-[10px] uppercase tracking-wider text-white/50 hover:text-white"
          >
            <span className="material-symbols-outlined text-[15px]">storefront</span>
            View storefront
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 font-label-sm text-[10px] uppercase tracking-wider text-white/50 hover:text-white"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              Sign out
            </button>
          </form>
          <p className="mt-3 font-label-sm text-[8px] uppercase tracking-wider text-white/25">
            Secured by Supabase Auth · RLS enforced
          </p>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-outline-variant/70 bg-surface/95 backdrop-blur-md">
          <div className="flex items-center gap-3 px-space-md py-3 lg:px-space-lg">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen((value) => !value)}
              className="material-symbols-outlined text-[22px] lg:hidden"
            >
              menu
            </button>

            <div className="hidden items-center gap-2 md:flex">
              <span className="flex items-center gap-1.5 rounded bg-surface-container-high px-2 py-1 font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Workshop active
              </span>
              <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">
                Lot 2026 · Mumbai
              </span>
            </div>

            <form action="/admin/products" className="ml-auto hidden w-64 items-center border border-outline-variant bg-surface-container-lowest px-2.5 sm:flex">
              <span className="material-symbols-outlined text-[16px] text-outline">search</span>
              <input
                type="search"
                name="q"
                placeholder="Search products, orders…"
                className="w-full bg-transparent px-2 py-1.5 font-body-sm text-[12px] outline-none placeholder:text-outline"
              />
            </form>

            <Link
              href="/admin/products/new"
              className="flex items-center gap-1.5 bg-primary px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest text-on-primary transition-colors hover:bg-secondary"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              New product
            </Link>
          </div>
        </header>

        <main className="px-space-md py-space-md lg:px-space-lg lg:py-space-lg">{children}</main>

        <footer className="flex flex-col items-start justify-between gap-2 border-t border-outline-variant/70 px-space-md py-4 font-label-sm text-[8px] uppercase tracking-wider text-outline md:flex-row md:items-center lg:px-space-lg">
          <span>Atelier Brodé · Operations console</span>
          <span>Orders, commissions and stock are live from Supabase</span>
        </footer>
      </div>
    </div>
  );
}
