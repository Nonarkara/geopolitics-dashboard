import { NextResponse } from "next/server";
import { listCriticalCameras } from "../../../lib/critical-cameras";
import type { PublicCameraResponse } from "../../../types/dashboard";

export const revalidate = 180;

export async function GET() {
  const payload: PublicCameraResponse = {
    generatedAt: new Date().toISOString(),
    cameras: listCriticalCameras(),
  };

  return NextResponse.json(payload);
}
