import { NextResponse } from "next/server";
import { loadReliefWebReports } from "../../../../lib/reliefweb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await loadReliefWebReports();
  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Data-Source": data.source.status,
        "X-Data-Age": data.generatedAt,
      },
    },
  );
}
