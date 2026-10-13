import type { Discussion, Lead, LeadStatus, NewDiscussionInput, NewLeadInput } from "./types";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that the API is running and try again.");
  }

  if (!res.ok) {
    // The API always answers errors with {"detail": "..."}.
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.detail ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface LeadFilters {
  status: LeadStatus | "All";
  q: string;
}

export const api = {
  listLeads({ status, q }: LeadFilters) {
    const params = new URLSearchParams();
    if (status !== "All") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    const query = params.toString();
    return request<Lead[]>(`/leads${query ? `?${query}` : ""}`);
  },
  getLead(id: number) {
    return request<Lead>(`/leads/${id}`);
  },
  createLead(input: NewLeadInput) {
    return request<Lead>("/leads", { method: "POST", body: JSON.stringify(input) });
  },
  updateLeadStatus(id: number, status: LeadStatus) {
    return request<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  },
  listDiscussions(leadId: number) {
    return request<Discussion[]>(`/leads/${leadId}/discussions`);
  },
  addDiscussion(leadId: number, input: NewDiscussionInput) {
    return request<Discussion>(`/leads/${leadId}/discussions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
