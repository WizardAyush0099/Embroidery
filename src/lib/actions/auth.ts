"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOut() {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("signOut failed", error);
    }
  }
  redirect("/");
}
