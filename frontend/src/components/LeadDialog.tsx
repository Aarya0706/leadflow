"use client";

import { useDiscussions, useLead, useUpdateLeadStatus } from "@/hooks/useLeads";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";
import { DiscussionForm } from "./DiscussionForm";
import { DiscussionTimeline } from "./DiscussionTimeline";
import { CloseIcon, PhoneIcon } from "./icons";
import { Modal } from "./ui/Modal";

interface LeadDialogProps {
  leadId: number | null;
  now: Date;
  onClose: () => void;
}

export function LeadDialog({ leadId, now, onClose }: LeadDialogProps) {
  return (
    <Modal open={leadId !== null} onOpenChange={(open) => !open && onClose()} className="max-w-xl">
      {leadId !== null && <LeadDialogBody leadId={leadId} now={now} onClose={onClose} />}
    </Modal>
  );
}

function LeadDialogBody({ leadId, now, onClose }: { leadId: number; now: Date; onClose: () => void }) {
  const lead = useLead(leadId);
  const discussions = useDiscussions(leadId);
  const statusMutation = useUpdateLeadStatus(leadId);

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <Modal.Title className="truncate text-lg font-semibold">
            {lead.data?.name ?? "Lead"}
            {lead.data?.company && (
              <span className="ml-2 text-base font-normal text-ink-faint">{lead.data.company}</span>
            )}
          </Modal.Title>
          {lead.data?.phone && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
              <PhoneIcon width={14} height={14} />
              {lead.data.phone}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {lead.data && (
            <label>
              <span className="sr-only">Lead status</span>
              <select
                value={lead.data.status}
                disabled={statusMutation.isPending}
                onChange={(e) => statusMutation.mutate(e.target.value as LeadStatus)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-medium disabled:opacity-60"
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Modal.Close
            aria-label="Close"
            className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
          >
            <CloseIcon />
          </Modal.Close>
        </div>
      </header>

      {statusMutation.isError && (
        <p role="alert" className="border-b border-alert-edge bg-alert-tint px-5 py-2 text-sm text-alert">
          Couldn&rsquo;t update the status: {statusMutation.error.message}
        </p>
      )}

      <div className="min-h-[8rem] flex-1 overflow-y-auto px-5 py-4">
        {lead.isError ? (
          <p role="alert" className="text-sm text-alert">
            {lead.error.message}
          </p>
        ) : discussions.isPending ? (
          <p className="text-sm text-ink-faint">Loading discussions...</p>
        ) : discussions.isError ? (
          <div role="alert" className="text-sm text-alert">
            {discussions.error.message}{" "}
            <button type="button" onClick={() => discussions.refetch()} className="font-medium underline">
              Try again
            </button>
          </div>
        ) : (
          <DiscussionTimeline discussions={discussions.data} now={now} />
        )}
      </div>

      <DiscussionForm leadId={leadId} now={now} />
    </>
  );
}
