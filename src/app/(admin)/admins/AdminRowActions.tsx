"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminRowActions({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
    setLoading(false);
  }

  async function remove() {
    if (!confirm("Delete this admin? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/admins/${id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex justify-end gap-3 text-xs font-medium">
      <button
        onClick={toggle}
        disabled={loading}
        className="text-slate-600 hover:text-slate-900 disabled:opacity-50"
      >
        {active ? "Disable" : "Enable"}
      </button>
      <button
        onClick={remove}
        disabled={loading}
        className="text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
