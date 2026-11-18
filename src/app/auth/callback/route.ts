import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/account";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(new URL("/login?error=unconfigured", url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing-code", url.origin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth callback failed", error.message);
      return NextResponse.redirect(new URL("/login?error=callback", url.origin));
    }
    return NextResponse.redirect(new URL(next, url.origin));
  } catch (error) {
    console.error("auth callback exception", error);
    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }
}
