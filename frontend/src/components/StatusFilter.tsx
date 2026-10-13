import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export type StatusFilterValue = LeadStatus | "All";

interface StatusFilterProps {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const options: StatusFilterValue[] = ["All", ...LEAD_STATUSES];

  return (
    <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`shrink-0 rounded-full border px-3.5 py-1 text-sm font-medium transition-colors ${
              active
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink-soft hover:border-ink-faint"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
