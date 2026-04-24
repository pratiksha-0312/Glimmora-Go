"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "glimmora_pwa_install_dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      if (localStorage.getItem(DISMISS_KEY)) return;
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !evt) return null;

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-20 rounded-xl border border-brand-200 bg-white p-3 shadow-lg sm:left-auto sm:right-4 sm:w-80">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-black text-white">
          GG
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">
            Install Glimmora Kirana
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            Add to home screen for quick bookings without opening a browser.
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={install}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              Install
            </button>
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
