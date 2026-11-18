"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm({ configured, nextPath = "/account" }: { configured: boolean; nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<"google" | "email" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);
    setMessage(null);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase is not connected yet, so sign-in is unavailable.");
      return;
    }
    setPending("google");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setPending(null);
    }
  }

  async function signInWithEmail(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase is not connected yet, so sign-in is unavailable.");
      return;
    }
    setPending("email");
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    setPending(null);
    if (otpError) setError(otpError.message);
    else setMessage("Check your inbox — your secure sign-in link is on its way.");
  }

  return (
    <div className="flex flex-col gap-space-md">
      {!configured && (
        <p className="border border-[#ddcfae] bg-[#f3ecdd] px-3 py-2 font-body-sm text-body-sm text-[#7a5a1e]">
          Supabase environment variables are missing. Add them to enable sign-in.
        </p>
      )}

      <button type="button" onClick={signInWithGoogle} disabled={pending !== null} className="btn-primary w-full py-3.5">
        <span className="material-symbols-outlined text-[18px]">account_circle</span>
        {pending === "google" ? "Connecting to Google…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-outline-variant/70" />
        <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">or email link</span>
        <span className="h-px flex-1 bg-outline-variant/70" />
      </div>

      <form onSubmit={signInWithEmail} className="flex flex-col gap-space-sm">
        <label>
          <span className="atelier-label">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="atelier-input"
            autoComplete="email"
          />
        </label>
        <button type="submit" disabled={pending !== null} className="btn-secondary w-full py-3">
          {pending === "email" ? "Sending link…" : "Email me a sign-in link"}
        </button>
      </form>

      {message && <p className="font-body-sm text-body-sm text-sage">{message}</p>}
      {error && <p role="alert" className="font-body-sm text-body-sm text-error">{error}</p>}

      <p className="font-body-sm text-[11px] leading-relaxed text-flax-grey">
        Signing in lets you follow commissions, review proofs and see order history. We never post to your
        account or share your address.
      </p>
    </div>
  );
}
