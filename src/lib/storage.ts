import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
]);

export type BucketName = "product-images" | "custom-references";

export function validateUpload(file: { name: string; type: string; size: number }) {
  if (file.size === 0) return "One of the files is empty.";
  if (file.size > MAX_BYTES) return `${file.name} is larger than 8 MB.`;
  if (!ALLOWED_TYPES.has(file.type)) return `${file.name} must be a JPG, PNG, WEBP, AVIF or PDF file.`;
  return null;
}

export async function createSignedUrl(bucket: BucketName, path: string, expiresIn = 3600) {
  if (!path || path.startsWith("http")) return path;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

export async function signedUrlsFor(paths: string[], expiresIn = 3600) {
  return Promise.all(paths.map((path) => createSignedUrl("custom-references", path, expiresIn)));
}
