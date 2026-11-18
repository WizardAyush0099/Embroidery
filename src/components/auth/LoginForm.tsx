"use client";

import { SignIn } from "@clerk/nextjs";

/**
 * Clerk's prebuilt sign-in card, tinted with the Stitch palette so it sits
 * inside the existing atelier panels rather than replacing them.
 */
export function LoginForm({ configured, nextPath = "/account" }: { configured: boolean; nextPath?: string }) {
  if (!configured) {
    return (
      <p className="border border-[#ddcfae] bg-[#f3ecdd] px-3 py-2 font-body-sm text-body-sm text-[#7a5a1e]">
        Clerk keys are missing. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable sign-in.
      </p>
    );
  }

  return (
    <SignIn
      routing="hash"
      fallbackRedirectUrl={nextPath}
      appearance={{
        variables: {
          colorPrimary: "#6f6146",
          colorBackground: "#fbf9f4",
          borderRadius: "0.125rem",
          fontFamily: "inherit",
        },
      }}
    />
  );
}
