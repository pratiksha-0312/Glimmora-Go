"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Doc = {
  id: string;
  type: string;
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  uploadedAt: Date | string;
};

const TYPES = [
  { value: "SHOP_LICENSE", label: "Shop license / trade license" },
  { value: "AADHAAR", label: "Aadhaar" },
  { value: "PAN", label: "PAN card" },
  { value: "PHOTO", label: "Shop photo" },
  { value: "OTHER", label: "Other" },
];

function statusPill(status: Doc["status"]) {
  if (status === "APPROVED")
    return "bg-green-100 text-green-700 ring-green-200";
  if (status === "REJECTED") return "bg-red-100 text-red-700 ring-red-200";
  return "bg-amber-100 text-amber-700 ring-amber-200";
}

export function Documents({ docs }: { docs: Doc[] }) {
  const router = useRouter();
  const [type, setType] = useState(TYPES[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(e: React.FormEvent) {
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
      form.append("type", type);
      const res = await fetch("/api/kirana/documents", {
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

  async function remove(docId: string) {
    if (!confirm("Remove this document?")) return;
    const res = await fetch(`/api/kirana/documents/${docId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Delete failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            KYC documents
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Upload your shop license, Aadhaar, and PAN so we can verify your shop.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {docs.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-400">
              No documents uploaded yet
            </div>
          ) : (
            docs.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    {TYPES.find((t) => t.value === d.type)?.label ?? d.type}
                  </div>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    View file →
                  </a>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${statusPill(
                      d.status
                    )}`}
                  >
                    {d.status}
                  </span>
                  {d.status !== "APPROVED" && (
                    <button
                      onClick={() => remove(d.id)}
                      className="text-[11px] text-slate-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <form
        onSubmit={upload}
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      >
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Upload a document
        </div>
        <div className="space-y-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
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
            className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-700"
          />
          {error && (
            <div className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}
          <div className="text-[10px] text-slate-400">
            PDF / JPG / PNG / WEBP, max 4 MB
          </div>
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </form>
    </div>
  );
}
