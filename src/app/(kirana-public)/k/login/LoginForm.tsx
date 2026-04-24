"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/kirana/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.devCode) setDevCode(data.devCode);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/kirana/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/k");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (step === "phone") {
    return (
      <form
        onSubmit={request}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Phone (10 digits)
          </label>
          <input
            required
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="9876500000"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={verify}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
    >
      {devCode && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          Dev mode — your OTP is <b className="font-mono">{devCode}</b>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          6-digit OTP sent to {phone}
        </label>
        <input
          required
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Verifying..." : "Sign in"}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setCode("");
          setDevCode(null);
          setError(null);
        }}
        className="w-full text-xs text-slate-500 hover:text-slate-700"
      >
        ← Use a different number
      </button>
    </form>
  );
}
