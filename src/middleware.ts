import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk owns the session cookie, so the middleware only has to keep it fresh.
 * Admin authorisation is enforced in the server components (requireAdmin) and
 * by Postgres RLS, never by the matcher alone.
 */
const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default clerkConfigured
  ? clerkMiddleware()
  : function passthrough() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    /*
     * Refresh sessions for pages and server actions, skipping static assets
     * and optimised images so the storefront stays fast.
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
