"use client";

import { useRouter } from "next/navigation";

export function PendingGate({
  status,
  note,
}: {
  status: "PENDING" | "REJECTED" | "SUSPENDED" | "APPROVED";
  note: string | null;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/partner/logout", { method: "POST" });
    router.push("/p/login");
    router.refresh();
  }

  const messages = {
    PENDING: {
      title: "Awaiting approval",
      desc: "Our team is reviewing your application. You'll be able to book rides once approved.",
      color: "amber",
    },
    REJECTED: {
      title: "Application rejected",
      desc: "Your application was not approved. Please contact support.",
      color: "red",
    },
    SUSPENDED: {
      title: "Account suspended",
      desc: "Your partner account has been suspended. Please contact support.",
      color: "red",
    },
    APPROVED: { title: "", desc: "", color: "green" },
  } as const;

  const m = messages[status];
  const bg =
    m.color === "amber" ? "bg-amber-50" : m.color === "red" ? "bg-red-50" : "bg-green-50";
  const ring =
    m.color === "amber" ? "ring-amber-200" : m.color === "red" ? "ring-red-200" : "ring-green-200";
  const text =
    m.color === "amber" ? "text-amber-800" : m.color === "red" ? "text-red-800" : "text-green-800";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <div className={`mb-4 rounded-xl ${bg} p-4 ring-1 ${ring} ${text}`}>
          <h2 className="mb-1 text-base font-bold">{m.title}</h2>
          <p className="text-sm">{m.desc}</p>
          {note && (
            <p className="mt-3 text-xs italic">Admin note: &ldquo;{note}&rdquo;</p>
          )}
        </div>
        <button
          onClick={logout}
          className="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
