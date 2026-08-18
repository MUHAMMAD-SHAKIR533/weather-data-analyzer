import type { LocationOption, WeatherRecord } from "@/types/weather";
import { getConditionInfoFromCode, getConditionKeyFromCode } from "@/lib/weatherCodes";

export class UpstreamError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 502, code = "UPSTREAM_ERROR") {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
    this.code = code;
  }
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "weather-data-analyzer/1.0",
      },
    });

    if (!response.ok) {
      throw new UpstreamError(`${label} request failed.`, response.status, `${label.toUpperCase()}_FAILED`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof UpstreamError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UpstreamError(`${label} request timed out.`, 504, `${label.toUpperCase()}_TIMEOUT`);
    }

    throw new UpstreamError(`${label} request failed.`, 502, `${label.toUpperCase()}_FAILED`);
  } finally {
    clearTimeout(timeout);
  }
}

type OpenMeteoSearchResponse = {
  results?: Array<{
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
};

type OpenMeteoCurrentResponse = {
  current?: {
    time: string;
    temperature_2m: number | null;
    relative_humidity_2m: number | null;
    precipitation: number | null;
    wind_speed_10m: number | null;
    weather_code: number;
  };
};

type OpenMeteoArchiveResponse = {
  daily?: {
    time: string[];
    temperature_2m_mean?: Array<number | null>;
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    relative_humidity_2m_mean?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
    wind_speed_10m_max?: Array<number | null>;
    weather_code?: Array<number | null>;
  };
};

export async function searchLocations(query: string, count = 5): Promise<LocationOption[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const data = await fetchJson<OpenMeteoSearchResponse>(url.toString(), "location search");
  return (data.results ?? []).map((result) => ({
    name: result.name,
    country: result.country,
    admin1: result.admin1 ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
  }));
}

export async function getCurrentWeather(lat: number, lon: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code");
  url.searchParams.set("timezone", "auto");

  const data = await fetchJson<OpenMeteoCurrentResponse>(url.toString(), "current weather");
  if (!data.current) {
    throw new UpstreamError("Current weather data was not available.", 502, "CURRENT_WEATHER_EMPTY");
  }

  const condition = getConditionInfoFromCode(data.current.weather_code);

  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    rainfall: data.current.precipitation,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    condition,
    observedAt: data.current.time,
  };
}

export async function getHistoricalWeather(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
) {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set(
    "daily",
    "temperature_2m_mean,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum,wind_speed_10m_max,weather_code",
  );
  url.searchParams.set("timezone", "auto");

  const data = await fetchJson<OpenMeteoArchiveResponse>(url.toString(), "historical weather");
  const daily = data.daily;
  if (!daily?.time?.length) {
    return { records: [] as WeatherRecord[], partial: true };
  }

  const records: WeatherRecord[] = daily.time.map((date, index) => {
    const weatherCode = daily.weather_code?.[index] ?? 3;
    return {
      date,
      temperature: daily.temperature_2m_mean?.[index] ?? null,
      temperatureMin: daily.temperature_2m_min?.[index] ?? null,
      temperatureMax: daily.temperature_2m_max?.[index] ?? null,
      humidity: daily.relative_humidity_2m_mean?.[index] ?? null,
      rainfall: daily.precipitation_sum?.[index] ?? null,
      windSpeed: daily.wind_speed_10m_max?.[index] ?? null,
      weatherCode,
      condition: getConditionKeyFromCode(weatherCode),
    };
  });

  const expectedDays = Math.max(
    1,
    Math.round(
      (new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) /
        86400000,
    ) + 1,
  );

  return {
    records,
    partial: records.length < expectedDays,
  };
}

