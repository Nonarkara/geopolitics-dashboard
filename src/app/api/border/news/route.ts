import { NextResponse } from "next/server";
import { fallbackNews } from "../../../../lib/mock-data";
import {
  buildBorderNews,
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

    return NextResponse.json(buildBorderNews(incidents, indicators, osint));
  } catch {
    return NextResponse.json(fallbackNews, { status: 200 });
  }
}
