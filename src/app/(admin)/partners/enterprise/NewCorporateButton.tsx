"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { CorporateForm } from "./CorporateForm";

type City = { id: string; name: string };

export function NewCorporateButton({ cities }: { cities: City[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ActionButton
        variant="primary"
        icon={Plus}
        onClick={() => setOpen(true)}
      >
        New Account
      </ActionButton>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New corporate account"
        description="Wallet-funded enterprise rider account"
        size="md"
      >
        <CorporateForm cities={cities} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
