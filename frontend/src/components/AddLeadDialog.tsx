"use client";

import { useState, type FormEvent } from "react";
import { useCreateLead } from "@/hooks/useLeads";
import { CloseIcon } from "./icons";
import { Modal } from "./ui/Modal";

interface AddLeadDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddLeadDialog({ open, onClose }: AddLeadDialogProps) {
  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()} className="max-w-md">
      {/* Mounted only while open, so the form resets every time. */}
      {open && <AddLeadForm onClose={onClose} />}
    </Modal>
  );
}

const inputClass = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm placeholder:text-ink-faint";

function AddLeadForm({ onClose }: { onClose: () => void }) {
  const mutation = useCreateLead();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!name.trim()) {
      setNameError("Enter the lead's name.");
      return;
    }
    mutation.mutate(
      { name: name.trim(), company: company.trim() || undefined, phone: phone.trim() || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <Modal.Title className="text-lg font-semibold">Add new lead</Modal.Title>
        <Modal.Close
          aria-label="Close"
          className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
        >
          <CloseIcon />
        </Modal.Close>
      </header>

      <div className="space-y-4 px-5 py-4">
        <label className="block text-sm font-medium">
          Full name <span className="text-alert">*</span>
          <input
            autoFocus
            value={name}
            maxLength={120}
            aria-invalid={nameError !== null}
            aria-describedby={nameError ? "name-error" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            placeholder="e.g., John Doe"
            className={`${inputClass} ${nameError ? "border-alert" : ""}`}
          />
          {nameError && (
            <span id="name-error" className="mt-1 block text-xs font-normal text-alert">
              {nameError}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium">
          Company <span className="font-normal text-ink-faint">(optional)</span>
          <input
            value={company}
            maxLength={120}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Stark Industries"
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-medium">
          Phone <span className="font-normal text-ink-faint">(optional)</span>
          <input
            type="tel"
            value={phone}
            maxLength={30}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., 555-0123"
            className={inputClass}
          />
        </label>

        {mutation.isError && (
          <p role="alert" className="text-sm text-alert">
            {mutation.error.message}
          </p>
        )}
      </div>

      <footer className="flex justify-end gap-2 border-t border-line bg-paper/60 px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:bg-line/60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {mutation.isPending ? "Saving..." : "Save lead"}
        </button>
      </footer>
    </form>
  );
}
