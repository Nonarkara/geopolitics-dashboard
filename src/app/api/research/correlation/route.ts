
import { NextRequest, NextResponse } from "next/server";
import { parseIntegerParam } from "../../../../lib/http";
import {
  completeUtcWindow,
  sharedTypeDayOverlap,
  researchAnalysisDeps,
  researchUnavailable,
  type DailyResearchActivity,
} from "../../../../lib/research-analysis";

/**
 * GET /api/research/correlation
 *
 * Describes shared-type activity across complete UTC days.
 * Screening only: no causal or calibrated spillover inference.
 *
 * Query params:
 *   days        - lookback window (default 30, max 365)
 *   min_overlap - minimum co-occurring days to report (default 3)
 */
export async function GET(request: NextRequest) {
  if (!researchAnalysisDeps.isDatabaseConfigured()) {
    return researchUnavailable({ correlations: [] });
  }

  const { searchParams } = request.nextUrl;
  const days = parseIntegerParam(searchParams.get("days"), {
    defaultValue: 30,
    min: 1,
    max: 365,
  });
  const minOverlap = parseIntegerParam(searchParams.get("min_overlap"), {
    defaultValue: Math.min(3, days),
    min: 1,
    max: days,
  });
  const now = researchAnalysisDeps.now();
  const window = completeUtcWindow(days, now);

  try {
    // The legacy function counted shared types as days. Fetch daily activity
    // and use the same bounded calculation exercised by fixture tests.
    const result = await researchAnalysisDeps.query<DailyResearchActivity>(`
      SELECT COALESCE(region, 'general') AS region,
             to_char(published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
             array_agg(DISTINCT signal_type) AS types
      FROM signal_archive
      WHERE published_at >= $1::timestamptz AND published_at < $2::timestamptz
      GROUP BY 1, 2
      ORDER BY 2, 1
      LIMIT 10001
    `, [window.from, window.to]);

    return NextResponse.json({
      correlations: sharedTypeDayOverlap(result.rows, days, minOverlap, now),
      params: { days, minOverlap },
      window: {
        ...window,
        toExclusive: true,
        timezone: "UTC",
        includesToday: false,
      },
      method: {
        id: "shared-type-day-overlap-v1",
        unit: "distinct UTC days",
        formula: "shared-type active days / complete days in window",
        causal: false,
        calibratedProbability: false,
        maximumRegions: 25,
        maximumDailyRows: 10000,
      },
      source: "daily_activity_query",
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    // Retain no alternate calculation with different units on failure.
    return researchUnavailable({ correlations: [], params: { days, minOverlap }, window });
  }
}
