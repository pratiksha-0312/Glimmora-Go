"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/kirana/logout", { method: "POST" });
    router.push("/k/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="w-full rounded-xl bg-white py-3 text-sm font-medium text-red-600 shadow-sm ring-1 ring-slate-200 hover:bg-red-50"
    >
      Sign out
    </button>
  );
}
