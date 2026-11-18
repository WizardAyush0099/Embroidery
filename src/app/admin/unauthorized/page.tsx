import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Access Restricted",
  robots: { index: false },
};

export default async function UnauthorizedPage() {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-margin-mobile py-space-2xl">
      <div className="w-full max-w-lg border border-outline-variant/70 bg-surface-container-lowest p-space-xl text-center shadow-tactile">
        <span className="material-symbols-outlined text-[32px] text-error">gpp_bad</span>
        <h1 className="mt-2 font-display text-headline-lg text-on-surface">Access restricted</h1>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
          {user?.email
            ? `The account ${user.email} is signed in but is not authorised for the atelier operations portal.`
            : "You need to sign in with the authorised Google account."}
        </p>

        <div className="mt-space-md rounded border border-outline-variant/70 bg-surface-container-low p-space-md text-left font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
          <p className="font-label-sm text-[9px] uppercase tracking-wider text-outline">To grant access</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>
              In Supabase, open the SQL editor and run:
              <code className="mt-1 block break-all rounded bg-surface-container px-2 py-1 text-[11px]">
                insert into admin_users (email) values (&apos;you@gmail.com&apos;);
              </code>
            </li>
            <li>
              Add the same address to the <code className="text-[11px]">ADMIN_EMAILS</code> environment variable.
            </li>
            <li>Sign out and sign back in with that Google account.</li>
          </ol>
        </div>

        <div className="mt-space-lg flex flex-col items-center justify-center gap-space-sm sm:flex-row">
          <form action={signOut}>
            <button type="submit" className="btn-primary">
              Sign out
            </button>
          </form>
          <Link href="/" className="btn-secondary">
            Return to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
