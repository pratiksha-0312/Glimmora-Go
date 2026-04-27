"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { SubscriptionForm } from "./SubscriptionForm";

type Driver = { id: string; name: string; phone: string };

export function NewSubscriptionButton({ drivers }: { drivers: Driver[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ActionButton
        variant="primary"
        icon={Plus}
        onClick={() => setOpen(true)}
      >
        New Subscription
      </ActionButton>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Grant subscription"
        description="Pick an approved driver and a plan duration"
        size="md"
      >
        <SubscriptionForm
          drivers={drivers}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
