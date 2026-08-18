import { NextResponse } from "next/server";
import { errorResponse, parseOptionalString } from "@/lib/api-utils";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ results: [] });
  }

  const { data, error } = await client
    .from("locations")
    .select("id,name,country,admin1,latitude,longitude")
    .order("name", { ascending: true });

  if (error) {
    return errorResponse("Locations could not be loaded.", "LOCATIONS_FAILED", 502);
  }

  return NextResponse.json({
    results: data ?? [],
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      country?: string;
      admin1?: string | null;
      latitude?: number;
      longitude?: number;
    };

    const name = parseOptionalString(body.name ?? null);
    const country = parseOptionalString(body.country ?? null);
    const admin1 = parseOptionalString(body.admin1 ?? null);

    if (!name || !country || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
      return errorResponse("A complete location payload is required.", "INVALID_LOCATION_PAYLOAD", 400);
    }

    const client = getSupabaseAdminClient();
    if (!client) {
      return NextResponse.json({ ok: true });
    }

    const { error } = await client.from("locations").upsert(
      {
        name,
        country,
        admin1,
        latitude: Number(body.latitude.toFixed(5)),
        longitude: Number(body.longitude.toFixed(5)),
      },
      {
        onConflict: "latitude,longitude",
      },
    );

    if (error) {
      return errorResponse("Location could not be saved.", "LOCATION_SAVE_FAILED", 502);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("Location could not be saved.", "LOCATION_SAVE_FAILED", 502);
  }
}

