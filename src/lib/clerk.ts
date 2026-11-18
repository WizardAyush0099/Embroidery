/**
 * Clerk is considered configured once the publishable key (browser) and the
 * secret key (server) exist. Without them the storefront still runs, but the
 * sign-in surfaces render a setup notice instead of the Clerk components.
 */
export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";

export const isClerkConfigured = Boolean(clerkPublishableKey && process.env.CLERK_SECRET_KEY?.trim());
