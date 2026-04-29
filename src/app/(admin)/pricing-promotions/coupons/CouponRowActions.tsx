"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, MoreVertical, Trash2 } from "lucide-react";

export function CouponRowActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
    setLoading(false);
  }

  async function remove() {
    setMenuOpen(false);
    if (!confirm("Delete this coupon?")) return;
    setLoading(true);
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      {/* Toggle switch */}
      <button
        onClick={toggle}
        disabled={loading}
        title={active ? "Disable coupon" : "Enable coupon"}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          active ? "bg-orange-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            active ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>

      {/* Edit (visual only) */}
      <button
        title="Edit coupon"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      {/* More menu */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((p) => !p)}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-30 min-w-[130px] rounded-xl border border-slate-100 bg-white py-1 shadow-xl">
            <button
              onClick={remove}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete coupon
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
