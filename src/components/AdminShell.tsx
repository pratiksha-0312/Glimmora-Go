"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import type { AdminRole } from "../../generated/prisma";

export function AdminShell({
  name,
  role,
  children,
}: {
  name: string;
  role: AdminRole;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0d1117]">
      <Sidebar
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        <Header name={name} role={role} />
        <main className="flex-1 overflow-y-auto p-6 dark:bg-[#0d1117] dark:text-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
