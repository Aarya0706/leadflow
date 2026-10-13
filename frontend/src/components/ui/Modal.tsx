"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Extra classes for the dialog panel (width, height). */
  className?: string;
  children: ReactNode;
}

/**
 * Accessible modal shell (focus trap, Esc to close, scroll lock) built on Radix.
 * Consumers render their own Modal.Title so each dialog can lay out its header.
 */
export function Modal({ open, onOpenChange, className = "", children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay fixed inset-0 z-40 bg-ink/45" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`modal-content fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-2xl ${className}`}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

Modal.Title = Dialog.Title;
Modal.Close = Dialog.Close;
