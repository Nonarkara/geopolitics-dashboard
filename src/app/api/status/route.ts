import { getErrorMessage } from "@/lib/errors";
import { fetchReferenceStatusSummary } from "@/lib/reference-data";

export async function GET() {
  try {
    const referenceSummary = await fetchReferenceStatusSummary();

    return Response.json({
      status: "operational",
      version: "4.2.0",
      signal_strength: 0.98,
      services: {
        database: process.env.DATABASE_URL ? "configured" : "fallback",
        basemap:
          process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
          process.env.MAPBOX_ACCESS_TOKEN
            ? "configured"
            : "missing",
        reference_dashboard: "connected",
      },
      reference: referenceSummary,
    });
  } catch (error: unknown) {
    console.error("Reference status error:", getErrorMessage(error));

    return Response.json({
      status: "operational",
      version: "4.2.0",
      signal_strength: 0.98,
      services: {
        database: process.env.DATABASE_URL ? "configured" : "fallback",
        basemap:
          process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
          process.env.MAPBOX_ACCESS_TOKEN
            ? "configured"
            : "missing",
        reference_dashboard: "unavailable",
      },
    });
  }
}
