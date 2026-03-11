import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import { fallbackIncidents } from "@/lib/mock-data";
import {
  buildReferenceIncidentFeatures,
  fetchReferenceReports,
} from "@/lib/reference-data";
import type { IncidentFeature } from "@/types/dashboard";

interface IncidentRow {
  id: string;
  type: string | null;
  notes: string | null;
  fatalities: number | null;
  lng: number | null;
  lat: number | null;
  location: string | null;
  event_date: string | null;
}

export async function GET() {
  try {
    const referenceReports = await fetchReferenceReports();
    const incidents = buildReferenceIncidentFeatures(referenceReports);

    if (incidents.length > 0) {
      return NextResponse.json(incidents);
    }
  } catch (error: unknown) {
    console.error("Reference incident error:", getErrorMessage(error));
  }

  try {
    const res = await query<IncidentRow>(`
      SELECT
        external_id as id,
        event_type as type,
        notes,
        fatalities,
        ST_X(geom) as lng,
        ST_Y(geom) as lat,
        location,
        event_date
      FROM events
      WHERE geom IS NOT NULL
      ORDER BY event_date DESC
      LIMIT 100
    `);

    const incidents: IncidentFeature[] = res.rows
      .filter((row) => row.lng !== null && row.lat !== null)
      .map((row) => ({
        id: row.id,
        geometry: { coordinates: [row.lng ?? 0, row.lat ?? 0] },
        properties: {
          title: row.type ?? "Unclassified incident",
          type: row.type ?? "Unclassified incident",
          fatalities: row.fatalities ?? 0,
          notes: row.notes ?? "No incident narrative available.",
          location: row.location ?? "Unspecified location",
          eventDate: row.event_date ?? "",
        },
      }));

    return NextResponse.json(incidents.length > 0 ? incidents : fallbackIncidents);
  } catch (error: unknown) {
    console.error("Database query error:", getErrorMessage(error));
    return NextResponse.json(fallbackIncidents, { status: 200 });
  }
}
