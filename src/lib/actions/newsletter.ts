"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function subscribeToGazette(
  _prevState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("newsletter_subscribers")
      .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });

    if (error) throw error;

    return { status: "success", message: "You are on the list. The Gazette is dispatched once a fortnight." };
  } catch (error) {
    console.error("newsletter subscribe failed", error);
    return { status: "error", message: "Subscription failed. Please try again." };
  }
}
