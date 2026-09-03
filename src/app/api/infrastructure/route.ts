/**
 * Static infrastructure layers — GeoJSON feed for the Mapbox layers
 * in BorderMap.tsx.
 *
 * Bbox is required. We do not return the full 700+ features worldwide on
 * a single request because the Mapbox layer evaluates them client-side
 * on every pan. Forcing a bbox keeps the layer under 100 features
 * per viewport, which is the threshold where browser paint stays smooth.
 *
 * Kinds: dams, datacenters, cables_osm, natural_earth_regions
 * (see docs/DATA_SOURCES.md for license per kind).
 *
 * Response is a GeoJSON FeatureCollection where each feature's
 * `properties.kind` echoes the kind filter so the client can style
 * different layer types independently if it ever renders more than one.
 */

import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "../../../lib/db";
import { logFeedHealth } from "../../../lib/supabase";

export const revalidate = 3600; // 1 hour — bundled static datasets, infrequent changes

interface InfraRow {
  id: number;
  kind: string;
  osm_id: number | null;
  name: string;
  country: string | null;
  properties: Record<string, unknown>;
  geom_geojson: unknown;
  source: string;
  source_license: string;
}

const ALLOWED_KINDS = new Set([
  "dams",
  "datacenters",
  "cables_osm",
  "natural_earth_regions",
]);

// Bbox validation: exactly 4 comma-separated floats in WGS84 order
// (minLon, minLat, maxLon, maxLat). We reject silently malformed boxes
// so the map client gets a clear 400 instead of an empty FeatureCollection.
function parseBbox(raw: string | null): number[] | null {
  if (!raw) return null;
  const parts = raw.split(",").map((p) => Number.parseFloat(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [minLon, minLat, maxLon, maxLat] = parts;
  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) return null;
  if (minLon >= maxLon || minLat >= maxLat) return null;
  return parts;
}

export async function GET(request: NextRequest) {
  const t0 = Date.now();

  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { type: "FeatureCollection", features: [], source: "unavailable" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const kind = searchParams.get("kind") ?? "dams";
  const bbox = parseBbox(searchParams.get("bbox"));

  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json(
      { error: `kind must be one of: ${Array.from(ALLOWED_KINDS).join(", ")}` },
      { status: 400 },
    );
  }
  if (!bbox) {
    return NextResponse.json(
      { error: "bbox query param required as 'minLon,minLat,maxLon,maxLat' (WGS84)" },
      { status: 400 },
    );
  }

  const [minLon, minLat, maxLon, maxLat] = bbox;

  try {
    const result = await query<InfraRow>(
      `SELECT id, kind, osm_id, name, country, properties,
              ST_AsGeoJSON(geom)::jsonb AS geom_geojson,
              source, source_license
       FROM static_infrastructure
       WHERE kind = $1
         AND geom && ST_MakeEnvelope($2, $3, $4, $5, 4326)
       ORDER BY name
       LIMIT 500`,
      [kind, minLon, minLat, maxLon, maxLat],
    );

    const features = result.rows.map((row) => ({
      type: "Feature" as const,
      id: row.id,
      geometry: row.geom_geojson,
      properties: {
        ...row.properties,
        // Promote these to first-class properties so the Mapbox layer's
        // feature-state and the legend can read them without parsing the
        // raw OSM tags.
        name: row.name,
        country: row.country,
        kind: row.kind,
        osm_id: row.osm_id,
        source: row.source,
        source_license: row.source_license,
      },
    }));

    void logFeedHealth({
      feed_id: `infrastructure-${kind}`,
      status: "ok",
      response_time_ms: Date.now() - t0,
      message: null,
    });

    return NextResponse.json({
      type: "FeatureCollection",
      features,
      total: features.length,
      query: { kind, bbox },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    void logFeedHealth({
      feed_id: `infrastructure-${kind}`,
      status: "error",
      response_time_ms: Date.now() - t0,
      message: error instanceof Error ? error.message : "query failed",
    });
    return NextResponse.json(
      { type: "FeatureCollection", features: [], source: "error" },
      { status: 500 },
    );
  }
}
