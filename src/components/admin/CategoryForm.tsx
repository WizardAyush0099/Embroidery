"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCategory, type CategoryFormState } from "@/lib/actions/admin-categories";
import type { Category } from "@/lib/types";

const initialState: CategoryFormState = { status: "idle" };

export function CategoryForm({ category }: { category?: Category }) {
  const [state, formAction, pending] = useActionState(saveCategory, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-space-sm">
      {category && <input type="hidden" name="id" value={category.id} />}

      <label>
        <span className="atelier-label">Collection name</span>
        <input name="name" required defaultValue={category?.name} className="atelier-input" placeholder="Heavyweight Hoodies" />
      </label>

      <label>
        <span className="atelier-label">URL slug (optional)</span>
        <input name="slug" defaultValue={category?.slug} className="atelier-input" placeholder="heavyweight-hoodies" />
      </label>

      <label>
        <span className="atelier-label">Short description</span>
        <textarea name="description" rows={2} defaultValue={category?.description ?? ""} className="atelier-input resize-y" placeholder="450–500 GSM fleece engineered for high-density needlework" />
      </label>

      <label>
        <span className="atelier-label">Sort order</span>
        <input name="sort_order" type="number" defaultValue={category?.sort_order ?? 0} className="atelier-input" />
      </label>

      {state.message && (
        <p className={`font-body-sm text-[12px] ${state.status === "error" ? "text-error" : "text-sage"}`}>
          {state.message}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {pending ? "Saving…" : category ? "Save collection" : "Create collection"}
        </button>
        {category && (
          <Link href="/admin/categories" className="btn-secondary">
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
