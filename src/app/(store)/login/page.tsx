import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/clerk";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  const nextPath = next?.startsWith("/") ? next : "/account";

  if (user) redirect(nextPath);

  return (
    <div className="mx-auto w-full max-w-md px-margin-mobile py-space-2xl md:px-0">
      <div className="text-center">
        <span className="material-symbols-outlined text-[30px] text-secondary">flare</span>
        <h1 className="mt-2 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
          Patron Sign In
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Follow commissions, approve proofs and revisit every order.
        </p>
      </div>

      <div className="mt-space-xl border border-outline-variant/70 bg-surface-container-lowest p-space-lg shadow-tactile">
        <LoginForm configured={isClerkConfigured} nextPath={nextPath} />
      </div>

      <p className="mt-4 text-center font-body-sm text-[12px] text-on-surface-variant">
        Prefer to track a single order?{" "}
        <Link href="/track" className="text-secondary underline underline-offset-4">
          Track by order number
        </Link>
      </p>
    </div>
  );
}
