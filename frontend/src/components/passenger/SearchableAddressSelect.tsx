import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { AddressOption } from "@/features/passenger/types";
import { cn } from "@/utils/cn";

interface SearchableAddressSelectProps {
  label: string;
  placeholder: string;
  options: AddressOption[];
  value: string;
  onChange: (option: AddressOption | null) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SearchableAddressSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
  error = false,
}: SearchableAddressSelectProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOption = options.find((option) => option.code === value) ?? null;
  const visibleOptions = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => normalizeSearch(option.name).includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative grid gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
        )}
        disabled={disabled}
        aria-invalid={error}
        onClick={() => {
          setIsOpen((current) => !current);
          setQuery("");
        }}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {loading ? "Loading..." : selectedOption?.name ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {isOpen && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search..."
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {value ? (
              <button
                type="button"
                className="flex w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                  setQuery("");
                }}
              >
                Clear selection
              </button>
            ) : null}
            {visibleOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                className={cn(
                  "flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
                  option.code === value && "bg-accent text-accent-foreground",
                )}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                  setQuery("");
                }}
              >
                {option.name}
              </button>
            ))}
            {visibleOptions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">No matching address found.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
