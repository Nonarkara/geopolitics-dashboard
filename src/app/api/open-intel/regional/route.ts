import { NextResponse } from "next/server";
import { loadRegionalOpenIntel } from "../../../../lib/regional-open-intel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const payload = await loadRegionalOpenIntel();

  return NextResponse.json(payload, {
    status: payload.status === "unavailable" ? 503 : 200,
    headers: {
      "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      "x-data-source": payload.status,
    },
  });
}
