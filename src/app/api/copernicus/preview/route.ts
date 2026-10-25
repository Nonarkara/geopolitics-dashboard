
import { NextResponse } from "next/server";
import { buildMapOverlayCatalog } from "../../../../lib/map-overlays";

function getSafeDate() {
  // Daily science products can trail acquisition by a processing cycle.
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 2);
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const focusDate = getSafeDate();
    const catalog = buildMapOverlayCatalog(focusDate);
    const imagerySources = catalog.overlays
      .filter((overlay) => overlay.kind === "raster")
      .map((overlay) => ({
        id: overlay.id,
        label: overlay.label,
        description: overlay.description,
      }));

    return NextResponse.json({
      updatedAt: catalog.updatedAt,
      focusDate,
      imagerySources,
    });
  } catch {
    return NextResponse.json(
      { errorCode: "LIVE_DATA_UNAVAILABLE" },
      { status: 503, headers: { "X-Data-Source": "unavailable" } },
    );
  }
}
