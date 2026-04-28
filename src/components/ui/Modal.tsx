"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ background: "rgba(58, 45, 40, 0.32)" }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "max-h-[90vh] w-full overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-[color:var(--brand-sand-border)]",
          SIZE_CLASS[size]
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-[color:var(--brand-text)]">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-[color:var(--brand-cream)] px-6 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalCancelButton({
  onClick,
  children = "Cancel",
  disabled,
}: {
  onClick: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function ModalPrimaryButton({
  type = "button",
  onClick,
  children,
  disabled,
}: {
  type?: "button" | "submit";
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-600)] disabled:opacity-60"
    >
      {children}
    </button>
  );
}
