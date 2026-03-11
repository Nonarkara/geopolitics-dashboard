import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import { fallbackRefugees } from "@/lib/mock-data";
import type { RefugeeMovement } from "@/types/dashboard";

interface RefugeeMovementRow {
  origin_country: string;
  asylum_country: string;
  count: number;
  ref_year: number;
}

const coordinationMap: Record<string, [number, number]> = {
  Myanmar: [98.5, 16.7],
  Thailand: [100.5, 13.7],
  Cambodia: [104.2, 12.5],
  Laos: [102.6, 18.0],
};

export async function GET() {
  try {
    const res = await query<RefugeeMovementRow>(`
      SELECT
          origin_country,
          asylum_country,
          count,
          ref_year
      FROM population_movements
      ORDER BY ref_year DESC
      LIMIT 50
    `);

    const movements: RefugeeMovement[] = res.rows.map((row) => ({
      source: coordinationMap[row.origin_country] || [98, 18],
      target: coordinationMap[row.asylum_country] || [100, 14],
      count: row.count,
      label: `${row.count.toLocaleString()} from ${row.origin_country}`,
    }));

    return NextResponse.json(movements.length > 0 ? movements : fallbackRefugees);
  } catch (error: unknown) {
    console.error("Refugee query error:", getErrorMessage(error));
    return NextResponse.json(fallbackRefugees, { status: 200 });
  }
}
