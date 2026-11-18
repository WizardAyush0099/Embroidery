import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk";
import { isAdminEmail } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
};

/** The signed-in Clerk user, mapped to the small shape the app needs. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isClerkConfigured) return null;
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null;
    return {
      id: userId,
      email: email?.toLowerCase() ?? null,
      name: user?.fullName ?? user?.firstName ?? null,
    };
  } catch (error) {
    console.error("getSessionUser failed", error);
    return null;
  }
}

/**
 * Authorised admins are either listed in ADMIN_EMAILS or in public.admin_users.
 * The table is read with the service-role client because the signed-in identity
 * now lives in Clerk, not in Postgres.
 */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user?.email) return null;

  if (isAdminEmail(user.email)) return user;

  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("admin_users").select("email").eq("email", user.email).maybeSingle();
    return data ? user : null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/unauthorized");
  return admin;
}

export async function requireAdminApi(): Promise<SessionUser | null> {
  return getAdminUser();
}
