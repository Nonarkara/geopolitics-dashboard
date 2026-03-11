import { NextResponse } from "next/server";
import { getErrorMessage } from "../../../lib/errors";
import { fallbackSources } from "../../../lib/mock-data";
import { fetchReferenceApiCatalog } from "../../../lib/reference-data";

export async function GET() {
  try {
    return NextResponse.json(await fetchReferenceApiCatalog());
  } catch (error: unknown) {
    console.error("Reference sources error:", getErrorMessage(error));
    return NextResponse.json(fallbackSources, { status: 200 });
  }
}
