import { NextResponse } from "next/server";
import { DASHBOARD_VERSION } from "../../../lib/dashboard-version";
import { getErrorMessage } from "../../../lib/errors";
import { createRequestId } from "../../../lib/http";
import { buildRuntimeStatusPayload } from "../../../lib/runtime-status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const requestId = createRequestId("status");

  try {
    return NextResponse.json(await buildRuntimeStatusPayload(), {
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    });
  } catch (error: unknown) {
    console.error(`[${requestId}] Runtime status route error:`, getErrorMessage(error));

    return NextResponse.json(
      {
        status: "degraded",
        version: DASHBOARD_VERSION,
        signal_strength: 0,
        checkedAt: new Date().toISOString(),
        posture: "fallback",
        services: {
          app_runtime: process.env.VERCEL === "1" ? "vercel" : "local",
          database: "unknown",
          scheduler: "unknown",
          basemap: "unknown",
          reference_dashboard: "unknown",
          fallback_posture: "fallback",
          conflict_refresh: "unknown",
          thermal_refresh: "unknown",
          intelligence_cache: "unknown",
          ai_summary: "unknown",
          data_explorer: "unknown",
          mock_ingestion: "unknown",
        },
        datasets: [],
        crons: [],
      },
      {
        headers: {
          "cache-control": "no-store",
          "x-request-id": requestId,
        },
      },
    );
  }
}
