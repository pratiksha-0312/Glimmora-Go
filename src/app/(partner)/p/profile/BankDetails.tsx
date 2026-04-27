"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

type Bank = {
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankName: string | null;
};

export function BankDetails({ initial }: { initial: Bank }) {
  const router = useRouter();
  const hasAny =
    initial.bankAccountName ||
    initial.bankAccountNumber ||
    initial.bankIfsc ||
    initial.bankName;
  const [editing, setEditing] = useState(!hasAny);
  const [accountName, setAccountName] = useState(initial.bankAccountName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    initial.bankAccountNumber ?? ""
  );
  const [ifsc, setIfsc] = useState(initial.bankIfsc ?? "");
  const [bankName, setBankName] = useState(initial.bankName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/partner/profile/bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountName: accountName,
          bankAccountNumber: accountNumber,
          bankIfsc: ifsc,
          bankName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function maskAccount(num: string): string {
    if (num.length <= 4) return num;
    return `••${num.slice(-4)}`;
  }

  if (!editing) {
    return (
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Bank details</h3>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
        <div className="px-4 py-3">
          <Row label="Account holder">{initial.bankAccountName ?? "—"}</Row>
          <Row label="Bank">{initial.bankName ?? "—"}</Row>
          <Row label="Account #">
            {initial.bankAccountNumber
              ? maskAccount(initial.bankAccountNumber)
              : "—"}
          </Row>
          <Row label="IFSC">{initial.bankIfsc ?? "—"}</Row>
        </div>
        <p className="px-4 pb-3 text-[11px] text-slate-400">
          Payouts will be sent to this account.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={save}
      className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Bank details</h3>
      </div>
      <div className="space-y-3 px-4 py-3">
        <Field
          label="Account holder name"
          value={accountName}
          onChange={setAccountName}
          placeholder="As per bank records"
          required
        />
        <Field
          label="Bank name"
          value={bankName}
          onChange={setBankName}
          placeholder="e.g. HDFC Bank"
          required
        />
        <Field
          label="Account number"
          value={accountNumber}
          onChange={(v) => setAccountNumber(v.replace(/\D/g, ""))}
          inputMode="numeric"
          required
        />
        <Field
          label="IFSC"
          value={ifsc}
          onChange={(v) => setIfsc(v.toUpperCase())}
          placeholder="e.g. HDFC0001234"
          required
        />
        {error && (
          <div className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          {hasAny && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-[2] rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900">{children}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
    </label>
  );
}
