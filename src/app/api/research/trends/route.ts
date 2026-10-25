
import { NextRequest, NextResponse } from "next/server";
import { queryTrends } from "../../../../lib/signal-archive";
import { researchAnalysisDeps, researchUnavailable } from "../../../../lib/research-analysis";

/**
 * GET /api/research/trends
 *
 * Query daily signal summaries for trend visualization.
 * Returns pre-aggregated counts, severity averages, and keyword trends per region/type.
 *
 * Query params:
 *   region  - myanmar-frontier | cambodia-frontier | malaysia-frontier | general
 *   from    - ISO date (e.g. 2025-01-01)
 *   to      - ISO date (e.g. 2025-12-31)
 */
export async function GET(request: NextRequest) {
  if (!researchAnalysisDeps.isDatabaseConfigured()) return researchUnavailable({ trends: [], total: null });
  const { searchParams } = request.nextUrl;
  try {
    const trends = await queryTrends({
      region: searchParams.get("region") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    return NextResponse.json({
      trends,
      total: trends.length,
      query: {
        region: searchParams.get("region"),
        from: searchParams.get("from"),
        to: searchParams.get("to"),
      },
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return researchUnavailable({ trends: [], total: null });
  }
}
