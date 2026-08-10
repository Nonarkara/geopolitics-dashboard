import { NextResponse } from "next/server";
import { loadBorderInsights } from "../../../../lib/border-insights";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await loadBorderInsights();
  const liveCount = data.sources.filter((source) => source.status === "live").length;

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Data-Source": liveCount > 0 ? "live" : "unavailable",
        "X-Data-Age": data.generatedAt,
      },
    },
  );
}
