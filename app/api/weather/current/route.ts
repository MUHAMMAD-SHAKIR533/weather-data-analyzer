import { NextResponse } from "next/server";
import { errorResponse, parseLocationFromSearchParams } from "@/lib/api-utils";
import { getCurrentWeather } from "@/lib/openMeteo";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { getConditionInfoFromCode } from "@/lib/weatherCodes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = parseLocationFromSearchParams(searchParams);
    const current = await getCurrentWeather(location.latitude, location.longitude);
    const client = getSupabaseAdminClient();

    if (client && location.name) {
      await client.from("locations").upsert(
        {
          name: location.name,
          country: location.country,
          admin1: location.admin1,
          latitude: Number(location.latitude.toFixed(5)),
          longitude: Number(location.longitude.toFixed(5)),
        },
        {
          onConflict: "latitude,longitude",
        },
      );
    }

    return NextResponse.json({
      location,
      current: {
        temperature: current.temperature,
        humidity: current.humidity,
        rainfall: current.rainfall,
        windSpeed: current.windSpeed,
        weatherCode: current.weatherCode,
        condition: getConditionInfoFromCode(current.weatherCode),
        observedAt: current.observedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && "status" in error && "code" in error) {
      const upstream = error as Error & { status?: number; code?: string };
      return errorResponse(error.message, upstream.code ?? "UPSTREAM_ERROR", upstream.status ?? 502);
    }

    if (error instanceof Error) {
      return errorResponse(error.message, "INVALID_CURRENT_WEATHER_REQUEST", 400);
    }

    return errorResponse("Current weather failed.", "CURRENT_WEATHER_FAILED", 502);
  }
}

