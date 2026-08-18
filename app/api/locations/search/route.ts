import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";
import { searchLocations } from "@/lib/openMeteo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const countParam = searchParams.get("count");
    const count = countParam ? Number(countParam) : 5;

    if (query.length < 2 || query.length > 100) {
      return errorResponse("Search query must be between 2 and 100 characters.", "INVALID_QUERY", 400);
    }

    if (!Number.isFinite(count) || count < 1 || count > 10) {
      return errorResponse("Count must be between 1 and 10.", "INVALID_COUNT", 400);
    }

    const results = await searchLocations(query, count);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof Error && "status" in error && "code" in error) {
      const upstream = error as Error & { status?: number; code?: string };
      return errorResponse(error.message, upstream.code ?? "UPSTREAM_ERROR", upstream.status ?? 502);
    }

    return errorResponse("Location search failed.", "LOCATION_SEARCH_FAILED", 502);
  }
}

