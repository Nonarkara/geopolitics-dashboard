
import { NextResponse } from "next/server";
import { getErrorMessage } from "../../../lib/errors";
import type { ApiSourceResponse } from "../../../types/dashboard";
import { buildEnhancedSourceCatalog } from "../../../lib/intelligence";

export async function GET() {
  try {
    return NextResponse.json(await buildEnhancedSourceCatalog(), {
      headers: { "X-Data-Source": "live" },
    });
  } catch (error: unknown) {
    console.error("Reference sources error:", getErrorMessage(error));
    const empty: ApiSourceResponse = {
      generatedAt: new Date().toISOString(),
      sources: [],
    };
    return NextResponse.json(empty, {
      headers: { "X-Data-Source": "unavailable" },
    });
  }
}
