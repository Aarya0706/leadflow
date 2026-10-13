import { SearchIcon } from "./icons";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label className="relative block w-full sm:max-w-sm">
      <span className="sr-only">Search leads by name or company</span>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or company"
        className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm placeholder:text-ink-faint"
      />
    </label>
  );
}
