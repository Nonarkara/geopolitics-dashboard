
import { NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "../../../../lib/db";

/**
 * GET /api/research/risk-profile
 *
 * Returns composite risk profiles per country from the materialized view.
 * Includes 30-day signal counts, fatalities, severity averages, and a
 * weighted composite risk index for longitudinal conflict tracking.
 */
export async function GET() {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ profiles: [], source: "unavailable" });
  }

  try {
    const result = await query<{
      country_code: string;
      signal_count_30d: number;
      fatalities_30d: number;
      avg_severity: number;
      high_severity_count: number;
      signal_diversity: number;
      avg_score: number;
      composite_risk_index: number;
      latest_signal_at: string;
      computed_at: string;
    }>(`SELECT * FROM mv_country_risk_profile ORDER BY composite_risk_index DESC`);

    return NextResponse.json({
      profiles: result.rows,
      source: "materialized_view",
      computedAt: result.rows[0]?.computed_at ?? null,
    });
  } catch {
    // Materialized view not yet created — fall back to live query
    try {
      const result = await query<{
        country_code: string;
        signal_count: number;
        fatalities: number;
        avg_severity: number;
      }>(`
        WITH country_signals AS (
          SELECT
            unnest(country_focus) AS country_code,
            severity,
            fatalities
          FROM signal_archive
          WHERE published_at >= NOW() - INTERVAL '30 days'
            AND country_focus != '{}'
        )
        SELECT
          country_code,
          COUNT(*)::int AS signal_count,
          COALESCE(SUM(fatalities), 0)::int AS fatalities,
          ROUND(AVG(CASE severity
            WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
            WHEN 'watch' THEN 2 WHEN 'stable' THEN 1 ELSE NULL
          END)::numeric, 2) AS avg_severity
        FROM country_signals
        GROUP BY country_code
        ORDER BY signal_count DESC
      `);

      return NextResponse.json({
        profiles: result.rows,
        source: "live_query",
      });
    } catch {
      return NextResponse.json({ profiles: [], source: "error" });
    }
  }
}
