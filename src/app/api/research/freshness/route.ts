export const runtime = 'edge';

import { NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "../../../../lib/db";

/**
 * GET /api/research/freshness
 *
 * Returns data freshness status for all tables using the database function.
 * Useful for monitoring data pipeline health and staleness.
 */
export async function GET() {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ datasets: [], source: "unavailable" });
  }

  try {
    const result = await query<{
      table_name: string;
      row_count: number;
      latest_entry: string;
      staleness_hours: number;
      status: string;
    }>(`SELECT * FROM fn_data_freshness()`);

    return NextResponse.json({
      datasets: result.rows,
      checkedAt: new Date().toISOString(),
      source: "database_function",
    });
  } catch {
    return NextResponse.json({ datasets: [], source: "error" });
  }
}
