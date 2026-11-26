import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store" };

/**
 * Tells the storefront profile menu whether the signed-in patron also has the
 * operations portal. Called lazily when the menu opens so ordinary page views
 * never pay for the lookup.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ signedIn: false, isAdmin: false }, { headers: privateHeaders });
  }

  let isAdmin = isAdminEmail(user.email);
  if (!isAdmin) {
    try {
      const admin = createSupabaseAdminClient();
      const { data } = await admin.from("admin_users").select("email").eq("email", user.email).maybeSingle();
      isAdmin = Boolean(data);
    } catch {
      isAdmin = false;
    }
  }

  return NextResponse.json({ signedIn: true, isAdmin }, { headers: privateHeaders });
}
