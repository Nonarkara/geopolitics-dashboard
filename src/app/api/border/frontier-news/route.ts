import { NextRequest, NextResponse } from "next/server";
import { loadBorderOsint, loadBorderIncidents } from "../../../../lib/border-osint";
import { BORDER_AREAS, type BorderAreaId, incidentMatchesBorderArea } from "../../../../lib/border-regions";

export const revalidate = 120;

const VALID_IDS = new Set<string>(BORDER_AREAS.map(a => a.id));

export async function GET(request: NextRequest) {
  const areaId = request.nextUrl.searchParams.get("area");

  if (!areaId || !VALID_IDS.has(areaId)) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid ?area= parameter", data: null },
      { status: 400 },
    );
  }

  try {
    const [osint, incidents] = await Promise.all([
      loadBorderOsint(),
      loadBorderIncidents(),
    ]);

    const area = BORDER_AREAS.find(a => a.id === areaId)!;

    // Filter signals for this specific frontier
    const signals = osint.signals
      .filter(s => s.areaId === areaId)
      .slice(0, 8);

    // Filter incidents for this frontier
    const frontierIncidents = incidents
      .filter(inc => incidentMatchesBorderArea(area, inc))
      .slice(0, 5);

    // Build a 7-day activity histogram (signal count per day)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const histogram: number[] = Array(7).fill(0);

    for (const signal of osint.signals) {
      if (signal.areaId !== areaId) continue;
      const age = now - new Date(signal.publishedAt).getTime();
      const dayIndex = Math.min(6, Math.floor(age / dayMs));
      histogram[6 - dayIndex]++;
    }

    // Also count incidents into the histogram
    for (const inc of frontierIncidents) {
      const age = now - new Date(inc.properties.eventDate || "").getTime();
      if (age < 0 || age > 7 * dayMs) continue;
      const dayIndex = Math.min(6, Math.floor(age / dayMs));
      histogram[6 - dayIndex]++;
    }

    // Humanitarian data for this frontier
    const humanitarian = osint.humanitarian.filter(h => h.areaId === areaId);

    return NextResponse.json({
      success: true,
      data: {
        areaId: areaId as BorderAreaId,
        areaLabel: area.label,
        counterpart: area.counterpart,
        signals,
        incidents: frontierIncidents.map(inc => ({
          id: inc.id,
          title: inc.properties.title,
          type: inc.properties.type,
          location: inc.properties.location,
          fatalities: inc.properties.fatalities,
          date: inc.properties.eventDate,
        })),
        humanitarian,
        histogram,
        watchpoints: area.watchpoints,
        generatedAt: osint.generatedAt,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load frontier data", data: null },
      { status: 200 },
    );
  }
}
