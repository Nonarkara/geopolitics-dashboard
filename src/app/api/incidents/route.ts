
import { NextResponse } from "next/server";
import { loadThailandIncidents } from "../../../lib/thailand-monitor";
import { fallbackIncidents } from "../../../lib/mock-data";

export async function GET() {
  const data = await loadThailandIncidents();
  // loadThailandIncidents() returns the fallbackIncidents reference on both the
  // empty-rows and DB-error paths, so reference equality tells us the response
  // is fabricated. Mark it at the API boundary so a caller (or a screenshot
  // consumer) can never mistake mock records for real observations.
  const isMock = data === fallbackIncidents;
  return NextResponse.json(data, {
    headers: { "X-Data-Source": isMock ? "mock" : "live" },
  });
}
