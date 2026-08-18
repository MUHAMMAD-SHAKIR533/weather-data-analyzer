"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, Cloud, Droplets } from "lucide-react";
import { useLocation } from "@/components/providers";
import { Card, CardBody } from "@/components/ui/card";
import { ChartCard } from "@/components/ui/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/client-api";
import { buildPresetRange } from "@/lib/date-presets";
import { formatRange } from "@/lib/format";
import type { WeatherConditionKey, WeatherHistoryResponse } from "@/types/weather";
import { DateRangeControls } from "@/components/date-range-controls";
import { HumidityAreaChart } from "@/components/charts/humidity-area-chart";
import { ConditionsDonutChart } from "@/components/charts/conditions-donut-chart";
import { WeatherTable } from "@/components/weather-table";

const EMPTY_RECORDS: WeatherHistoryResponse["records"] = [];

export default function WeatherDataPage() {
  const { location } = useLocation();
  const defaultRange = useMemo(() => buildPresetRange("30"), []);
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [selectedPreset, setSelectedPreset] = useState<"7" | "30" | "90" | "custom">("30");
  const [history, setHistory] = useState<WeatherHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activeLocation = location;
    if (!activeLocation) {
      return;
    }
    const { latitude, longitude, name, country, admin1 } = activeLocation;

    let cancelled = false;

    async function loadHistory() {
      if (new Date(`${start}T00:00:00Z`) > new Date(`${end}T00:00:00Z`)) {
        setError("Start date must be on or before end date.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = new URL("/api/weather/history", window.location.origin);
        url.searchParams.set("lat", String(latitude));
        url.searchParams.set("lon", String(longitude));
        url.searchParams.set("name", name);
        url.searchParams.set("country", country);
        if (admin1) {
          url.searchParams.set("admin1", admin1);
        }
        url.searchParams.set("start", start);
        url.searchParams.set("end", end);

        const data = await fetchJson<WeatherHistoryResponse>(url.toString());
        if (cancelled) return;
        setHistory(data);
      } catch (requestError) {
        if (cancelled) return;
        const message =
          typeof requestError === "object" && requestError && "error" in requestError
            ? (requestError as { error?: { message?: string } }).error?.message ?? "Couldn't load history."
            : "Couldn't load history.";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [end, location, start]);

  const chartData = history ? history.records : EMPTY_RECORDS;

  const conditionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of chartData) {
      counts.set(record.condition, (counts.get(record.condition) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label: label as WeatherConditionKey, count }));
  }, [chartData]);

  const updateRangeFromPreset = (preset: "7" | "30" | "90") => {
    const next = buildPresetRange(preset);
    setStart(next.start);
    setEnd(next.end);
    setSelectedPreset(preset);
  };

  const applyCustom = (nextStart: string, nextEnd: string) => {
    setStart(nextStart);
    setEnd(nextEnd);
    setSelectedPreset("custom");
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Weather Data</p>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-on-background">
            Historical records and quick trend checks
          </h1>
          <p className="max-w-2xl text-sm text-on-surface-variant">
            Use the selected location, choose a date range, and explore the table entirely on the client.
          </p>
        </div>

        <DateRangeControls
          start={start}
          end={end}
          onStartChange={(value) => applyCustom(value, end)}
          onEndChange={(value) => applyCustom(start, value)}
          onPreset={updateRangeFromPreset}
          selectedPreset={selectedPreset}
        />

        {location ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
            <CalendarRange className="h-4 w-4" />
            <span>
              {location.name}
              {location.country ? `, ${location.country}` : ""} · {formatRange(start, end)}
            </span>
          </div>
        ) : null}
      </section>

      {!location ? (
        <Card>
          <CardBody className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <Cloud className="h-8 w-8 text-primary" />
            <h2 className="text-xl font-semibold text-on-background">Search for a city to view history</h2>
            <p className="text-sm text-on-surface-variant">
              The historical table and charts will appear after a location is selected on the dashboard.
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          {error ? (
            <div className="flex items-center gap-3 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-background">
              <AlertTriangle className="h-4 w-4 text-error" />
              <span>{error}</span>
            </div>
          ) : null}

          {loading && !history ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-[320px] w-full" />
              <Skeleton className="h-[320px] w-full" />
            </div>
          ) : history?.records.length ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Humidity Trend" summary="Humidity trend over the selected date range.">
                  <HumidityAreaChart
                    data={history.records.map((record) => ({
                      date: record.date,
                      humidity: record.humidity,
                    }))}
                  />
                </ChartCard>
                <ChartCard title="Weather Conditions" summary="Condition distribution over the selected date range.">
                  <ConditionsDonutChart data={conditionCounts} />
                </ChartCard>
              </div>
              <WeatherTable records={history.records} />
              {history.partial ? (
                <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface-variant">
                  Some recent archive data may still be partial because Open-Meteo archive coverage can lag by a few days.
                </div>
              ) : null}
            </>
          ) : (
            <Card>
              <CardBody className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                <Droplets className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-semibold text-on-background">No weather records for this date range</h2>
                <p className="text-sm text-on-surface-variant">
                  Widen the range or try a different location to see more records.
                </p>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
