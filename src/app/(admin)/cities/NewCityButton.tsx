"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { CityForm } from "./CityForm";

export function NewCityButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ActionButton
        variant="primary"
        icon={Plus}
        onClick={() => setOpen(true)}
      >
        New City
      </ActionButton>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add city"
        description="Pick the archetype to seed default fares and matching rules"
        size="md"
      >
        <CityForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
