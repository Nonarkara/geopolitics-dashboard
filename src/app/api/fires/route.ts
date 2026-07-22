
import { NextResponse } from "next/server";
import { fallbackFires } from "../../../lib/mock-data";
import { getErrorMessage } from "../../../lib/errors";
import type { FireEvent } from "../../../types/dashboard";

/**
 * GET /api/fires
 *
 * Returns fire hotspots for Thailand and border regions.
 * Primary source: NASA FIRMS open CSV (no API key required).
 * Fallback: enriched mock data from mock-data.ts.
 */

const FIRMS_CSV_URL =
  "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_SouthEast_Asia_24h.csv";

// Thailand + border region bounds
const LAT_MIN = 5.0;
const LAT_MAX = 21.0;
const LON_MIN = 96.5;
const LON_MAX = 106.5;

// In-memory cache (15 minutes)
let firmsCache: { data: FireEvent[]; cachedAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

async function fetchNasaFirms(): Promise<FireEvent[]> {
  // Return cache if fresh
  if (firmsCache && Date.now() - firmsCache.cachedAt < CACHE_TTL_MS) {
    return firmsCache.data;
  }

  const response = await fetch(FIRMS_CSV_URL, {
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`FIRMS fetch failed: ${response.status}`);
  }

  const csv = await response.text();
  const lines = csv.split("\n");

  if (lines.length < 2) {
    throw new Error("FIRMS CSV has no data rows");
  }

  // Parse header to find column indices
  const header = lines[0].split(",");
  const latIdx = header.indexOf("latitude");
  const lonIdx = header.indexOf("longitude");
  const brightIdx = header.indexOf("bright_ti4");
  const confIdx = header.indexOf("confidence");
  const dateIdx = header.indexOf("acq_date");
  const timeIdx = header.indexOf("acq_time");

  if (latIdx < 0 || lonIdx < 0) {
    throw new Error("FIRMS CSV missing lat/lon columns");
  }

  const fires: FireEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",");
    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);

    // Filter to Thailand + border region
    if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) {
      continue;
    }

    const brightness = brightIdx >= 0 ? parseFloat(cols[brightIdx]) || 0 : 0;
    const confidence = confIdx >= 0 ? (cols[confIdx] || "nominal") : "nominal";
    const acqDate = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().slice(0, 10);
    const acqTime = timeIdx >= 0 ? cols[timeIdx] : "0000";

    // Build ISO timestamp from acq_date (YYYY-MM-DD) and acq_time (HHMM)
    const hh = acqTime.slice(0, 2).padStart(2, "0");
    const mm = acqTime.slice(2, 4).padStart(2, "0");

    fires.push({
      latitude: lat,
      longitude: lon,
      brightness,
      confidence,
      acq_date: `${acqDate}T${hh}:${mm}:00.000Z`,
    });
  }

  // Cache the result
  firmsCache = { data: fires, cachedAt: Date.now() };
  return fires;
}

export async function GET() {
  try {
    const fires = await fetchNasaFirms();

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
    console.error("FIRMS fetch error:", getErrorMessage(error));
    return NextResponse.json(fallbackFires, {
      status: 200,
      headers: { "X-Data-Source": "mock", "X-Mock-Reason": "fetch-error" },
    });
  }
}
