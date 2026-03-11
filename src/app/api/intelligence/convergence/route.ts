import { NextRequest, NextResponse } from "next/server";
import {
  getConvergenceCorridor,
  loadCorridorConvergence,
} from "../../../../lib/convergence";

export async function GET(request: NextRequest) {
  const corridorId =
    request.nextUrl.searchParams.get("corridor") ?? "mae-sot-myawaddy";

  if (!getConvergenceCorridor(corridorId)) {
    return NextResponse.json(
      {
        error: "Unsupported corridor",
        supportedCorridors: ["mae-sot-myawaddy"],
      },
      { status: 400 },
    );
  }

  return NextResponse.json(await loadCorridorConvergence(corridorId));
}
