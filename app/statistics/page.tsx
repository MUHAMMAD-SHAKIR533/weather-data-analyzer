"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calculator, Cloud } from "lucide-react";
import { useLocation } from "@/components/providers";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/client-api";
import { buildPresetRange } from "@/lib/date-presets";
import { formatRange, formatStatValue } from "@/lib/format";
import type { AnalysisResponse } from "@/types/weather";
import { DateRangeControls } from "@/components/date-range-controls";

const explanations = {
  mean: "The average value across the selected dataset.",
  median: "The middle value when all readings are sorted - less affected by outliers than the mean.",
  min: "The lowest reading in the selected period.",
  max: "The highest reading in the selected period.",
  range: "The gap between the highest and lowest reading in this period.",
  standardDeviation: "How much the values typically vary from the average.",
} as const;

export default function StatisticsPage() {
  const { location } = useLocation();
  const defaultRange = useMemo(() => buildPresetRange("30"), []);
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [selectedPreset, setSelectedPreset] = useState<"7" | "30" | "90" | "custom">("30");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activeLocation = location;
    if (!activeLocation) {
      return;
    }
    const { latitude, longitude, name, country, admin1 } = activeLocation;

    let cancelled = false;

    async function load() {
      if (new Date(`${start}T00:00:00Z`) > new Date(`${end}T00:00:00Z`)) {
        setError("Start date must be on or before end date.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = new URL("/api/analysis", window.location.origin);
        url.searchParams.set("lat", String(latitude));
        url.searchParams.set("lon", String(longitude));
        url.searchParams.set("name", name);
        url.searchParams.set("country", country);
        if (admin1) {
          url.searchParams.set("admin1", admin1);
        }
        url.searchParams.set("start", start);
        url.searchParams.set("end", end);

        const data = await fetchJson<AnalysisResponse>(url.toString());
        if (cancelled) return;
        setAnalysis(data);
      } catch (requestError) {
        if (cancelled) return;
        const message =
          typeof requestError === "object" && requestError && "error" in requestError
            ? (requestError as { error?: { message?: string } }).error?.message ?? "Couldn't load statistics."
            : "Couldn't load statistics.";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [end, location, start]);

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

  const metricCards = analysis
    ? [
        { title: "Temperature", metric: analysis.metrics.temperature },
        { title: "Humidity", metric: analysis.metrics.humidity },
        { title: "Rainfall", metric: analysis.metrics.rainfall },
        { title: "Wind Speed", metric: analysis.metrics.wind },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Statistics
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-on-background">
            Plain-language summary metrics
          </h1>
          <p className="max-w-2xl text-sm text-on-surface-variant">
            This page explains the core statistics for the selected location and time range.
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
          <div className="text-sm text-on-surface-variant">
            {location.name}
            {location.country ? `, ${location.country}` : ""} · {formatRange(start, end)}
          </div>
        ) : null}
      </section>

      {!location ? (
        <Card>
          <CardBody className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <Cloud className="h-8 w-8 text-primary" />
            <h2 className="text-xl font-semibold text-on-background">Search for a city to see statistics</h2>
            <p className="text-sm text-on-surface-variant">
              Select a location on the dashboard and the stat cards will update automatically.
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

          {loading && !analysis ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          ) : analysis ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {metricCards.map(({ title, metric }) => (
                <MetricSummaryCard key={title} title={title} metric={metric} />
              ))}
            </div>
          ) : (
            <Card>
              <CardBody className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                <Calculator className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-semibold text-on-background">No statistics available</h2>
                <p className="text-sm text-on-surface-variant">Try a wider date range or a different location.</p>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricSummaryCard({
  title,
  metric,
}: {
  title: string;
  metric: AnalysisResponse["metrics"]["temperature"];
}) {
  const values = [
    ["Mean", metric.mean, explanations.mean],
    ["Median", metric.median, explanations.median],
    ["Min", metric.min, explanations.min],
    ["Max", metric.max, explanations.max],
    ["Range", metric.range, explanations.range],
    ["Std Dev", metric.standardDeviation, explanations.standardDeviation],
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">{title}</p>
          <h2 className="text-lg font-semibold text-on-background">{title} Statistics</h2>
        </div>
      </CardHeader>
      <CardBody className="grid gap-3 md:grid-cols-2">
        {values.map(([label, value, helper]) => (
          <div key={label} className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
              {label}
            </div>
            <div className="mt-2 text-[28px] font-bold tracking-[-0.01em] text-on-background">
              {formatStatValue(value as number | null, 2)}
            </div>
            <div className="mt-1 text-sm text-on-surface-variant">{helper}</div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
