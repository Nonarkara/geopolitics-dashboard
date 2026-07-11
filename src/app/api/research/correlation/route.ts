
import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "../../../../lib/db";

/**
 * GET /api/research/correlation
 *
 * Finds co-occurring signal activity across regions to identify
 * cross-border conflict spillover and correlated escalation patterns.
 *
 * Query params:
 *   days        - lookback window (default 30, max 365)
 *   min_overlap - minimum co-occurring days to report (default 3)
 */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ correlations: [], source: "unavailable" });
  }

  const { searchParams } = request.nextUrl;
  const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10) || 30, 365);
  const minOverlap = parseInt(searchParams.get("min_overlap") ?? "3", 10) || 3;

  try {
    // Try the database function first
    const result = await query<{
      region_a: string;
      region_b: string;
      co_occurring_days: number;
      shared_signal_types: string[];
      correlation_strength: number;
    }>(
      `SELECT * FROM fn_signal_correlation($1, $2)`,
      [days, minOverlap],
    );

    return NextResponse.json({
      correlations: result.rows,
      params: { days, minOverlap },
      source: "database_function",
    });
  } catch {
    // Fall back to inline query if function not available
    try {
      const result = await query<{
        region_a: string;
        region_b: string;
        co_occurring_days: number;
      }>(`
        WITH daily_activity AS (
          SELECT
            COALESCE(region, 'general') AS region,
            published_at::date AS day
          FROM signal_archive
          WHERE published_at >= NOW() - ($1 || ' days')::interval
          GROUP BY 1, 2
        )
        SELECT
          a.region AS region_a,
          b.region AS region_b,
          COUNT(*)::int AS co_occurring_days
        FROM daily_activity a
        JOIN daily_activity b ON a.day = b.day AND a.region < b.region
        GROUP BY a.region, b.region
        HAVING COUNT(*) >= $2
        ORDER BY co_occurring_days DESC
      `, [days, minOverlap]);

      return NextResponse.json({
        correlations: result.rows,
        params: { days, minOverlap },
        source: "live_query",
      });
    } catch {
      return NextResponse.json({ correlations: [], source: "error" });
    }
  }
}
