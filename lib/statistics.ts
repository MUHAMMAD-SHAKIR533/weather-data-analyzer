import type { AnalysisResponse, MetricSummary, WeatherConditionKey, WeatherRecord } from "@/types/weather";
import { getConditionInfo } from "@/lib/weatherCodes";

function toNumbers(values: Array<number | null | undefined>) {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

export function summarizeNumbers(values: Array<number | null | undefined>): MetricSummary {
  const numbers = toNumbers(values);
  const count = numbers.length;

  if (count === 0) {
    return {
      count: 0,
      mean: null,
      median: null,
      min: null,
      max: null,
      range: null,
      standardDeviation: null,
    };
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = numbers.reduce((total, value) => total + value, 0);
  const mean = sum / count;
  const midpoint = Math.floor(count / 2);
  const median =
    count % 2 === 0 ? (sorted[midpoint - 1] + sorted[midpoint]) / 2 : sorted[midpoint];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const variance = numbers.reduce((total, value) => total + (value - mean) ** 2, 0) / count;

  return {
    count,
    mean,
    median,
    min,
    max,
    range: max - min,
    standardDeviation: Math.sqrt(variance),
  };
}

export function summarizeWeatherRecords(records: WeatherRecord[]): AnalysisResponse["metrics"] {
  return {
    temperature: summarizeNumbers(records.map((record) => record.temperature)),
    humidity: summarizeNumbers(records.map((record) => record.humidity)),
    rainfall: summarizeNumbers(records.map((record) => record.rainfall)),
    wind: summarizeNumbers(records.map((record) => record.windSpeed)),
  };
}

export function summarizeConditions(records: WeatherRecord[]) {
  const totals = new Map<WeatherConditionKey, number>();

  for (const record of records) {
    totals.set(record.condition, (totals.get(record.condition) ?? 0) + 1);
  }

  return [...totals.entries()]
    .map(([label, count]) => {
      const info = getConditionInfo(label);
      return {
        label,
        count,
        displayColor: info.displayColor,
        accentColor: info.accentColor,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function buildAnalysisResponse({
  location,
  range,
  source,
  partial,
  records,
}: {
  location: AnalysisResponse["location"];
  range: AnalysisResponse["range"];
  source: AnalysisResponse["source"];
  partial: boolean;
  records: WeatherRecord[];
}): AnalysisResponse {
  return {
    location,
    range,
    source,
    partial,
    records,
    metrics: summarizeWeatherRecords(records),
    conditions: summarizeConditions(records),
  };
}

