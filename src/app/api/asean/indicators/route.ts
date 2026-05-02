export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "../../../../lib/db";
import { logFeedHealth } from "../../../../lib/supabase";

export const revalidate = 3600; // 1 hour — economic data updates quarterly

interface IndicatorRow {
  country_code: string;
  country: string;
  indicator_code: string;
  indicator_label: string;
  value: number;
  unit: string | null;
  ref_year: number;
  source: string;
  captured_at: string;
}

export async function GET(request: NextRequest) {
  const t0 = Date.now();

  if (!isDatabaseConfigured) {
    return NextResponse.json({ indicators: [], source: "unavailable" });
  }

  const { searchParams } = request.nextUrl;
  const country = searchParams.get("country");
  const source = searchParams.get("source");
  const indicatorCode = searchParams.get("indicator");

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (country) {
    conditions.push(`country_code = $${idx++}`);
    values.push(country.toUpperCase());
  }
  if (source) {
    conditions.push(`source ILIKE $${idx++}`);
    values.push(`%${source}%`);
  }
  if (indicatorCode) {
    conditions.push(`indicator_code = $${idx++}`);
    values.push(indicatorCode);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    // Get the latest year per country+indicator combination
    const result = await query<IndicatorRow>(
      `SELECT DISTINCT ON (country_code, indicator_code)
              country_code, country, indicator_code, indicator_label,
              value, unit, ref_year, source, captured_at
       FROM country_economic_indicators
       ${where}
       ORDER BY country_code, indicator_code, ref_year DESC, captured_at DESC`,
      values,
    );

    void logFeedHealth({ feed_id: "asean-indicators", status: "ok", response_time_ms: Date.now() - t0, message: null });

    return NextResponse.json({
      indicators: result.rows,
      total: result.rows.length,
      query: { country, source, indicator: indicatorCode },
      generatedAt: new Date().toISOString(),
    });
  } catch {
    void logFeedHealth({ feed_id: "asean-indicators", status: "error", response_time_ms: Date.now() - t0, message: "query failed" });
    return NextResponse.json({ indicators: [], source: "error" });
  }
}
