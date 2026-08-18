import { NextResponse } from "next/server";
import { errorResponse, parseDateRange, parseLocationFromSearchParams } from "@/lib/api-utils";
import { getWeatherHistory } from "@/lib/getWeatherHistory";
import { buildAnalysisResponse } from "@/lib/statistics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = parseLocationFromSearchParams(searchParams);
    const range = parseDateRange(searchParams);
    const history = await getWeatherHistory(location, range.start, range.end);

    return NextResponse.json(
      buildAnalysisResponse({
        location: history.location,
        range: history.range,
        source: history.source,
        partial: history.partial,
        records: history.records,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, "INVALID_ANALYSIS_REQUEST", 400);
    }

    return errorResponse("Analysis failed.", "ANALYSIS_FAILED", 502);
  }
}

