"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk";

export async function signOut() {
  if (isClerkConfigured) {
    try {
      const { sessionId } = await auth();
      if (sessionId) {
        const client = await clerkClient();
        await client.sessions.revokeSession(sessionId);
      }
    } catch (error) {
      console.error("signOut failed", error);
    }
  }
  redirect("/");
}
