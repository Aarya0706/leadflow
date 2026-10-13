"use client";

import { useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLeads } from "@/hooks/useLeads";
import { useNow } from "@/hooks/useNow";
import { AddLeadDialog } from "./AddLeadDialog";
import { LeadDialog } from "./LeadDialog";
import { LeadList } from "./LeadList";
import { SearchInput } from "./SearchInput";
import { StatusFilter, type StatusFilterValue } from "./StatusFilter";
import { PlusIcon, TrendIcon } from "./icons";

export function LeadFlowApp() {
  const [status, setStatus] = useState<StatusFilterValue>("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const now = useNow();
  const q = useDebouncedValue(search, 250);
  const leads = useLeads({ status, q });
  const hasFilters = status !== "All" || q.trim() !== "";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <header className="flex items-center justify-between py-5">
        <h1 className="flex items-center gap-2 text-xl font-bold text-brand">
          <TrendIcon width={20} height={20} />
          LeadFlow
        </h1>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <PlusIcon />
          Add new lead
        </button>
      </header>

      <div className="mb-5 space-y-3">
        <SearchInput value={search} onChange={setSearch} />
        <StatusFilter value={status} onChange={setStatus} />
      </div>

      <main aria-busy={leads.isFetching}>
        {leads.isPending ? (
          <ul className="space-y-2" aria-label="Loading leads">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-[88px] animate-pulse rounded-lg border border-line bg-white" />
            ))}
          </ul>
        ) : leads.isError ? (
          <div role="alert" className="rounded-lg border border-alert-edge bg-alert-tint p-4 text-sm text-alert">
            <p className="font-medium">Couldn&rsquo;t load leads</p>
            <p className="mt-1">{leads.error.message}</p>
            <button
              type="button"
              onClick={() => leads.refetch()}
              className="mt-3 rounded-md border border-alert-edge bg-white px-3 py-1.5 font-medium"
            >
              Try again
            </button>
          </div>
        ) : leads.data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white p-10 text-center">
            <p className="font-medium">{hasFilters ? "No leads match" : "No leads yet"}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {hasFilters
                ? "Try a different status or search term."
                : "Add your first lead to start tracking discussions."}
            </p>
            {!hasFilters && (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Add new lead
              </button>
            )}
          </div>
        ) : (
          <LeadList leads={leads.data} now={now} onSelect={setSelectedId} />
        )}
      </main>

      <LeadDialog leadId={selectedId} now={now} onClose={() => setSelectedId(null)} />
      <AddLeadDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
