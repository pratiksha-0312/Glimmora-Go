"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/p/" })
      .catch((err) => {
        // Silent fail — PWA is an enhancement, not a requirement.
        console.warn("SW registration failed", err);
      });
  }, []);
  return null;
}
