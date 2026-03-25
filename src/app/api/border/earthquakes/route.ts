import { NextResponse } from "next/server";
import { logFeedHealth } from "../../../../lib/supabase";
import { archiveSignalBatch, type ArchiveSignal } from "../../../../lib/signal-archive";

export const revalidate = 300;

export interface SeismicEvent {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lng: number;
  depth: number;
  time: string;
  url: string;
}

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface USGSResponse {
  type: string;
  features: USGSFeature[];
}

const SE_ASIA_BOUNDS = {
  minlatitude: 4,
  maxlatitude: 24,
  minlongitude: 92,
  maxlongitude: 110,
};

const FALLBACK: SeismicEvent[] = [];

export async function GET() {
  const t0 = Date.now();
  try {
    const params = new URLSearchParams({
      format: "geojson",
      starttime: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      minmagnitude: "3.0",
      minlatitude: String(SE_ASIA_BOUNDS.minlatitude),
      maxlatitude: String(SE_ASIA_BOUNDS.maxlatitude),
      minlongitude: String(SE_ASIA_BOUNDS.minlongitude),
      maxlongitude: String(SE_ASIA_BOUNDS.maxlongitude),
      orderby: "time",
      limit: "20",
    });

    const res = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      void logFeedHealth({ feed_id: "earthquakes", status: "error", response_time_ms: Date.now() - t0, message: `HTTP ${res.status}` });
      return NextResponse.json(FALLBACK);
    }

    const json: USGSResponse = await res.json();

    const events: SeismicEvent[] = json.features.map((f) => ({
      id: f.id,
      magnitude: f.properties.mag,
      place: f.properties.place,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2],
      time: new Date(f.properties.time).toISOString(),
      url: f.properties.url,
    }));

    void logFeedHealth({ feed_id: "earthquakes", status: "ok", response_time_ms: Date.now() - t0, message: null });

    // Archive seismic signals (non-blocking)
    void archiveSignalBatch(events.map((e): ArchiveSignal => ({
      external_id: e.id,
      signal_type: "seismic",
      source_provider: "usgs",
      source_url: e.url,
      title: `M${e.magnitude.toFixed(1)} — ${e.place}`,
      summary: `Depth ${e.depth}km`,
      url: e.url,
      published_at: e.time,
      severity: e.magnitude >= 5 ? "alert" : e.magnitude >= 4 ? "watch" : "stable",
      lat: e.lat,
      lng: e.lng,
    })));

    return NextResponse.json(events);
  } catch {
    void logFeedHealth({ feed_id: "earthquakes", status: "error", response_time_ms: Date.now() - t0, message: "fetch failed" });
    return NextResponse.json(FALLBACK);
  }
}
