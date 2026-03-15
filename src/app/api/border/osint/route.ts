import { NextResponse } from "next/server";
import { loadBorderOsint } from "../../../../lib/border-osint";

export const revalidate = 900;

export async function GET() {
  return NextResponse.json(await loadBorderOsint());
}
