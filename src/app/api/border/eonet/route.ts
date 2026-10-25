import { NextResponse, type NextRequest } from "next/server";
import { archiveSignalBatch, type ArchiveSignal } from "../../../../lib/signal-archive";
import { logFeedHealth } from "../../../../lib/supabase";
import type { EonetEvent } from "../../../../types/dashboard";

/**
 * GET /api/border/eonet
 *
 * NASA EONET (Earth Observatory Natural Event Tracker) — the open JSON
 * aggregator that links every natural event to its source agency.
 *
 * One feed, 32 source agencies: CEMS, NASA_DISP, NASA_ESRS, NASA_HURR,
 * HDDS (USGS Hazards Data Distribution), USGS_EHP, IDC (International
 * Charter on Space and Major Disasters), GLIDE, ReliefWeb, SIVolcano,
 * PDC, GDACS, NOAA_NHC, NOAA_CPC, FEMA, JTWC, IRWIN, FloodList, MRR
 * (LANCE Rapid Response), AVO, BCWILDFIRE, CALFIRE, MBFIRE, ABFIRE,
 * DFES_WA, BYU_ICE, NATICE, InciWeb, UNISYS, Earthdata, EO, and more.
 *
 * Keyless, CORS-friendly, single GET.
 *
 * Query params:
 *   ?days=90         lookback window in days (default 90, max 365)
 *   ?status=open     status filter (default open, pass closed/all)
 *   ?source=CEMS     single source ID filter (32 options)
 *   ?category=wildfires  single category filter (15 options)
 *   ?bbox=92,4,110,24   client-side bbox filter (south-east asia default)
 *
 * NOTE on bbox: EONET's server-side bbox filter returns sparse results
 * for SE Asia (verified 0 hits in 30d, 1 hit in 90d) because most events
 * in the region are tracked by partner agencies that publish slowly.
 * We apply the bbox on the client side, not server side, so we still
 * surface 30-day storms + 90-day fires even when the upstream query
 * comes back empty for our region. Don't try to "optimize" by pushing
 * the bbox to EONET's query string — you'll silently drop data.
 */

export const revalidate = 1800; // 30 min

const EONET_BASE = "https://eonet.gsfc.nasa.gov/api/v3/events";

const DEFAULT_BBOX = { minLat: 4, maxLat: 24, minLng: 92, maxLng: 110 };
const MAX_LIMIT = 200;
const DEFAULT_DAYS = 90;
const MAX_DAYS = 365;

interface EonetGeometry {
  magnitudeValue?: number;
  magnitudeUnit?: string;
  date: string;
  type: "Point" | "Polygon";
  coordinates: number[] | number[][];
}

interface EonetSource {
  id: string;
  url?: string;
}

interface EonetCategory {
  id: string;
  title: string;
}

interface EonetRawEvent {
  id: string;
  title: string;
  description?: string | null;
  link: string;
  closed?: string | null;
  categories: EonetCategory[];
  sources: EonetSource[];
  geometry: EonetGeometry[];
}

interface EonetResponse {
  events: EonetRawEvent[];
}

const CATEGORY_FALLBACK_TITLE: Record<string, string> = {
  drought: "Drought",
  dustHaze: "Dust and Haze",
  earthquakes: "Earthquake",
  floods: "Flood",
  icebergs: "Iceberg",
  landslides: "Landslide",
  manmade: "Man-made",
  seaLakeIce: "Sea and Lake Ice",
  severeStorms: "Severe Storm",
  snow: "Snow",
  temperatureExtremes: "Temperature Extreme",
  volcanoes: "Volcano",
  waterColor: "Water Color",
  wildfires: "Wildfire",
};

