import { NextResponse } from "next/server";
import { fallbackCopernicusPreview } from "../../../../lib/mock-data";
import { buildMapOverlayCatalog } from "../../../../lib/map-overlays";

function getSafeDate() {
  // NASA GIBS only serves imagery up to the current real-world date.
  // Use a known-good historical date to prevent blank tiles.
  return "2024-03-01";
}

export async function GET() {
  try {
    const focusDate = getSafeDate();
    const catalog = buildMapOverlayCatalog(focusDate);
    const imagerySources = catalog.overlays
      .filter((overlay) => overlay.role === "base-option")
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
    return NextResponse.json(fallbackCopernicusPreview, { status: 200 });
  }
}
