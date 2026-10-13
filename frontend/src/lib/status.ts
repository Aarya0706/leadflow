import type { LeadStatus } from "./types";

/** Badge colours per status (classes are written out in full so Tailwind doesn't purge them). */
export const STATUS_STYLES: Record<LeadStatus, string> = {
  New: "bg-[#E1F5E9] text-[#17623A]",
  Contacted: "bg-[#FFF1C7] text-[#74530A]",
  Qualified: "bg-[#DAF1F4] text-[#0E5A66]",
  "Proposal Sent": "bg-[#ECE3FB] text-[#57309F]",
  Won: "bg-[#E4E8ED] text-[#3F4C5A]",
  Lost: "bg-[#FBE4E2] text-[#98291F]",
};

/** Closed leads are visually quieted in the list. */
export const isClosed = (status: LeadStatus) => status === "Won" || status === "Lost";
