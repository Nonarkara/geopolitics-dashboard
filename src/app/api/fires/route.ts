
import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
import { getErrorMessage } from "../../../lib/errors";
import { fallbackFires } from "../../../lib/mock-data";
import type { FireEvent } from "../../../types/dashboard";

interface FireEventRow {
  latitude: number;
  longitude: number;
  brightness: number | null;
  confidence: string | null;
  acq_date: string;
}

export async function GET() {
  try {
    const res = await query<FireEventRow>(`
      SELECT
          latitude,
          longitude,
          brightness,
          confidence,
          acq_date
      FROM fire_events
      WHERE acq_date >= NOW() - INTERVAL '7 days'
      ORDER BY acq_date DESC
      LIMIT 200
    `);

    const fires: FireEvent[] = res.rows.map((row) => ({
      latitude: row.latitude,
      longitude: row.longitude,
      brightness: row.brightness ?? 0,
      confidence: row.confidence ?? "unknown",
      acq_date: row.acq_date,
    }));

    if (fires.length > 0) {
      return NextResponse.json(fires, {
        headers: { "X-Data-Source": "live" },
      });
    }
    // Zero rows is a legitimate empty result, but we substitute mock data so
    // the map is never blank — mark it so a caller can tell it apart from real.
    return NextResponse.json(fallbackFires, {
      headers: { "X-Data-Source": "mock", "X-Mock-Reason": "no-rows" },
    });
  } catch (error: unknown) {
    console.error("Fire query error:", getErrorMessage(error));
    return NextResponse.json(fallbackFires, {
      status: 200,
      headers: { "X-Data-Source": "mock", "X-Mock-Reason": "db-error" },
    });
  }
}
