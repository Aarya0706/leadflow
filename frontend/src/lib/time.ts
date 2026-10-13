const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "2 hours ago", "yesterday", "in 3 days"; anything under a minute is "just now". */
export function timeAgo(iso: string, now: Date): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  for (const [unit, size] of UNITS) {
    if (abs >= size) return relative.format(Math.trunc(seconds / size), unit);
  }
  return "just now";
}

/** "Oct 13, 2:00 PM", with the year added only when it isn't the current one. */
export function formatDateTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Value for <input type="date"> in the user's local timezone. */
export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Value for <input type="time"> in the user's local timezone. */
export function toTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Combine local date + time inputs into a UTC ISO string for the API.
 * Returns null if either is missing or the result isn't a real date.
 */
export function localInputsToIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const result = new Date(y, m - 1, d, hh, mm);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

/** Default follow-up suggestion: tomorrow at 10:00 local time. */
export function defaultFollowUp(now: Date = new Date()): { date: string; time: string } {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0);
  return { date: toDateInput(tomorrow), time: toTimeInput(tomorrow) };
}
