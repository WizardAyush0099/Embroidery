"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Variant = "dropdown" | "list";

/**
 * The profile menu behind the person icon. Signed-in patrons get their account,
 * an "Admin dashboard" entry when the account is an authorised atelier admin,
 * and sign out. The admin flag is fetched only when the menu opens, so the
 * storefront never slows down for people who are not signed in.
 */
export function AccountMenu({ variant = "dropdown" }: { variant?: Variant }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open || !isSignedIn || roleChecked) return;
    let active = true;
    fetch("/api/account/menu", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { isAdmin: false }))
      .then((data) => {
        if (!active) return;
        setIsAdmin(Boolean(data?.isAdmin));
        setRoleChecked(true);
      })
      .catch(() => {
        if (active) setRoleChecked(true);
      });
    return () => {
      active = false;
    };
  }, [open, isSignedIn, roleChecked]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = user?.fullName ?? user?.firstName ?? email.split("@")[0] ?? "Patron";

  const links = (
    <>
      {isSignedIn ? (
        <>
          <Link href="/account" className="account-menu-item">
            <span className="material-symbols-outlined text-[18px] text-outline">person</span>
            My account
          </Link>
          <Link href="/track" className="account-menu-item">
            <span className="material-symbols-outlined text-[18px] text-outline">local_shipping</span>
            Track an order
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="account-menu-item border-t border-outline-variant/60 text-secondary"
            >
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              <span className="flex-1">Admin dashboard</span>
              <span className="rounded bg-secondary px-1.5 py-0.5 font-label-sm text-[8px] uppercase tracking-wider text-on-secondary">
                Admin
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOut({ redirectUrl: "/" })}
            className="account-menu-item w-full border-t border-outline-variant/60 text-left"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">logout</span>
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="account-menu-item">
            <span className="material-symbols-outlined text-[18px] text-outline">login</span>
            Sign in
          </Link>
          <Link href="/track" className="account-menu-item border-t border-outline-variant/60">
            <span className="material-symbols-outlined text-[18px] text-outline">local_shipping</span>
            Track an order
          </Link>
          <Link href="/custom" className="account-menu-item">
            <span className="material-symbols-outlined text-[18px] text-outline">stylus_note</span>
            Start a project
          </Link>
        </>
      )}
    </>
  );

  if (variant === "list") {
    return (
      <div className="border-y border-outline-variant/60">
        {isLoaded && isSignedIn && (
          <p className="border-b border-outline-variant/40 px-1 py-2 font-body-sm text-[12px] text-on-surface-variant">
            Signed in as <span className="text-on-surface">{email || name}</span>
          </p>
        )}
        {!isLoaded ? (
          <p className="px-1 py-3 font-label-md text-label-md uppercase tracking-widest text-outline">
            Loading account…
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-outline-variant/40">{links}</div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center rounded p-2 text-on-surface transition-colors hover:text-secondary"
      >
        <span className="material-symbols-outlined text-[21px]">
          {isLoaded && isSignedIn ? "account_circle" : "person"}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 border border-outline-variant/70 bg-surface-container-lowest shadow-float"
        >
          {isLoaded && isSignedIn ? (
            <>
              <div className="border-b border-outline-variant/60 px-space-sm py-3">
                <p className="truncate font-body-sm text-body-sm font-semibold text-on-surface">{name}</p>
                {email && (
                  <p className="truncate font-body-sm text-[11px] text-on-surface-variant">{email}</p>
                )}
              </div>
              <div className="flex flex-col py-1">{links}</div>
            </>
          ) : (
            <div className="flex flex-col py-1">{links}</div>
          )}
        </div>
      )}
    </div>
  );
}
