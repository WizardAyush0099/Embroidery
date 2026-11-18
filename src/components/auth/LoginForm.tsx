"use client";

import { SignIn } from "@clerk/nextjs";

/**
 * Clerk's prebuilt sign-in card, tinted with the Stitch palette so it sits
 * inside the existing atelier panels rather than replacing them. The card is
 * forced fluid (no fixed Clerk width, padding or shadow) because it is nested
 * inside our own bordered panel — otherwise Clerk's default 400px card plus
 * the panel padding overflows to the right on narrow viewports.
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
    <div className="w-full max-w-full overflow-hidden">
      <SignIn
        routing="hash"
        fallbackRedirectUrl={nextPath}
        appearance={{
          variables: {
            colorPrimary: "#6f6146",
            colorBackground: "#fbf9f4",
            borderRadius: "0.125rem",
            fontFamily: "inherit",
            fontSize: "0.875rem",
          },
          elements: {
            rootBox: "w-full max-w-full",
            cardBox: "w-full max-w-full border-0 shadow-none",
            card: "w-full max-w-full border-0 bg-transparent p-0 shadow-none",
            header: "hidden",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton: "w-full",
            formButtonPrimary: "w-full",
            footer: "hidden",
            footerAction: "hidden",
            footerActionLink: "hidden",
          },
        }}
      />
    </div>
  );
}
