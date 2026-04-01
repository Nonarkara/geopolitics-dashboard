import { NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "../../../../lib/db";
import { logFeedHealth } from "../../../../lib/supabase";
import { archiveSignalBatch, type ArchiveSignal } from "../../../../lib/signal-archive";
import type { VesselPosition, VesselTrackingResponse } from "../../../../types/dashboard";

export const revalidate = 300; // 5 minutes

interface VesselRow {
  mmsi: string;
  vessel_name: string | null;
  ship_type: number | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  course: number | null;
  heading: number | null;
  destination: string | null;
  flag_country: string | null;
  observed_at: string;
}

const FALLBACK: VesselTrackingResponse = {
  generatedAt: new Date().toISOString(),
  vessels: [],
  vesselCount: 0,
};

export async function GET() {
  const t0 = Date.now();

  if (!isDatabaseConfigured) {
    return NextResponse.json(FALLBACK);
  }

  try {
    const result = await query<VesselRow>(
      `SELECT mmsi, vessel_name, ship_type, latitude, longitude,
              speed, course, heading, destination, flag_country, observed_at
       FROM vessel_positions
       WHERE observed_at >= NOW() - INTERVAL '30 minutes'
       ORDER BY observed_at DESC
       LIMIT 200`,
    );

    const vessels: VesselPosition[] = result.rows.map((row) => ({
      mmsi: row.mmsi,
      vesselName: row.vessel_name,
      shipType: row.ship_type,
      lat: row.latitude,
      lng: row.longitude,
      speed: row.speed,
      course: row.course,
      heading: row.heading,
      destination: row.destination,
      flagCountry: row.flag_country,
      observedAt: row.observed_at,
    }));

    // Archive vessel snapshot to signal_archive
    if (vessels.length > 0) {
      const hourKey = new Date().toISOString().slice(0, 13);
      const countByFlag: Record<string, number> = {};
      for (const v of vessels) {
        const flag = v.flagCountry ?? "unknown";
        countByFlag[flag] = (countByFlag[flag] ?? 0) + 1;
      }

      const signals: ArchiveSignal[] = [{
        external_id: `vessels-snapshot-${hourKey}`,
        signal_type: "maritime",
        source_provider: "aisstream",
        source_url: "https://aisstream.io",
        title: `Maritime snapshot: ${vessels.length} vessels tracked in Thai waters`,
        summary: Object.entries(countByFlag)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([flag, count]) => `${flag}: ${count}`)
          .join(", "),
        published_at: new Date().toISOString(),
        severity: "stable",
        score: Math.min(vessels.length / 200, 1),
        keywords: ["maritime", "ais", "vessels", ...Object.keys(countByFlag).map(f => f.toLowerCase())],
        payload: {
          type: "vessel_snapshot",
          totalVessels: vessels.length,
          countByFlag,
        },
      }];
      void archiveSignalBatch(signals);
    }

    void logFeedHealth({ feed_id: "aisstream", status: "ok", response_time_ms: Date.now() - t0, message: null });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      vessels,
      vesselCount: vessels.length,
    });
  } catch {
    void logFeedHealth({ feed_id: "aisstream", status: "error", response_time_ms: Date.now() - t0, message: "query failed" });
    return NextResponse.json(FALLBACK);
  }
}
