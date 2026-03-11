import { NextResponse } from "next/server";
import { getErrorMessage } from "../../../../lib/errors";
import {
  fallbackBriefing,
  fallbackEconomicIndicators,
} from "../../../../lib/mock-data";
import {
  buildReferenceBriefing,
  fetchReferenceEconomicIndicators,
  fetchReferenceReports,
} from "../../../../lib/reference-data";

export async function GET() {
  try {
    const [reports, indicators] = await Promise.all([
      fetchReferenceReports(),
      fetchReferenceEconomicIndicators(),
    ]);

    return NextResponse.json(buildReferenceBriefing(reports, indicators));
  } catch (error: unknown) {
    console.error("Reference briefing error:", getErrorMessage(error));
    try {
      const reports = await fetchReferenceReports();
      return NextResponse.json(
        buildReferenceBriefing(reports, fallbackEconomicIndicators),
      );
    } catch (fallbackError: unknown) {
      console.error("Fallback briefing error:", getErrorMessage(fallbackError));
      return NextResponse.json(fallbackBriefing, { status: 200 });
    }
  }
}
