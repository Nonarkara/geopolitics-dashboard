import { NextResponse } from "next/server";
import { fallbackNews } from "../../../lib/mock-data";
import {
  buildThailandNews,
  loadThailandEconomics,
  loadThailandIncidents,
} from "../../../lib/thailand-monitor";

export async function GET() {
  try {
    const [incidents, indicators] = await Promise.all([
      loadThailandIncidents(),
      loadThailandEconomics(),
    ]);

    return NextResponse.json(buildThailandNews(incidents, indicators));
  } catch {
    return NextResponse.json(fallbackNews, { status: 200 });
  }
}
