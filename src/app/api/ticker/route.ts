import { NextResponse } from "next/server";
import { getErrorMessage } from "../../../lib/errors";
import { fallbackEconomicIndicators, fallbackTicker } from "../../../lib/mock-data";
import {
  buildReferenceTicker,
  fetchReferenceEconomicIndicators,
  fetchReferenceReports,
} from "../../../lib/reference-data";

export async function GET() {
  try {
    const [reports, indicators] = await Promise.all([
      fetchReferenceReports(),
      fetchReferenceEconomicIndicators(),
    ]);

    return NextResponse.json(buildReferenceTicker(reports, indicators));
  } catch (error: unknown) {
    console.error("Reference ticker error:", getErrorMessage(error));
    try {
      const reports = await fetchReferenceReports();
      return NextResponse.json(
        buildReferenceTicker(reports, fallbackEconomicIndicators),
      );
    } catch (fallbackError: unknown) {
      console.error("Fallback ticker error:", getErrorMessage(fallbackError));
      return NextResponse.json(fallbackTicker, { status: 200 });
    }
  }
}
