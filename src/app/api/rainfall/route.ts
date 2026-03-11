import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import { fallbackRainfall } from "@/lib/mock-data";
import type { RainfallPoint } from "@/types/dashboard";

interface RainfallRow {
  location: string;
  value: number;
  unit: string | null;
  ref_date: string;
}

const locationCoords: Record<string, { lat: number; lng: number }> = {
  "Mae Sot": { lat: 16.71, lng: 98.56 },
  Tak: { lat: 16.88, lng: 99.12 },
  Kanchanaburi: { lat: 14.02, lng: 99.53 },
  "Mae Sariang": { lat: 18.16, lng: 97.93 },
};

export async function GET() {
  try {
    const res = await query<RainfallRow>(`
      SELECT
          location,
          value,
          unit,
          ref_date
      FROM rainfall_data
      ORDER BY ref_date DESC
      LIMIT 100
    `);

    const rainfall: RainfallPoint[] = res.rows.map((row) => {
      const coords = locationCoords[row.location] || { lat: 15, lng: 100 };
      return {
        lat: coords.lat,
        lng: coords.lng,
        value: row.value,
        label: row.location,
      };
    });

    return NextResponse.json(rainfall.length > 0 ? rainfall : fallbackRainfall);
  } catch (error: unknown) {
    console.error("Rainfall query error:", getErrorMessage(error));
    return NextResponse.json(fallbackRainfall, { status: 200 });
  }
}
