"use client";

import { useActionState } from "react";
import { subscribeToGazette, type NewsletterState } from "@/lib/actions/newsletter";

const initialState: NewsletterState = { status: "idle" };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToGazette, initialState);

  return (
    <div>
      <form action={formAction} className="flex">
        <input
          type="email"
          name="email"
          required
          placeholder="Enter your correspondence email"
          aria-label="Email address"
          className="w-full border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-sm text-body-sm outline-none placeholder:text-outline focus:border-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 bg-primary px-5 py-2.5 font-label-md text-label-md uppercase tracking-widest text-on-primary transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {pending ? "…" : "Join"}
        </button>
      </form>
      <p
        className={`mt-2 font-body-sm text-[12px] ${
          state.status === "error" ? "text-error" : "text-flax-grey"
        }`}
        role="status"
      >
        {state.message ??
          "Discreetly dispatched once fortnightly. Unsubscribe at discretion."}
      </p>
    </div>
  );
}
