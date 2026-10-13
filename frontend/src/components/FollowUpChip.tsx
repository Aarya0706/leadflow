import { classifyFollowUp } from "@/lib/followups";
import { formatDateTime, formatTime } from "@/lib/time";
import { BellIcon } from "./icons";

const STYLES = {
  today: "bg-brand-tint text-brand-dark",
  overdue: "bg-alert-tint text-alert",
  upcoming: "bg-paper text-ink-soft",
} as const;

/** Follow-up pill for list rows. Red = overdue, blue = due today, grey = upcoming. */
export function FollowUpChip({ iso, now }: { iso: string; now: Date }) {
  const info = classifyFollowUp(iso, now);
  if (!info) return null;

  let label: string;
  if (info.state === "overdue") label = `Overdue: ${formatDateTime(iso, now)}`;
  else if (info.state === "today") {
    label = info.passed
      ? `Follow-up was due today at ${formatTime(iso)}`
      : `Follow-up today at ${formatTime(iso)}`;
  } else label = `Follow-up ${formatDateTime(iso, now)}`;

  // Today's follow-up whose time has passed is just as urgent as an overdue one.
  const style = info.state === "today" && info.passed ? STYLES.overdue : STYLES[info.state];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${style}`}>
      <BellIcon width={13} height={13} />
      {label}
    </span>
  );
}
