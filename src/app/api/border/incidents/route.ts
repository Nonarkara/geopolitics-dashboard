import { NextResponse } from "next/server";
import { loadBorderIncidents } from "../../../../lib/border-osint";

export async function GET() {
  return NextResponse.json(await loadBorderIncidents());
}
