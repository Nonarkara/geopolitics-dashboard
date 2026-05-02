export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "../../../../lib/db";

export const revalidate = 300; // 5 minutes

/**
 * GET /api/research/sparklines
 *
 * Returns historical values for sparkline micro-charts.
 *
 * Query params:
 *   metric   - "USD/THB", "BTC/USD", "MYR/THB", "SGD/THB" (market_data)
 *            - "score:myanmar-frontier", "score:cambodia-frontier" (signal_archive political)
 *            - "aqi:Bangkok", "aqi:Phuket Town" (air_quality_snapshots)
 *            - "signals:myanmar-frontier" (daily signal counts)
 *   days     - lookback window (default 30, max 90)
 */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ values: [], metric: "", days: 0 });
  }

  const { searchParams } = request.nextUrl;
  const metric = searchParams.get("metric") ?? "";
  const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10) || 30, 90);

  try {
    let values: number[] = [];

    if (metric.startsWith("score:")) {
      // Historical posture scores from archived briefs
      const region = metric.slice(6);
      const result = await query<{ score: number }>(
        `SELECT (payload->>'score')::float * 100 AS score
         FROM signal_archive
         WHERE signal_type = 'political'
           AND source_provider = 'border-command-engine'
           AND region = $1
           AND published_at >= NOW() - ($2 || ' days')::interval
         ORDER BY published_at ASC
         LIMIT $2`,
        [region, days],
      );
      values = result.rows.map((r) => r.score);
    } else if (metric.startsWith("aqi:")) {
      // Air quality history
      const location = metric.slice(4);
      const result = await query<{ aqi: number }>(
        `SELECT aqi FROM air_quality_snapshots
         WHERE location = $1
           AND observed_at >= NOW() - ($2 || ' days')::interval
         ORDER BY observed_at ASC`,
        [location, days],
      );
      values = result.rows.map((r) => r.aqi);
    } else if (metric.startsWith("signals:")) {
      // Daily signal count for a region
      const region = metric.slice(8);
      const result = await query<{ cnt: number }>(
        `SELECT signal_count AS cnt FROM signal_daily_summary
         WHERE region = $1
           AND summary_date >= CURRENT_DATE - $2
         ORDER BY summary_date ASC`,
        [region, days],
      );
      values = result.rows.map((r) => r.cnt);
    } else {
      // Market indicator by name
      const result = await query<{ value: number }>(
        `SELECT value FROM market_data
         WHERE indicator = $1
         ORDER BY ref_date DESC, created_at DESC
         LIMIT $2`,
        [metric, days],
      );
      values = result.rows.map((r) => r.value).reverse(); // oldest first for sparkline
    }

    return NextResponse.json({ values, metric, days });
  } catch {
    return NextResponse.json({ values: [], metric, days });
  }
}
