import { NextResponse } from "next/server";
import { loadOpenSanctionsWatch } from "../../../../lib/opensanctions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await loadOpenSanctionsWatch();
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
