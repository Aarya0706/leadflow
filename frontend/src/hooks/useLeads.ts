"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type LeadFilters } from "@/lib/api";
import type { Discussion, LeadStatus, NewDiscussionInput, NewLeadInput } from "@/lib/types";

/** Query keys. The list key starts with "leads" so one invalidation refreshes every filter view. */
export const keys = {
  leads: (filters: LeadFilters) => ["leads", filters.status, filters.q] as const,
  lead: (id: number) => ["lead", id] as const,
  discussions: (id: number) => ["discussions", id] as const,
};

export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: keys.leads(filters),
    queryFn: () => api.listLeads(filters),
    // Keep showing the previous results while a new filter/search loads (no flicker).
    placeholderData: keepPreviousData,
  });
}

export function useLead(id: number | null) {
  return useQuery({
    queryKey: keys.lead(id ?? -1),
    queryFn: () => api.getLead(id as number),
    enabled: id !== null,
  });
}

export function useDiscussions(leadId: number) {
  return useQuery({
    queryKey: keys.discussions(leadId),
    queryFn: () => api.listDiscussions(leadId),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewLeadInput) => api.createLead(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLeadStatus(leadId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: LeadStatus) => api.updateLeadStatus(leadId, status),
    onSuccess: (lead) => {
      queryClient.setQueryData(keys.lead(leadId), lead);
      // The list badge changes, and the API logs a "Status changed" timeline entry.
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: keys.discussions(leadId) });
    },
  });
}

export function useAddDiscussion(leadId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewDiscussionInput) => api.addDiscussion(leadId, input),
    onSuccess: (discussion) => {
      // Show the new entry in the timeline immediately...
      queryClient.setQueryData<Discussion[]>(keys.discussions(leadId), (old = []) => [discussion, ...old]);
      // ...and refresh the list (last note, time ago, follow-up) and the open lead.
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: keys.lead(leadId) });
    },
  });
}
