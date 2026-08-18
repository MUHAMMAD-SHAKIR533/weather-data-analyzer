import { NextResponse } from "next/server";
import type { ApiErrorResponse, LocationOption } from "@/types/weather";

export function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        message,
        code,
      },
    },
    { status },
  );
}

export function parseNumberParam(value: string | null, name: string) {
  if (value === null || value.trim() === "") {
    throw new Error(`${name} is required.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a number.`);
  }

  return parsed;
}

export function parseOptionalString(value: string | null) {
  if (value === null || value.trim() === "") {
    return null;
  }

  return value.trim();
}

export function isValidISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

export function getTomorrowISO() {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function parseLocationFromSearchParams(searchParams: URLSearchParams): LocationOption {
  const name = parseOptionalString(searchParams.get("name")) ?? "Selected location";
  const country = parseOptionalString(searchParams.get("country")) ?? "";
  const admin1 = parseOptionalString(searchParams.get("admin1"));
  const latitude = parseNumberParam(searchParams.get("lat"), "lat");
  const longitude = parseNumberParam(searchParams.get("lon"), "lon");

  return {
    name,
    country,
    admin1,
    latitude,
    longitude,
  };
}

export function parseDateRange(searchParams: URLSearchParams) {
  const start = parseOptionalString(searchParams.get("start"));
  const end = parseOptionalString(searchParams.get("end"));

  if (!start || !end) {
    throw new Error("start and end are required.");
  }

  if (!isValidISODate(start) || !isValidISODate(end)) {
    throw new Error("Dates must be in YYYY-MM-DD format.");
  }

  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);

  if (startDate > endDate) {
    throw new Error("start must be on or before end.");
  }

  const maxDays = 366;
  const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  if (durationDays > maxDays) {
    throw new Error("Date range must be 366 days or less.");
  }

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowDate = new Date(`${tomorrow.toISOString().slice(0, 10)}T00:00:00Z`);

  if (startDate > tomorrowDate || endDate > tomorrowDate) {
    throw new Error("Dates cannot be more than one day in the future.");
  }

  return { start, end };
}

