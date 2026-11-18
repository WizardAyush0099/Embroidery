"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsFormState } from "@/lib/actions/admin-settings";
import type { StoreSettings } from "@/lib/types";

const initialState: SettingsFormState = { status: "idle" };

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-space-md">
      <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
        <h2 className="mb-space-sm font-headline-sm text-headline-sm">Atelier identity</h2>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          <label>
            <span className="atelier-label">Brand name</span>
            <input name="brand_name" required defaultValue={settings.brand_name} className="atelier-input" />
          </label>
          <label>
            <span className="atelier-label">Instagram handle</span>
            <input name="instagram" defaultValue={settings.instagram ?? ""} className="atelier-input" placeholder="@atelierbrode" />
          </label>
          <label>
            <span className="atelier-label">Concierge email</span>
            <input name="contact_email" type="email" required defaultValue={settings.contact_email} className="atelier-input" />
          </label>
          <label>
            <span className="atelier-label">Concierge phone</span>
            <input name="contact_phone" required defaultValue={settings.contact_phone} className="atelier-input" />
          </label>
          <label className="sm:col-span-2">
            <span className="atelier-label">Atelier & showroom address</span>
            <input name="address" defaultValue={settings.address} className="atelier-input" />
          </label>
          <label className="sm:col-span-2">
            <span className="atelier-label">Announcement bar</span>
            <input name="announcement" defaultValue={settings.announcement ?? ""} className="atelier-input" />
          </label>
        </div>
      </section>

      <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
        <h2 className="mb-space-sm font-headline-sm text-headline-sm">Delivery & payment</h2>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          <label>
            <span className="atelier-label">White-glove delivery fee (₹)</span>
            <input name="shipping_fee" type="number" min={0} step={50} defaultValue={settings.shipping_fee} className="atelier-input" />
          </label>
          <label>
            <span className="atelier-label">Complimentary delivery above (₹)</span>
            <input name="free_shipping_threshold" type="number" min={0} step={500} defaultValue={settings.free_shipping_threshold} className="atelier-input" />
          </label>
        </div>
        <label className="mt-space-sm flex cursor-pointer items-center gap-2 font-body-sm text-[12px]">
          <input type="checkbox" name="cod_enabled" defaultChecked={settings.cod_enabled} className="h-3.5 w-3.5 accent-secondary" />
          Offer pay-on-delivery at checkout
        </label>
        <p className="mt-2 font-body-sm text-[11px] text-outline">
          Razorpay keys are held as server secrets (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) and are never stored
          in the database or exposed to the browser.
        </p>
      </section>

      {state.message && (
        <p className={`border px-3 py-2 font-body-sm text-[12px] ${
          state.status === "error"
            ? "border-error/30 bg-error-container text-on-error-container"
            : "border-[#c5d8bf] bg-[#e7efe4] text-[#3d5a38]"
        }`}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Saving…" : "Save store settings"}
      </button>
    </form>
  );
}
