"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { validateUpload } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CustomRequestState = {
  status: "idle" | "success" | "error";
  message?: string;
  requestNumber?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REFERENCES = 4;

type UploadTarget = { name: string; type: string; size: number };

/**
 * Reference artwork is uploaded straight from the browser to the private bucket
 * using short-lived signed upload URLs, so large files never pass through a
 * server action (Vercel caps those request bodies at 4.5 MB).
 */
export async function createReferenceUploadUrls(
  files: UploadTarget[],
): Promise<{ ok: true; uploads: Array<{ path: string; token: string; name: string }> } | { ok: false; error: string }> {
  if (!Array.isArray(files) || files.length === 0) return { ok: false, error: "No files selected." };
  if (files.length > MAX_REFERENCES) return { ok: false, error: `Upload up to ${MAX_REFERENCES} files.` };

  try {
    const admin = createSupabaseAdminClient();
    const uploads: Array<{ path: string; token: string; name: string }> = [];
    const month = new Date().toISOString().slice(0, 7);

    for (const file of files) {
      const problem = validateUpload(file);
      if (problem) return { ok: false, error: problem };

      const extension = (file.type.split("/").pop() ?? "jpg").replace("jpeg", "jpg");
      const path = `requests/${month}/${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
      const { data, error } = await admin.storage.from("custom-references").createSignedUploadUrl(path);
      if (error || !data) return { ok: false, error: "Could not prepare the upload. Please try again." };
      uploads.push({ path, token: data.token, name: file.name });
    }

    return { ok: true, uploads };
  } catch (error) {
    console.error("createReferenceUploadUrls failed", error);
    return { ok: false, error: "Reference uploads are unavailable right now." };
  }
}

export async function submitCustomRequest(
  _prevState: CustomRequestState,
  formData: FormData,
): Promise<CustomRequestState> {
  const customerName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const garmentId = String(formData.get("garment_id") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const customText = String(formData.get("custom_text") ?? "").trim();
  const fontStyle = String(formData.get("font_style") ?? "").trim();
  const threadColor = String(formData.get("thread_color") ?? "").trim();
  const placement = String(formData.get("placement") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (customerName.length < 2) return { status: "error", message: "Please enter your full name." };
  if (!EMAIL_PATTERN.test(email)) return { status: "error", message: "Please enter a valid email address." };
  if (phone.replace(/\D/g, "").length < 7) {
    return { status: "error", message: "Please enter a phone number we can reach you on." };
  }
  if (!garmentId) return { status: "error", message: "Choose the garment you would like embroidered." };
  if (!size) return { status: "error", message: "Choose a size." };
  if (!placement) return { status: "error", message: "Choose an embroidery placement." };
  if (!customText && !description) {
    return {
      status: "error",
      message: "Add the text, motif or a description of the design you have in mind.",
    };
  }
  if (description.length > 4000 || customText.length > 120) {
    return { status: "error", message: "Your brief is too long — please shorten it." };
  }

  try {
    const admin = createSupabaseAdminClient();

    const { data: garment, error: garmentError } = await admin
      .from("products")
      .select("id, name, price, is_published")
      .eq("id", garmentId)
      .eq("is_published", true)
      .maybeSingle();

    if (garmentError || !garment) {
      return { status: "error", message: "That garment is no longer available. Please refresh the studio." };
    }

    const referenceImages: string[] = [];
    try {
      const parsed = JSON.parse(String(formData.get("reference_paths") ?? "[]"));
      if (Array.isArray(parsed)) {
        for (const entry of parsed.slice(0, MAX_REFERENCES)) {
          if (typeof entry === "string" && /^requests\/[0-9]{4}-[0-9]{2}\/[A-Za-z0-9._-]+$/.test(entry)) {
            referenceImages.push(entry);
          }
        }
      }
    } catch {
      // No uploaded references — the brief is text-only.
    }

    const { data, error } = await admin
      .from("custom_requests")
      .insert({
        user_id: null,
        customer_name: customerName,
        email,
        phone,
        garment_id: garment.id,
        garment_name: garment.name,
        size,
        color: color || null,
        custom_text: customText || null,
        font_style: fontStyle || null,
        thread_color: threadColor || null,
        placement,
        description: description || null,
        reference_images: referenceImages,
        status: "new",
      })
      .select("request_number")
      .single();

    if (error || !data) {
      console.error("custom request insert failed", error);
      return { status: "error", message: "We could not save your request. Please try again." };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/requests");

    return {
      status: "success",
      message: "Your commission brief has reached the atelier. A master karigar will respond with a quotation within 1–2 working days.",
      requestNumber: data.request_number,
    };
  } catch (error) {
    console.error("submitCustomRequest failed", error);
    return {
      status: "error",
      message: "We could not save your request. Please try again or write to the concierge.",
    };
  }
}
