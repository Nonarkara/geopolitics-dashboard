import { NextResponse } from "next/server";
import { getErrorMessage } from "../../../lib/errors";
import { fallbackEconomicIndicators } from "../../../lib/mock-data";
import { fetchReferenceEconomicIndicators } from "../../../lib/reference-data";

export async function GET() {
  try {
    const indicators = await fetchReferenceEconomicIndicators();
    return NextResponse.json(indicators);
  } catch (error: unknown) {
    console.error("Reference markets error:", getErrorMessage(error));
    return NextResponse.json(fallbackEconomicIndicators, { status: 200 });
  }
}
