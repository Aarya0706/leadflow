import { STATUS_STYLES } from "@/lib/status";
import type { LeadStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
