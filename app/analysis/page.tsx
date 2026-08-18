"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Cloud, Droplets, Flame, Thermometer, Wind } from "lucide-react";
import { useLocation } from "@/components/providers";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/client-api";
import { buildPresetRange } from "@/lib/date-presets";
import { formatRange, formatStatValue } from "@/lib/format";
import type { AnalysisResponse, WeatherHistoryResponse } from "@/types/weather";
import { DateRangeControls } from "@/components/date-range-controls";
import { TemperatureTrendChart } from "@/components/charts/temperature-trend-chart";
import { MinMaxChart } from "@/components/charts/min-max-chart";
import { HumidityAreaChart } from "@/components/charts/humidity-area-chart";
import { RainfallBarChart } from "@/components/charts/rainfall-bar-chart";
import { WindTrendChart } from "@/components/charts/wind-trend-chart";
import { ConditionsDonutChart } from "@/components/charts/conditions-donut-chart";

export default function AnalysisPage() {
  const { location } = useLocation();
  const defaultRange = useMemo(() => buildPresetRange("30"), []);
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [selectedPreset, setSelectedPreset] = useState<"7" | "30" | "90" | "custom">("30");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
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

    async function load() {
      if (new Date(`${start}T00:00:00Z`) > new Date(`${end}T00:00:00Z`)) {
        setError("Start date must be on or before end date.");
        return;
      }

      setLoading(true);
      setError(null);

      const buildUrl = (pathname: string) => {
        const url = new URL(pathname, window.location.origin);
        url.searchParams.set("lat", String(latitude));
        url.searchParams.set("lon", String(longitude));
        url.searchParams.set("name", name);
        url.searchParams.set("country", country);
        if (admin1) {
          url.searchParams.set("admin1", admin1);
        }
        url.searchParams.set("start", start);
        url.searchParams.set("end", end);
        return url.toString();
      };

      try {
        const [analysisData, historyData] = await Promise.all([
          fetchJson<AnalysisResponse>(buildUrl("/api/analysis")),
          fetchJson<WeatherHistoryResponse>(buildUrl("/api/weather/history")),
        ]);

        if (cancelled) return;
        setAnalysis(analysisData);
        setHistory(historyData);
      } catch (requestError) {
        if (cancelled) return;
        const message =
          typeof requestError === "object" && requestError && "error" in requestError
            ? (requestError as { error?: { message?: string } }).error?.message ?? "Couldn't load analysis."
            : "Couldn't load analysis.";
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

  const chartRecords = history?.records ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Analysis</p>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-on-background">
            Summary statistics and trend charts
          </h1>
          <p className="max-w-2xl text-sm text-on-surface-variant">
            The analysis view combines a summary API response with the historical record set for the selected range.
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
            <h2 className="text-xl font-semibold text-on-background">Search for a city to view analysis</h2>
            <p className="text-sm text-on-surface-variant">
              Once a location is selected, the analysis sections will populate with live weather data.
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
            <div className="space-y-4">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              <AnalysisSection
                title="Temperature Analysis"
                cards={[
                  ["Average", analysis.metrics.temperature.mean, "°C", <Thermometer key="avg" className="h-4 w-4" />],
                  ["Maximum", analysis.metrics.temperature.max, "°C", <Thermometer key="max" className="h-4 w-4" />],
                  ["Minimum", analysis.metrics.temperature.min, "°C", <Thermometer key="min" className="h-4 w-4" />],
                  ["Median", analysis.metrics.temperature.median, "°C", <Thermometer key="median" className="h-4 w-4" />],
                  [
                    "Std Dev",
                    analysis.metrics.temperature.standardDeviation,
                    "°C",
                    <Thermometer key="std" className="h-4 w-4" />,
                  ],
                ]}
                charts={[
                  <ChartCard key="trend" title="Temperature Trend" summary="Temperature trend over the selected range.">
                    <TemperatureTrendChart
                      data={chartRecords.map((record) => ({
                        date: record.date,
                        temperature: record.temperature,
                      }))}
                    />
                  </ChartCard>,
                  <ChartCard key="range" title="Min vs Max" summary="Daily minimum and maximum temperature comparison.">
                    <MinMaxChart
                      data={chartRecords.map((record) => ({
                        date: record.date,
                        temperatureMin: record.temperatureMin,
                        temperatureMax: record.temperatureMax,
                      }))}
                    />
                  </ChartCard>,
                ]}
              />

              <AnalysisSection
                title="Humidity Analysis"
                cards={[
                  ["Average", analysis.metrics.humidity.mean, "%", <Droplets key="humidity-avg" className="h-4 w-4" />],
                  ["Maximum", analysis.metrics.humidity.max, "%", <Droplets key="humidity-max" className="h-4 w-4" />],
                  ["Minimum", analysis.metrics.humidity.min, "%", <Droplets key="humidity-min" className="h-4 w-4" />],
                ]}
                charts={[
                  <ChartCard key="humidity" title="Humidity Over Time" summary="Humidity area chart over time.">
                    <HumidityAreaChart
                      data={chartRecords.map((record) => ({
                        date: record.date,
                        humidity: record.humidity,
                      }))}
                    />
                  </ChartCard>,
                ]}
              />

              <AnalysisSection
                title="Rainfall Analysis"
                cards={[
                  [
                    "Total",
                    chartRecords.reduce((total, record) => total + (record.rainfall ?? 0), 0),
                    "mm",
                    <Flame key="rain-total" className="h-4 w-4" />,
                  ],
                  ["Average", analysis.metrics.rainfall.mean, "mm", <Flame key="rain-avg" className="h-4 w-4" />],
                  ["Maximum", analysis.metrics.rainfall.max, "mm", <Flame key="rain-max" className="h-4 w-4" />],
                ]}
                charts={[
                  <ChartCard key="rainfall" title="Rainfall by Date" summary="Daily rainfall totals over time.">
                    <RainfallBarChart
                      data={chartRecords.map((record) => ({
                        date: record.date,
                        rainfall: record.rainfall,
                      }))}
                    />
                  </ChartCard>,
                ]}
              />

              <AnalysisSection
                title="Wind Analysis"
                cards={[
                  ["Average", analysis.metrics.wind.mean, "km/h", <Wind key="wind-avg" className="h-4 w-4" />],
                  ["Maximum", analysis.metrics.wind.max, "km/h", <Wind key="wind-max" className="h-4 w-4" />],
                  ["Minimum", analysis.metrics.wind.min, "km/h", <Wind key="wind-min" className="h-4 w-4" />],
                ]}
                charts={[
                  <ChartCard key="wind" title="Wind Speed Trend" summary="Wind speed trend over time.">
                    <WindTrendChart
                      data={chartRecords.map((record) => ({
                        date: record.date,
                        windSpeed: record.windSpeed,
                      }))}
                    />
                  </ChartCard>,
                ]}
              />

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-on-background">Weather Conditions</h3>
                  <p className="text-sm text-on-surface-variant">Condition distribution for the selected range.</p>
                </CardHeader>
                <CardBody className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center">
                  <ConditionsDonutChart
                    data={analysis.conditions.map((condition) => ({
                      label: condition.label,
                      count: condition.count,
                    }))}
                  />
                  <div className="space-y-3">
                    {analysis.conditions.length > 0 ? (
                      analysis.conditions.map((condition) => (
                        <div key={condition.label} className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full" style={{ background: condition.displayColor }} />
                            <span className="font-medium text-on-background">{condition.label}</span>
                          </div>
                          <span className="font-mono text-sm text-on-surface-variant">{condition.count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-on-surface-variant">No condition data is available.</p>
                    )}
                  </div>
                </CardBody>
              </Card>

              {analysis.partial ? (
                <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface-variant">
                  Some archive data is partial for the latest days in this range.
                </div>
              ) : null}
            </div>
          ) : (
            <Card>
              <CardBody className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                <Droplets className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-semibold text-on-background">No analysis data available</h2>
                <p className="text-sm text-on-surface-variant">Try a wider date range or a different location.</p>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function AnalysisSection({
  title,
  cards,
  charts,
}: {
  title: string;
  cards: Array<[string, number | null, string, ReactNode]>;
  charts: ReactNode[];
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-on-background">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, unit, icon]) => (
          <StatCard
            key={label}
            label={label}
            value={formatStatValue(value, 1)}
            unit={unit}
            icon={icon}
          />
        ))}
      </div>
      <div className={`grid gap-4 ${charts.length > 1 ? "lg:grid-cols-2" : ""}`}>{charts}</div>
    </section>
  );
}
