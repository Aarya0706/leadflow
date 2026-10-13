import { partitionLeads } from "@/lib/followups";
import type { Lead } from "@/lib/types";
import { LeadCard } from "./LeadCard";

interface LeadListProps {
  leads: Lead[];
  now: Date;
  onSelect: (id: number) => void;
}

function Heading({ children, count }: { children: string; count: number }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-soft">
      {children}
      <span className="rounded-full bg-line px-2 py-0.5 text-xs font-medium text-ink-soft">{count}</span>
    </h2>
  );
}

export function LeadList({ leads, now, onSelect }: LeadListProps) {
  const { today, rest } = partitionLeads(leads, now);

  return (
    <div className="space-y-6">
      {today.length > 0 && (
        <section aria-label="Today's follow-ups">
          <Heading count={today.length}>Today&rsquo;s follow-ups</Heading>
          <ul className="space-y-2">
            {today.map((lead) => (
              <LeadCard key={lead.id} lead={lead} now={now} pinned onSelect={onSelect} />
            ))}
          </ul>
        </section>
      )}

      {rest.length > 0 && (
        <section aria-label="All leads">
          <Heading count={rest.length}>{today.length > 0 ? "All other leads" : "All leads"}</Heading>
          <ul className="space-y-2">
            {rest.map((lead) => (
              <LeadCard key={lead.id} lead={lead} now={now} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
