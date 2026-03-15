import { NextResponse } from "next/server";
import { loadBorderCommandBrief } from "../../../../lib/border-command";

export const revalidate = 60;

export async function GET() {
  return NextResponse.json(await loadBorderCommandBrief());
}
