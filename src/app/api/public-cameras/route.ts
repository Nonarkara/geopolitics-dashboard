export const runtime = 'edge';

import { NextResponse } from "next/server";
import { listPublicCameras } from "../../../lib/public-cameras";
import type { PublicCameraResponse } from "../../../types/dashboard";

export const revalidate = 180;

export async function GET() {
  const payload: PublicCameraResponse = {
    generatedAt: new Date().toISOString(),
    cameras: listPublicCameras(),
  };

  return NextResponse.json(payload);
}
