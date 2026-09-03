
import { NextResponse } from "next/server";
import { loadThailandIncidents } from "../../../lib/thailand-monitor";
import { fallbackIncidents } from "../../../lib/mock-data";

export async function GET() {
  const data = await loadThailandIncidents();
  // loadThailandIncidents() returns the fallbackIncidents reference on the
  // DB-error path. Fabricated records must never leave this boundary: fail
  // closed with an empty payload and an honest header instead.
  const isMock = data === fallbackIncidents;
  return NextResponse.json(isMock ? [] : data, {
    headers: {
      "X-Data-Source": !isMock && data.length > 0 ? "live" : "unavailable",
    },
  });
}
