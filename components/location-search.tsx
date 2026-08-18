"use client";

import { Search, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/lib/hooks";
import { fetchJson } from "@/lib/client-api";
import type { LocationOption, SearchLocationsResponse } from "@/types/weather";

export function LocationSearch({
  onSelect,
  onSelectLoading,
}: {
  onSelect: (location: LocationOption) => void | Promise<void>;
  onSelectLoading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      if (debouncedQuery.trim().length < 2) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchJson<SearchLocationsResponse>(
          `/api/locations/search?q=${encodeURIComponent(debouncedQuery.trim())}&count=5`,
        );
        if (cancelled) return;
        setResults(data.results);
        setOpen(true);
      } catch {
        if (cancelled) return;
        setResults([]);
        setError("Search failed.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const hasResults = results.length > 0;

  const placeholder = useMemo(
    () => "Search for a city...",
    [],
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <label className="sr-only" htmlFor="location-search">
          Search for a city
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            id="location-search"
            className="pl-11"
            placeholder={placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => query.trim().length >= 2 && setOpen(true)}
          />
        </div>
        <Button type="submit" className="sm:w-[160px]" disabled={onSelectLoading}>
          Search
        </Button>
      </form>

      {query.trim().length > 0 && query.trim().length < 2 ? (
        <p className="mt-2 text-sm text-on-surface-variant">Enter at least 2 characters.</p>
      ) : null}

      {open && query.trim().length >= 2 ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-overlay">
          {loading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-error">{error}</div>
          ) : hasResults ? (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.name}-${result.latitude}-${result.longitude}`}
                  type="button"
                  className="flex w-full items-center gap-3 border-b border-outline-variant/60 px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-surface-container-low"
                  onClick={async () => {
                    setQuery([result.name, result.admin1, result.country].filter(Boolean).join(", "));
                    setOpen(false);
                    await onSelect(result);
                  }}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block font-medium text-on-background">{result.name}</span>
                    <span className="block text-xs text-on-surface-variant">
                      {[result.admin1, result.country].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-on-surface-variant">
              No locations found for &quot;{query.trim()}&quot;.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
