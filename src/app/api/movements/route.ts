
import { NextResponse } from "next/server";
import type { RefugeeMovement } from "../../../types/dashboard";

export async function GET() {
  // No live movement source is ingested yet. Fail closed rather than serve
  // fabricated flows; the map layer renders nothing on an empty array.
  const movements: RefugeeMovement[] = [];
  return NextResponse.json(movements, {
    headers: { "X-Data-Source": "unavailable" },
  });
}