function parseBbox(raw: string | null) {
  if (!raw) return DEFAULT_BBOX;
  const parts = raw.split(",").map((v) => parseFloat(v.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return DEFAULT_BBOX;
  }
  const [minLng, minLat, maxLng, maxLat] = parts;
  return { minLat, maxLat, minLng, maxLng };
}

function pointOf(geom: EonetGeometry): { lat: number; lng: number } | null {
  if (geom.type !== "Point" || !Array.isArray(geom.coordinates)) return null;
  const coords = geom.coordinates as number[];
  const [lng, lat] = coords;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
  return { lat, lng };
}

function latestGeometry(geoms: EonetGeometry[]): EonetGeometry | null {
  if (!geoms || geoms.length === 0) return null;
  // EONET geometry is newest-first, but be defensive.
  const sorted = [...geoms].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return sorted[0];
}

function normalizeEvent(
  raw: EonetRawEvent,
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
): EonetEvent | null {
  const latest = latestGeometry(raw.geometry);
  if (!latest) return null;
  const point = pointOf(latest);
  if (!point) return null;

  if (
    point.lat < bbox.minLat ||
    point.lat > bbox.maxLat ||
    point.lng < bbox.minLng ||
    point.lng > bbox.maxLng
  ) {
    return null;
  }

  const categoryId = raw.categories?.[0]?.id ?? "unknown";
  const categoryTitle =
    raw.categories?.[0]?.title ?? CATEGORY_FALLBACK_TITLE[categoryId] ?? categoryId;

  const sources = (raw.sources ?? []).map((s) => s.id).filter(Boolean);
  const sourceUrls: Record<string, string> = {};
  for (const s of raw.sources ?? []) {
    if (s.id && s.url) sourceUrls[s.id] = s.url;
  }

  return {
    id: raw.id,
    title: raw.title,
    category: categoryId,
    categoryTitle,
    sources,
    sourceUrls,
    lat: point.lat,
    lng: point.lng,
    date: latest.date,
    closed: raw.closed ?? null,
    magnitudeValue: latest.magnitudeValue ?? null,
    magnitudeUnit: latest.magnitudeUnit ?? null,
    link: raw.link,
  };
}

const FALLBACK: EonetEvent[] = [];

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  try {
    const sp = request.nextUrl.searchParams;
    const days = Math.max(
      1,
      Math.min(parseInt(sp.get("days") ?? `${DEFAULT_DAYS}`, 10) || DEFAULT_DAYS, MAX_DAYS),
    );
    const status = sp.get("status") ?? "open";
    const source = sp.get("source")?.trim();
    const category = sp.get("category")?.trim();
    const bbox = parseBbox(sp.get("bbox"));

    const params = new URLSearchParams({
      days: `${days}`,
      status,
      limit: `${MAX_LIMIT}`,
    });
    if (source) params.set("source", source);
    if (category) params.set("category", category);

    const url = `${EONET_BASE}?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      void logFeedHealth({
        feed_id: "eonet",
        status: "error",
        response_time_ms: Date.now() - t0,
        message: `HTTP ${res.status}`,
      });
      return NextResponse.json(FALLBACK, {
        headers: {
          "X-Data-Source": "unavailable",
          "X-Data-Tier": "eonet",
          "X-Error": `upstream-${res.status}`,
        },
      });
    }

    const json = (await res.json()) as EonetResponse;
    const rawEvents = Array.isArray(json.events) ? json.events : [];

    const events: EonetEvent[] = rawEvents
      .map((e) => normalizeEvent(e, bbox))
      .filter((e): e is EonetEvent => e !== null)
      .slice(0, 50);

    // Archive satellite-event signals for the time-machine / signal_archive
    // pipeline. Non-blocking. EONET is satellite-derived open-source intel
    // across 32 source agencies — map all categories to `osint` since the
    // canonical SignalType union (disaster/humanitarian/seismic) doesn't
    // cover "drought", "wildfire", "severe storm", etc. together.
    void archiveSignalBatch(
      events.map(
        (e): ArchiveSignal => ({
          external_id: e.id,
          signal_type: "osint",
          source_provider: e.sources[0] ?? "eonet",
          source_url: e.link,
          title: e.title,
          summary: `${e.categoryTitle} — sources: ${e.sources.join(", ") || "EONET"}`,
          published_at: e.date,
          severity: e.closed ? "stable" : "watch",
          lat: e.lat,
          lng: e.lng,
        }),
      ),
    );

    void logFeedHealth({
      feed_id: "eonet",
      status: "ok",
      response_time_ms: Date.now() - t0,
      message: `${events.length} events (${rawEvents.length} raw)`,
    });

    return NextResponse.json(events, {
      headers: {
        "X-Data-Source": "live",
        "X-Data-Tier": "eonet",
        "X-Data-Age": new Date().toISOString(),
        "X-Event-Count": String(events.length),
        "X-Source-Filter": source ?? "all",
      },
    });
  } catch (error) {
    void logFeedHealth({
      feed_id: "eonet",
      status: "error",
      response_time_ms: Date.now() - t0,
      message: error instanceof Error ? error.message.slice(0, 120) : "fetch failed",
    });
    return NextResponse.json(FALLBACK, {
      headers: {
        "X-Data-Source": "unavailable",
        "X-Data-Tier": "eonet",
        "X-Mock-Reason": "fetch-error",
        "X-Error": error instanceof Error ? error.message.slice(0, 120) : "unknown",
      },
    });
  }
}
