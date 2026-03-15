import { NextResponse } from "next/server";
import { loadBorderMovements } from "../../../../lib/border-command";

export async function GET() {
  return NextResponse.json(await loadBorderMovements());
}
