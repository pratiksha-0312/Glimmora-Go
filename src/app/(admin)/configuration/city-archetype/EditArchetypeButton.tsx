"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ArchetypeForm, type ArchetypeDefaults } from "./ArchetypeForm";

const LABEL: Record<ArchetypeDefaults["archetype"], string> = {
  METRO: "Metro",
  SMALL_TOWN: "Small Town",
};

export function EditArchetypeButton({
  defaults,
  disabled,
}: {
  defaults: ArchetypeDefaults;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Edit ${LABEL[defaults.archetype]} archetype`}
        description="Defaults applied to new cities created in this archetype"
        size="lg"
      >
        <ArchetypeForm
          defaults={defaults}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
