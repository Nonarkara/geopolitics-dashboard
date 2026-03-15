import { NextResponse } from "next/server";
import { fallbackTicker } from "../../../../lib/mock-data";
import {
  buildBorderTicker,
  loadBorderIncidents,
  loadBorderOsint,
} from "../../../../lib/border-osint";
import { loadThailandEconomics } from "../../../../lib/thailand-monitor";

export async function GET() {
  try {
    const [incidents, indicators, osint] = await Promise.all([
      loadBorderIncidents(),
      loadThailandEconomics(),
      loadBorderOsint(),
    ]);

    return NextResponse.json(buildBorderTicker(incidents, indicators, osint));
  } catch {
    return NextResponse.json(fallbackTicker, { status: 200 });
  }
}
