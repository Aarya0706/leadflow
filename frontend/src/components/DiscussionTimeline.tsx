import { formatDateTime, timeAgo } from "@/lib/time";
import type { Discussion } from "@/lib/types";
import { BellIcon } from "./icons";

interface DiscussionTimelineProps {
  discussions: Discussion[];
  now: Date;
}

/** Reverse-chronological history. The API already returns newest first. */
export function DiscussionTimeline({ discussions, now }: DiscussionTimelineProps) {
  return (
    <ol className="relative ml-2 border-l border-line">
      {discussions.map((item, index) => (
        <li key={item.id} className="relative pb-5 pl-5 last:pb-0">
          <span
            aria-hidden
            className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
              index === 0 ? "bg-brand" : "bg-ink-faint/60"
            }`}
          />
          <p className="text-xs text-ink-faint">
            {formatDateTime(item.created_at, now)}{" "}
            <span>({timeAgo(item.created_at, now)})</span>
          </p>
          <div className="mt-1 rounded-lg border border-line bg-paper/60 px-3 py-2 text-sm">
            <p className={`whitespace-pre-wrap break-words ${item.is_system ? "italic text-ink-soft" : ""}`}>
              {item.note}
            </p>
            {item.follow_up_at && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-brand-tint px-2 py-1 text-xs font-medium text-brand-dark">
                <BellIcon width={13} height={13} />
                Follow-up set for {formatDateTime(item.follow_up_at, now)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
