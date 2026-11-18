"use client";

import { useActionState } from "react";
import { updateOrder, type AdminFormState } from "@/lib/actions/admin-orders";
import { orderStatusOptions, orderStatusLabels } from "@/lib/format";
import type { Order } from "@/lib/types";

const initialState: AdminFormState = { status: "idle" };
const paymentOptions: Order["payment_status"][] = ["pending", "paid", "failed", "refunded"];

export function OrderStatusForm({ order }: { order: Order }) {
  const [state, formAction, pending] = useActionState(updateOrder, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-space-sm">
      <input type="hidden" name="id" value={order.id} />

      <label>
        <span className="atelier-label">Order status</span>
        <select name="status" defaultValue={order.status} className="atelier-input">
          {orderStatusOptions.map((status) => (
            <option key={status} value={status}>
              {orderStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="atelier-label">Payment status</span>
        <select name="payment_status" defaultValue={order.payment_status} className="atelier-input">
          {paymentOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="atelier-label">Internal notes</span>
        <textarea name="admin_notes" rows={3} defaultValue={order.admin_notes ?? ""} className="atelier-input resize-y" placeholder="Silk tension, courier details, patron preferences…" />
      </label>

      {state.message && (
        <p className={`font-body-sm text-[12px] ${state.status === "error" ? "text-error" : "text-sage"}`}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Updating…" : "Update order"}
      </button>
    </form>
  );
}
