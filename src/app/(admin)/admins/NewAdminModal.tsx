"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ROLE_LABELS } from "@/lib/rbac";
import type { AdminRole } from "../../../../generated/prisma";

const SELECTABLE_ROLES: AdminRole[] = [
  "SUPER_ADMIN",
  "OPERATIONS_MANAGER",
  "FINANCE_ADMIN",
  "SUPPORT_AGENT",
  "PARTNER_MANAGER",
];

export function NewAdminModal({
  open,
  onClose,
  nextUserId,
}: {
  open: boolean;
  onClose: () => void;
  nextUserId: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [role, setRole] = useState<AdminRole>("OPERATIONS_MANAGER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-derive Full Name from First + Last unless the user has typed in it.
  useEffect(() => {
    if (fullNameTouched) return;
    const next = [firstName, lastName].filter(Boolean).join(" ").trim();
    setFullName(next);
  }, [firstName, lastName, fullNameTouched]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setFullName("");
    setFullNameTouched(false);
    setRole("OPERATIONS_MANAGER");
    setError(null);
    setBusy(false);
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username: username || undefined,
          name: fullName.trim(),
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          password,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[#e8d9ce] bg-white px-3 py-2 text-sm text-[#3a2d28] placeholder:text-[#b9a496] outline-none transition focus:border-[#a57865] focus:ring-2 focus:ring-[#a57865]/20";
  const sectionTitle =
    "mb-3 text-sm font-semibold text-[#3a2d28]";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-10">
      <div className="w-full max-w-2xl rounded-xl border border-[#f0e4d6] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#f0e4d6] px-6 py-4">
          <h2 className="text-base font-semibold text-[#3a2d28]">New Admin</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-[#6b5349] hover:bg-[#fbf5ef]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-6 px-6 py-5">
          <section>
            <h3 className={sectionTitle}>Account Credentials</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3a2d28]">
                  User ID{" "}
                  <span className="text-[10px] font-normal text-[#a89485]">
                    (Auto-generated)
                  </span>
                </label>
                <input
                  value={nextUserId}
                  disabled
                  className={inputCls + " bg-[#fbf5ef] text-[#a89485]"}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3a2d28]">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-[#3a2d28]">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className={inputCls}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3a2d28]">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3a2d28]">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className={sectionTitle}>Personal Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3a2d28]">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3a2d28]">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-[#3a2d28]">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => {
                  setFullNameTouched(true);
                  setFullName(e.target.value);
                }}
                placeholder="Enter full name"
                className={inputCls}
              />
            </div>
          </section>

          <section>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#3a2d28]">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
                className={inputCls}
              >
                {SELECTABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#f0e4d6] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-[#d5bfb2] bg-white px-4 py-2 text-sm font-medium text-[#3a2d28] hover:bg-[#fbf5ef]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#a57865] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8e6553] disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
