"use client";

import { useActionState } from "react";
import { updateCustomRequest } from "@/lib/actions/admin-requests";
import type { AdminFormState } from "@/lib/actions/admin-orders";
import { formatINR, requestStatusLabels, requestStatusOptions } from "@/lib/format";
import type { CustomRequest } from "@/lib/types";

const initialState: AdminFormState = { status: "idle" };

export function RequestReviewForm({ request }: { request: CustomRequest }) {
  const [state, formAction, pending] = useActionState(updateCustomRequest, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-space-sm">
      <input type="hidden" name="id" value={request.id} />

      <label>
        <span className="atelier-label">Commission status</span>
        <select name="status" defaultValue={request.status} className="atelier-input">
          {requestStatusOptions.map((status) => (
            <option key={status} value={status}>
              {requestStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="atelier-label">Quotation amount (₹)</span>
        <input
          type="number"
          name="quote_amount"
          min={0}
          step={100}
          defaultValue={request.quote_amount ?? ""}
          placeholder="e.g. 4500"
          className="atelier-input"
        />
        {request.quote_amount != null && (
          <span className="mt-1 block font-body-sm text-[11px] text-outline">
            Current quotation {formatINR(request.quote_amount)}
          </span>
        )}
      </label>

      <label>
        <span className="atelier-label">Notes to the atelier</span>
        <textarea
          name="admin_notes"
          rows={4}
          defaultValue={request.admin_notes ?? ""}
          className="atelier-input resize-y"
          placeholder="Digitising notes, thread substitutions, proof sent on…"
        />
      </label>

      {state.message && (
        <p className={`font-body-sm text-[12px] ${state.status === "error" ? "text-error" : "text-sage"}`}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saving…" : "Save commission"}
      </button>
      <p className="text-center font-label-sm text-[8px] uppercase tracking-wider text-outline">
        The patron sees the new status in their account
      </p>
    </form>
  );
}
