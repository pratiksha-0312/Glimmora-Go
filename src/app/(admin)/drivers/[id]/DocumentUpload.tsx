"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocumentType } from "../../../../../generated/prisma";

const TYPES: { value: DocumentType; label: string }[] = [
  { value: "LICENSE", label: "Driving License" },
  { value: "RC", label: "Registration Certificate" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "AADHAAR", label: "Aadhaar" },
  { value: "PAN", label: "PAN Card" },
];

export function DocumentUpload({ driverId }: { driverId: string }) {
  const router = useRouter();
  const [type, setType] = useState<DocumentType>("LICENSE");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Pick a file first");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("driverId", driverId);
      form.append("type", type);
      const res = await fetch("/api/uploads/driver-doc", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3"
    >
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DocumentType)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-500"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="flex-1 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-700"
        />
        <button
          type="submit"
          disabled={uploading || !file}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="text-[10px] text-slate-400">
        PDF / JPG / PNG / WEBP, max 4 MB
      </div>
    </form>
  );
}
