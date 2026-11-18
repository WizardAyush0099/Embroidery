import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail, isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Authorised admins are either listed in ADMIN_EMAILS or in public.admin_users.
 * Both layers are checked; RLS enforces the database list for every write.
 */
export async function getAdminUser(): Promise<User | null> {
  const user = await getSessionUser();
  if (!user?.email) return null;

  if (isAdminEmail(user.email)) return user;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("admin_users")
      .select("email")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    return data ? user : null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/unauthorized");
  return admin;
}

export async function requireAdminApi(): Promise<User | null> {
  return getAdminUser();
}
