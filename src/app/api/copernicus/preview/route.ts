import { NextResponse } from "next/server";
import { fallbackCopernicusPreview } from "../../../../lib/mock-data";
import { buildCopernicusPreview } from "../../../../lib/reference-data";

function getSafeDate() {
  const date = new Date();
  date.setDate(date.getDate() - 14);
  return date.toISOString().split("T")[0];
}

export async function GET() {
  try {
    return NextResponse.json(buildCopernicusPreview(getSafeDate()));
  } catch {
    return NextResponse.json(fallbackCopernicusPreview, { status: 200 });
  }
}
