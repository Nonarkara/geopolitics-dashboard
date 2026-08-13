import { NextResponse } from "next/server";
import { loadBorderInsights } from "../../../../lib/border-insights";

export const revalidate = 900;

export async function GET() {
  const data = await loadBorderInsights();
  const liveCount = data.sources.filter((source) => source.status === "live").length;

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        "X-Data-Source": liveCount > 0 ? "live" : "unavailable",
        "X-Data-Age": data.generatedAt,
      },
    },
  );
}
