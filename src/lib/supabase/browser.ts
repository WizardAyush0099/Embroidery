"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/config";

let browserClient: SupabaseClient | null = null;

/**
 * Supabase is the database and storage layer, not the identity provider, so the
 * browser client stays anonymous: it only signs upload URLs and reads public
 * catalogue data. Auth is handled by Clerk.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}
