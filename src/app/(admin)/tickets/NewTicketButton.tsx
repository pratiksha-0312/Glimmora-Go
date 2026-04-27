"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { TicketForm } from "./TicketForm";

export function NewTicketButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ActionButton
        variant="primary"
        icon={Plus}
        onClick={() => setOpen(true)}
      >
        New Ticket
      </ActionButton>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New ticket"
        description="Log a rider, driver or platform issue"
        size="lg"
      >
        <TicketForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
