import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 10;

/** Only these image types are accepted, and the extension is derived from the MIME type. */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Admin photography upload.
 *
 * Identity is Clerk's, so Supabase storage cannot authorise the browser
 * directly (`public.is_admin()` reads auth.uid() and can never match). The
 * server verifies the Clerk admin session and writes with the service role.
 */
export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Only atelier admins can upload photography." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "The upload could not be read. Please try again." }, { status: 400 });
  }

  const files = form
    .getAll("files")
    .filter((entry): entry is File => typeof entry !== "string" && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Choose at least one photograph to upload." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Upload up to ${MAX_FILES} photographs at a time.` }, { status: 400 });
  }

  let storage;
  try {
    storage = createSupabaseAdminClient().storage.from("product-images");
  } catch (error) {
    console.error("upload route: supabase unavailable", error);
    return NextResponse.json({ error: "Image storage is not configured." }, { status: 500 });
  }

  const urls: string[] = [];
  const failures: string[] = [];
  const month = new Date().toISOString().slice(0, 7);

  for (const file of files) {
    const extension = EXTENSIONS[file.type];
    if (!extension) {
      failures.push(`${file.name} must be a JPG, PNG, WEBP or AVIF image.`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      failures.push(`${file.name} is larger than 8 MB.`);
      continue;
    }

    const path = `products/${month}/${randomUUID()}.${extension}`;
    const { error } = await storage.upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      console.error("product image upload failed", error);
      failures.push(`${file.name} could not be uploaded.`);
      continue;
    }

    const { data } = storage.getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  if (urls.length === 0) {
    return NextResponse.json(
      { error: failures[0] ?? "The upload failed. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ urls, failures });
}
