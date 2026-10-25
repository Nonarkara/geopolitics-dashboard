import { NextResponse } from "next/server";
import { getErrorMessage } from "../../../lib/errors";
import type { FireEvent } from "../../../types/dashboard";

/**
 * GET /api/fires
 *
 * NASA FIRMS thermal hotspots for Thailand + border box.
 * Prefer keyed area API when FIRMS_KEY is set; else open SEA CSV.
 * Never silently paint mock as live — empty array + X-Data-Source headers.
 */

const FIRMS_CSV_URL =
  "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_SouthEast_Asia_24h.csv";

const LAT_MIN = 5.0;
const LAT_MAX = 21.0;
const LON_MIN = 96.5;
const LON_MAX = 106.5;

let firmsCache: {
  data: FireEvent[];
  cachedAt: number;
  source: "firms-area" | "firms-csv";
} | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

function parseFirmsCsv(csv: string): FireEvent[] {
  const lines = csv.split("\n");
  if (lines.length < 2) return [];

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

    if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) {
      continue;
    }

    const brightness = brightIdx >= 0 ? parseFloat(cols[brightIdx]) || 0 : 0;
    const confidence = confIdx >= 0 ? cols[confIdx] || "nominal" : "nominal";
    const acqDate =
      dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().slice(0, 10);
    const acqTime = timeIdx >= 0 ? cols[timeIdx] : "0000";
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

  return fires;
}

async function fetchFirmsArea(mapKey: string): Promise<FireEvent[]> {
  // west,south,east,north / 1-day VIIRS NRT
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(mapKey)}/VIIRS_SNPP_NRT/${LON_MIN},${LAT_MIN},${LON_MAX},${LAT_MAX}/1`;
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) {
    throw new Error(`FIRMS area API failed: ${response.status}`);
  }
  return parseFirmsCsv(await response.text());
}

async function fetchFirmsCsv(): Promise<FireEvent[]> {
  const response = await fetch(FIRMS_CSV_URL, {
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`FIRMS CSV failed: ${response.status}`);
  }
  return parseFirmsCsv(await response.text());
}

async function fetchNasaFirms(): Promise<{
  data: FireEvent[];
  source: "firms-area" | "firms-csv";
}> {
  if (firmsCache && Date.now() - firmsCache.cachedAt < CACHE_TTL_MS) {
    return { data: firmsCache.data, source: firmsCache.source };
  }

  const mapKey = process.env.FIRMS_KEY?.trim();
  let data: FireEvent[] = [];
  let source: "firms-area" | "firms-csv" = "firms-csv";

  if (mapKey) {
    try {
      data = await fetchFirmsArea(mapKey);
      source = "firms-area";
    } catch {
      data = await fetchFirmsCsv();
      source = "firms-csv";
    }
  } else {
    data = await fetchFirmsCsv();
    source = "firms-csv";
  }

  firmsCache = { data, cachedAt: Date.now(), source };
  return { data, source };
}

export async function GET() {
  try {
    const { data: fires, source } = await fetchNasaFirms();
    const generatedAt = new Date().toISOString();

    return NextResponse.json(fires, {
      headers: {
        "X-Data-Source": "live",
        "X-Data-Tier": source,
        "X-Data-Age": generatedAt,
        "X-Fire-Count": String(fires.length),
      },
    });
  } catch (error: unknown) {
    console.error("FIRMS fetch error:", getErrorMessage(error));
    return NextResponse.json([], {
      status: 200,
      headers: {
        "X-Data-Source": "unavailable",
        "X-Mock-Reason": "fetch-error",
        "X-Error": getErrorMessage(error).slice(0, 120),
      },
    });
  }
}
