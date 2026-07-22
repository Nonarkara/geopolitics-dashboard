
import { NextResponse } from "next/server";
import { getErrorMessage } from "../../../../lib/errors";
import { createRequestId } from "../../../../lib/http";
import { loadIntelligencePackages } from "../../../../lib/intelligence";

export async function GET() {
  const requestId = createRequestId("intel");

  try {
    return NextResponse.json(await loadIntelligencePackages(), {
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    });
  } catch (error: unknown) {
    console.error(
      `[${requestId}] Intelligence packages route error:`,
      getErrorMessage(error),
    );

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        mode: "offline",
        packages: [],
        sources: [],
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
