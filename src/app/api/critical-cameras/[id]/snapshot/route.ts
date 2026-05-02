export const runtime = 'edge';

import {
  getCriticalCameraDefinition,
  resolveCriticalCameraSnapshot,
} from "../../../../../lib/critical-cameras";

export const revalidate = 180;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const camera = getCriticalCameraDefinition(id);

  if (!camera) {
    return new Response("Camera not found", { status: 404 });
  }

  try {
    const snapshot = await resolveCriticalCameraSnapshot(id);

    return new Response(snapshot.buffer, {
      status: 200,
      headers: {
        "Content-Type": snapshot.contentType,
        "Cache-Control": snapshot.cacheControl,
      },
    });
  } catch (error) {
    console.error(
      `Critical camera snapshot error for ${camera.label}:`,
      error instanceof Error ? error.message : error,
    );

    return new Response("Unable to load camera snapshot", {
      status: 502,
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}
