"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { EditAdminModal, type EditableAdmin } from "./EditAdminModal";

export function AdminRowActions({ admin }: { admin: EditableAdmin }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function remove() {
    if (
      !confirm(
        `Delete ${admin.name} (${admin.email})? This cannot be undone.`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admins/${admin.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-medium text-slate-700 transition hover:bg-[#fbf7f2] disabled:opacity-50"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>

      <EditAdminModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        admin={admin}
      />
    </>
  );
}
