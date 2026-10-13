import type { Lead } from "./types";

export type FollowUpState = "today" | "overdue" | "upcoming";

export interface FollowUpInfo {
  state: FollowUpState;
  /** True once the scheduled time has passed (always true for "overdue"). */
  passed: boolean;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Classify a follow-up relative to `now`, using the viewer's LOCAL calendar day.
 * (The API stores UTC; deciding "today" in UTC would be wrong for most users.)
 *
 * - overdue:  before the start of today
 * - today:    anywhere within today, including earlier-today times that have passed
 * - upcoming: tomorrow or later
 */
export function classifyFollowUp(iso: string | null, now: Date): FollowUpInfo | null {
  if (!iso) return null;
  const due = new Date(iso);
  const dayStart = startOfDay(now);
  const nextDayStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1);

  if (due < dayStart) return { state: "overdue", passed: true };
  if (due < nextDayStart) return { state: "today", passed: due <= now };
  return { state: "upcoming", passed: false };
}

const byFollowUp = (a: Lead, b: Lead) =>
  new Date(a.follow_up_at as string).getTime() - new Date(b.follow_up_at as string).getTime();

/**
 * Split leads into the pinned "today" section and everything else.
 * In the rest, overdue leads come first (oldest first); the others keep the
 * server's most-recent-activity order.
 */
export function partitionLeads(leads: Lead[], now: Date): { today: Lead[]; rest: Lead[] } {
  const today: Lead[] = [];
  const overdue: Lead[] = [];
  const others: Lead[] = [];

  for (const lead of leads) {
    const state = classifyFollowUp(lead.follow_up_at, now)?.state;
    if (state === "today") today.push(lead);
    else if (state === "overdue") overdue.push(lead);
    else others.push(lead);
  }

  return { today: today.sort(byFollowUp), rest: [...overdue.sort(byFollowUp), ...others] };
}
