
import { NextResponse } from "next/server";
import { loadBorderIncidents } from "../../../../lib/border-osint";

export async function GET() {
  const incidents = await loadBorderIncidents();

  return NextResponse.json(incidents, {
    headers: {
      "X-Data-Source": incidents.length > 0 ? "live" : "unavailable",
      "X-Data-Tier": "database-filtered",
    },
  });
}
