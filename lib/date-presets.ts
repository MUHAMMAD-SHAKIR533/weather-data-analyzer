import { getDefaultRange, subtractDays, toISODate } from "@/lib/format";

export function buildPresetRange(preset: "7" | "30" | "90") {
  const end = new Date();
  const days = Number(preset);
  const start = subtractDays(end, days - 1);
  return {
    start: toISODate(start),
    end: toISODate(end),
  };
}

export function getDefaultDateRange() {
  return getDefaultRange(7);
}

