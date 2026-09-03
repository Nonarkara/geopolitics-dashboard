import { NextResponse } from "next/server.js";
import { loadBorderMovements } from "../../../../lib/border-command";
import { buildBorderOperationsMapResponse } from "../../../../lib/border-operations-map";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  try {
    const liveFlows = await loadBorderMovements();

    return NextResponse.json(buildBorderOperationsMapResponse(liveFlows), {
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(buildBorderOperationsMapResponse([]), {
      headers: NO_STORE_HEADERS,
    });
  }
}
