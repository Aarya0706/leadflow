import { isClosed } from "@/lib/status";
import { timeAgo } from "@/lib/time";
import type { Lead } from "@/lib/types";
import { FollowUpChip } from "./FollowUpChip";
import { StatusBadge } from "./StatusBadge";

interface LeadCardProps {
  lead: Lead;
  now: Date;
  /** Highlights the card as one of today's pinned follow-ups. */
  pinned?: boolean;
  onSelect: (id: number) => void;
}

export function LeadCard({ lead, now, pinned = false, onSelect }: LeadCardProps) {
  const closed = isClosed(lead.status);
  const surface = pinned
    ? "border-brand-edge bg-brand-tint/60 shadow-sm"
    : "border-line bg-white hover:border-ink-faint/60";

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(lead.id)}
        className={`block w-full rounded-lg border px-4 py-3 text-left transition-colors ${surface} ${
          closed ? "opacity-70" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="font-semibold">{lead.name}</span>
            {lead.company && <span className="ml-2 text-sm text-ink-faint">{lead.company}</span>}
          </div>
          <StatusBadge status={lead.status} />
        </div>

        <div className="mt-1.5 flex items-baseline justify-between gap-3 text-sm">
          <p className="min-w-0 truncate text-ink-soft">
            <span className="text-ink-faint">Last note: </span>
            {lead.last_note ?? "No discussions yet"}
          </p>
          {lead.last_discussion_at && (
            <span className="shrink-0 text-xs text-ink-faint">{timeAgo(lead.last_discussion_at, now)}</span>
          )}
        </div>

        {lead.follow_up_at && (
          <div className="mt-2">
            <FollowUpChip iso={lead.follow_up_at} now={now} />
          </div>
        )}
      </button>
    </li>
  );
}
