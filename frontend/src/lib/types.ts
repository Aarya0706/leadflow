export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Mirrors the API's LeadOut schema. Timestamps are ISO-8601 strings in UTC. */
export interface Lead {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  follow_up_at: string | null;
  created_at: string;
  last_note: string | null;
  last_discussion_at: string | null;
}

export interface Discussion {
  id: number;
  lead_id: number;
  note: string;
  follow_up_at: string | null;
  is_system: boolean;
  created_at: string;
}

export interface NewLeadInput {
  name: string;
  company?: string;
  phone?: string;
}

export interface NewDiscussionInput {
  note: string;
  follow_up_at: string | null;
}
