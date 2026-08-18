import { NextResponse } from "next/server";
import { errorResponse, parseDateRange, parseLocationFromSearchParams } from "@/lib/api-utils";
import { getWeatherHistory } from "@/lib/getWeatherHistory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = parseLocationFromSearchParams(searchParams);
    const range = parseDateRange(searchParams);
    const history = await getWeatherHistory(location, range.start, range.end);

    return NextResponse.json(history);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, "INVALID_HISTORY_REQUEST", 400);
    }

    return errorResponse("Historical weather failed.", "HISTORY_FAILED", 502);
  }
}

