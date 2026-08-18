"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { WeatherRecord } from "@/types/weather";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCompactDate, formatStatValue } from "@/lib/format";
import { getConditionInfo } from "@/lib/weatherCodes";

type SortKey = keyof Pick<WeatherRecord, "date" | "temperature" | "humidity" | "rainfall" | "windSpeed" | "condition">;

const PAGE_SIZE = 10;

export function WeatherTable({ records }: { records: WeatherRecord[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<WeatherRecord["condition"][]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const conditions = useMemo(() => {
    return Array.from(new Set(records.map((record) => record.condition)));
  }, [records]);

  const filtered = useMemo(() => {
    return records
      .filter((record) => record.date.includes(search.trim()))
      .filter((record) => (filters.length > 0 ? filters.includes(record.condition) : true))
      .sort((a, b) => {
        const direction = sortDirection === "asc" ? 1 : -1;
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        if (sortKey === "date") {
          return a.date.localeCompare(b.date) * direction;
        }

        const aNumber = typeof aValue === "number" ? aValue : Number.NEGATIVE_INFINITY;
        const bNumber = typeof bValue === "number" ? bValue : Number.NEGATIVE_INFINITY;

        if (sortKey === "condition") {
          return a.condition.localeCompare(b.condition) * direction;
        }

        return (aNumber - bNumber) * direction;
      });
  }, [filters, records, search, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-on-background">Historical Data</h3>
          <p className="text-sm text-on-surface-variant">
            Search, filter, sort, and page through the selected date range.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <Input
              className="pl-10"
              placeholder="Search by date..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div ref={wrapperRef} className="relative">
            <Button variant="secondary" onClick={() => setFilterOpen((value) => !value)}>
              <Filter className="h-4 w-4" />
              Filter
              <ChevronDown className="h-4 w-4" />
            </Button>
            {filterOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-outline-variant bg-surface p-3 shadow-overlay">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Conditions
                </div>
                <div className="space-y-2">
                  {conditions.map((condition) => {
                    const info = getConditionInfo(condition);
                    return (
                      <label key={condition} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.includes(condition)}
                          onChange={(event) => {
                            setFilters((current) =>
                              event.target.checked
                                ? [...current, condition]
                                : current.filter((value) => value !== condition),
                            );
                          }}
                        />
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: info.displayColor }} />
                        <span>{condition}</span>
                      </label>
                    );
                  })}
                </div>
                <Button variant="ghost" className="mt-3 w-full" onClick={() => setFilters([])}>
                  Clear filters
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardBody className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[760px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-container-low text-left text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                {[
                  ["date", "Date"],
                  ["temperature", "Temperature"],
                  ["humidity", "Humidity"],
                  ["rainfall", "Rainfall"],
                  ["windSpeed", "Wind Speed"],
                  ["condition", "Condition"],
                ].map(([key, label]) => (
                  <th key={key} className="border-b border-outline-variant/60 px-3 py-3">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-left"
                      onClick={() => setSort(key as SortKey)}
                    >
                      {label}
                      {sortKey === key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length > 0 ? (
                visible.map((record) => {
                  const info = getConditionInfo(record.condition);
                  return (
                    <tr key={record.date} className="border-b border-outline-variant/60 hover:bg-surface-container-low">
                      <td className="px-3 py-3 font-medium">{formatCompactDate(record.date)}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatStatValue(record.temperature, 1)}°C</td>
                      <td className="px-3 py-3 text-right font-mono">{formatStatValue(record.humidity, 0)}%</td>
                      <td className="px-3 py-3 text-right font-mono">{formatStatValue(record.rainfall, 1)} mm</td>
                      <td className="px-3 py-3 text-right font-mono">{formatStatValue(record.windSpeed, 1)} km/h</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em]">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: info.displayColor }} />
                          {record.condition}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-3 py-10 text-center text-on-surface-variant" colSpan={6}>
                    No weather records for this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
      <div className="flex flex-col gap-3 border-t border-outline-variant/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-on-surface-variant">
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length} records
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="text-sm text-on-surface-variant">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
