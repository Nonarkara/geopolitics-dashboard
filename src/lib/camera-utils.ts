import type { PublicCamera, PublicCameraCategory } from "../types/dashboard";

export const CAMERA_REFRESH_SECONDS = 180;
const FETCH_TIMEOUT_MS = 8000;
const CAMERA_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export type CameraDefinition = {
  id: string;
  label: string;
  category: PublicCameraCategory;
  lat: number;
  lng: number;
  provider: string;
  sourcePageUrl: string;
  locationLabel?: string;
  focusArea?: string;
  strategicNote?: string;
  embedUrl?: string;
  directSnapshotUrl?: string;
};

function absoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function extractMetaImage(html: string, baseUrl: string) {
  const metaPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ];

  for (const pattern of metaPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return absoluteUrl(match[1], baseUrl);
    }
  }

  const imageMatch = html.match(
    /<img[^>]+src=["']([^"']+thumbnail[^"']+\.(?:jpg|jpeg|png))["']/i,
  );

  if (imageMatch?.[1]) {
    return absoluteUrl(imageMatch[1], baseUrl);
  }

  return null;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": CAMERA_USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    next: { revalidate: CAMERA_REFRESH_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Camera page fetch failed (${response.status})`);
  }

  return response.text();
}

async function fetchBuffer(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": CAMERA_USER_AGENT,
      Accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      Referer: new URL(url).origin,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    next: { revalidate: CAMERA_REFRESH_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Camera image fetch failed (${response.status})`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "image/jpeg",
    cacheControl:
      response.headers.get("cache-control") ||
      `public, s-maxage=${CAMERA_REFRESH_SECONDS}, stale-while-revalidate=86400`,
  };
}

export function listCameraDefinitions(
  definitions: CameraDefinition[],
  snapshotBasePath: string,
): PublicCamera[] {
  const checkedAt = new Date().toISOString();

  return definitions.map((camera) => ({
    id: camera.id,
    label: camera.label,
    category: camera.category,
    lat: camera.lat,
    lng: camera.lng,
    provider: camera.provider,
    sourcePageUrl: camera.sourcePageUrl,
    embedUrl: camera.embedUrl,
    snapshotUrl: `${snapshotBasePath}/${camera.id}/snapshot`,
    locationLabel: camera.locationLabel,
    focusArea: camera.focusArea,
    strategicNote: camera.strategicNote,
    status: "live",
    refreshSeconds: CAMERA_REFRESH_SECONDS,
    lastCheckedAt: checkedAt,
  }));
}

export function findCameraDefinition(
  definitions: CameraDefinition[],
  cameraId: string,
) {
  return definitions.find((camera) => camera.id === cameraId) ?? null;
}

export async function resolveCameraSnapshot(camera: CameraDefinition) {
  const imageUrl =
    camera.directSnapshotUrl ??
    extractMetaImage(await fetchText(camera.sourcePageUrl), camera.sourcePageUrl);

  if (!imageUrl) {
    throw new Error(`No snapshot image found for ${camera.label}`);
  }

  return fetchBuffer(imageUrl);
}
