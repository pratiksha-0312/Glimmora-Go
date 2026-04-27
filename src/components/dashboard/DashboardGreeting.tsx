"use client";

import { useMemo } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function DashboardGreeting({ name }: { name: string }) {
  const greeting  = useMemo(getGreeting, []);
  const firstName = name.split(" ")[0];

  return (
    <div className="mb-6">
      <h1 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
        {greeting},{" "}
        <span className="text-brand-600 dark:text-brand-400">{firstName}.</span>
      </h1>
    </div>
  );
}
