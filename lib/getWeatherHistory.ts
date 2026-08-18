import type { LocationOption, WeatherHistoryResponse, WeatherRecord } from "@/types/weather";
import { getHistoricalWeather } from "@/lib/openMeteo";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { getConditionKeyFromCode } from "@/lib/weatherCodes";

type SupabaseLocationRow = {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
};

type SupabaseWeatherRow = {
  date: string;
  temperature: number | null;
  temperature_min: number | null;
  temperature_max: number | null;
  humidity: number | null;
  rainfall: number | null;
  wind_speed: number | null;
  weather_code: number;
};

function normalizeLocation(location: LocationOption): LocationOption {
  return {
    name: location.name,
    country: location.country,
    admin1: location.admin1 ?? null,
    latitude: Number(location.latitude.toFixed(5)),
    longitude: Number(location.longitude.toFixed(5)),
  };
}

function mapRowToRecord(row: SupabaseWeatherRow): WeatherRecord {
  return {
    date: row.date,
    temperature: row.temperature,
    temperatureMin: row.temperature_min,
    temperatureMax: row.temperature_max,
    humidity: row.humidity,
    rainfall: row.rainfall,
    windSpeed: row.wind_speed,
    weatherCode: row.weather_code,
    condition: getConditionKeyFromCode(row.weather_code),
  };
}

async function lookupLocation(
  client: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  location: LocationOption,
) {
  const normalized = normalizeLocation(location);
  const { data, error } = await client
    .from("locations")
    .select("id,name,country,admin1,latitude,longitude")
    .eq("latitude", normalized.latitude)
    .eq("longitude", normalized.longitude)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data as SupabaseLocationRow;
  }

  const { data: inserted, error: insertError } = await client
    .from("locations")
    .upsert(
      {
        name: normalized.name,
        country: normalized.country,
        admin1: normalized.admin1,
        latitude: normalized.latitude,
        longitude: normalized.longitude,
      },
      {
        onConflict: "latitude,longitude",
      },
    )
    .select("id,name,country,admin1,latitude,longitude")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted as SupabaseLocationRow;
}

function buildDateSet(startDate: string, endDate: string) {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export async function getWeatherHistory(
  location: LocationOption,
  startDate: string,
  endDate: string,
): Promise<WeatherHistoryResponse> {
  const normalizedLocation = normalizeLocation(location);
  const client = getSupabaseAdminClient();

  if (!client) {
    const live = await getHistoricalWeather(normalizedLocation.latitude, normalizedLocation.longitude, startDate, endDate);
    return {
      location: normalizedLocation,
      range: { start: startDate, end: endDate },
      source: "fallback",
      partial: live.partial,
      records: live.records,
    };
  }

  try {
    const locationRow = await lookupLocation(client, normalizedLocation);
    const expectedDates = buildDateSet(startDate, endDate);

    const { data: cachedRows, error: cacheError } = await client
      .from("weather_records")
      .select("date,temperature,temperature_min,temperature_max,humidity,rainfall,wind_speed,weather_code")
      .eq("location_id", locationRow.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (cacheError) {
      throw cacheError;
    }

    const cachedRecords = (cachedRows ?? []) as SupabaseWeatherRow[];
    const cachedDates = new Set(cachedRecords.map((record) => record.date));
    const isComplete = expectedDates.every((date) => cachedDates.has(date));

    if (isComplete && cachedRecords.length > 0) {
      return {
        location: normalizedLocation,
        range: { start: startDate, end: endDate },
        source: "cache",
        partial: false,
        records: cachedRecords.map(mapRowToRecord),
      };
    }

    const live = await getHistoricalWeather(normalizedLocation.latitude, normalizedLocation.longitude, startDate, endDate);

    const rows = live.records.map((record) => ({
      location_id: locationRow.id,
      date: record.date,
      temperature: record.temperature,
      temperature_min: record.temperatureMin,
      temperature_max: record.temperatureMax,
      humidity: record.humidity,
      rainfall: record.rainfall,
      wind_speed: record.windSpeed,
      weather_code: record.weatherCode,
    }));

    if (rows.length > 0) {
      const { error: upsertError } = await client
        .from("weather_records")
        .upsert(rows, {
          onConflict: "location_id,date",
        });

      if (upsertError) {
        return {
          location: normalizedLocation,
          range: { start: startDate, end: endDate },
          source: "live",
          partial: live.partial,
          records: live.records,
        };
      }
    }

    return {
      location: normalizedLocation,
      range: { start: startDate, end: endDate },
      source: "live",
      partial: live.partial,
      records: live.records,
    };
  } catch {
    const live = await getHistoricalWeather(normalizedLocation.latitude, normalizedLocation.longitude, startDate, endDate);
    return {
      location: normalizedLocation,
      range: { start: startDate, end: endDate },
      source: "fallback",
      partial: live.partial,
      records: live.records,
    };
  }
}

