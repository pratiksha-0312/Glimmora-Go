import { put, del } from "@vercel/blob";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — fits Vercel serverless body limit

export type UploadResult = { url: string; contentType: string; size: number };

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return `Unsupported file type: ${file.type}. Allowed: PDF / JPG / PNG / WEBP`;
  }
  if (file.size > MAX_BYTES) {
    return `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max 4 MB.`;
  }
  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

/** Uploads a file and returns its public URL. Uses Vercel Blob when
 *  BLOB_READ_WRITE_TOKEN is set; otherwise writes to public/uploads for
 *  local development so the admin panel is usable without cloud setup. */
export async function uploadFile(
  file: File,
  folder: string
): Promise<UploadResult> {
  const safe = sanitizeFilename(file.name);
  const key = `${folder}/${Date.now()}-${safe}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, file, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url, contentType: file.type, size: file.size };
  }

  // Local dev fallback — write to public/uploads/<folder>/<file>
  const publicDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(publicDir, { recursive: true });
  const filename = `${Date.now()}-${safe}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(publicDir, filename), buf);
  return {
    url: `/uploads/${folder}/${filename}`,
    contentType: file.type,
    size: file.size,
  };
}

export async function deleteFile(url: string): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN && url.startsWith("http")) {
    try {
      await del(url);
    } catch {
      // ignore; file may not exist
    }
    return;
  }
  // Local dev — url is like /uploads/...
  if (url.startsWith("/uploads/")) {
    const fullPath = path.join(process.cwd(), "public", url);
    try {
      await unlink(fullPath);
    } catch {
      // ignore
    }
  }
}
