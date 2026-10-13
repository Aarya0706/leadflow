import { describe, expect, it } from "vitest";
import { classifyFollowUp, partitionLeads } from "./followups";
import { defaultFollowUp, localInputsToIso } from "./time";
import type { Lead } from "./types";

// All dates are built from LOCAL components so the tests pass in any timezone.
const now = new Date(2026, 9, 13, 15, 0); // Oct 13 2026, 3:00 PM local
const at = (dayOffset: number, hour: number, minute = 0) =>
  new Date(2026, 9, 13 + dayOffset, hour, minute).toISOString();

const lead = (id: number, follow_up_at: string | null): Lead => ({
  id,
  name: `Lead ${id}`,
  company: null,
  phone: null,
  status: "New",
  follow_up_at,
  created_at: at(-10, 9),
  last_note: "note",
  last_discussion_at: at(-1, 9),
});

describe("classifyFollowUp", () => {
  it("returns null when there is no follow-up", () => {
    expect(classifyFollowUp(null, now)).toBeNull();
  });

  it("treats later today as today and not yet passed", () => {
    expect(classifyFollowUp(at(0, 18), now)).toEqual({ state: "today", passed: false });
  });

  it("keeps earlier-today times pinned as today, but flags them as passed", () => {
    expect(classifyFollowUp(at(0, 9), now)).toEqual({ state: "today", passed: true });
  });

  it("treats the very start and end of the local day correctly", () => {
    expect(classifyFollowUp(at(0, 0, 0), now)?.state).toBe("today");
    expect(classifyFollowUp(at(0, 23, 59), now)?.state).toBe("today");
    expect(classifyFollowUp(at(1, 0, 0), now)?.state).toBe("upcoming");
    expect(classifyFollowUp(at(-1, 23, 59), now)?.state).toBe("overdue");
  });
});

describe("partitionLeads", () => {
  it("pins today's follow-ups (earliest first) and puts overdue first in the rest", () => {
    const leads = [
      lead(1, null),
      lead(2, at(1, 10)),
      lead(3, at(0, 18)),
      lead(4, at(-2, 11)),
      lead(5, at(0, 9)),
      lead(6, at(-1, 11)),
    ];
    const { today, rest } = partitionLeads(leads, now);
    expect(today.map((l) => l.id)).toEqual([5, 3]);
    expect(rest.map((l) => l.id)).toEqual([4, 6, 1, 2]);
  });
});

describe("time helpers", () => {
  it("converts local date/time inputs to a UTC ISO string", () => {
    expect(localInputsToIso("2026-10-14", "14:00")).toBe(new Date(2026, 9, 14, 14, 0).toISOString());
  });

  it("returns null for missing input", () => {
    expect(localInputsToIso("", "14:00")).toBeNull();
    expect(localInputsToIso("2026-10-14", "")).toBeNull();
  });

  it("suggests tomorrow at 10:00", () => {
    expect(defaultFollowUp(now)).toEqual({ date: "2026-10-14", time: "10:00" });
  });
});
