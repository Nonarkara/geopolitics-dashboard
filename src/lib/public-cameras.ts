import type { PublicCamera, PublicCameraCategory } from "../types/dashboard";

const CAMERA_REFRESH_SECONDS = 180;
const FETCH_TIMEOUT_MS = 8000;
const CAMERA_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

type CameraDefinition = {
  id: string;
  label: string;
  category: PublicCameraCategory;
  lat: number;
  lng: number;
  provider: string;
  sourcePageUrl: string;
  embedUrl?: string;
  directSnapshotUrl?: string;
};

const CAMERA_DEFINITIONS: CameraDefinition[] = [
  {
    id: "patong-coast",
    label: "Patong coast",
    category: "beach",
    lat: 7.8964,
    lng: 98.2956,
    provider: "SCS Webcam",
    sourcePageUrl: "https://webcam.scs.com.ua/en/asia/thailand/phuket/coast/",
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCjEk_JpkbmfgVkKuE0Of9KA",
    directSnapshotUrl:
      "https://webcam.scs.com.ua/images/webcam/thumbnail/coast-228315558.jpg",
  },
  {
    id: "karon-panorama",
    label: "Karon panorama",
    category: "beach",
    lat: 7.8434,
    lng: 98.2947,
    provider: "SCS Webcam",
    sourcePageUrl: "https://webcam.scs.com.ua/en/asia/thailand/phuket/karon/",
    directSnapshotUrl:
      "https://webcam.scs.com.ua/images/webcam/thumbnail/karon-1812911630.jpg",
  },
  {
    id: "kata-beach",
    label: "Kata beach",
    category: "beach",
    lat: 7.8207,
    lng: 98.2989,
    provider: "SSS Phuket",
    sourcePageUrl: "https://www.sssphuket.com/kata-beach-live-cam/",
    directSnapshotUrl:
      "https://www.sssphuket.com/wp-content/uploads/2025/08/Kata-Beach-Live-Cam-SSS.jpg",
  },
  {
    id: "bangla-road",
    label: "Bangla Road",
    category: "nightlife",
    lat: 7.8935,
    lng: 98.2968,
    provider: "SCS Webcam",
    sourcePageUrl:
      "https://webcam.scs.com.ua/en/asia/thailand/phuket/banglaroud/",
    directSnapshotUrl:
      "https://webcam.scs.com.ua/images/webcam/thumbnail/banglaroud-1894902905.jpg",
  },
  {
    id: "phuket-old-town",
    label: "Phuket old town",
    category: "town",
    lat: 7.8849,
    lng: 98.3923,
    provider: "SCS Webcam",
    sourcePageUrl: "https://webcam.scs.com.ua/en/asia/thailand/phuket/oldtown/",
    directSnapshotUrl:
      "https://webcam.scs.com.ua/images/webcam/thumbnail/oldtown-521899266.jpg",
  },
];

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
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
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

export function listPublicCameras(): PublicCamera[] {
  const checkedAt = new Date().toISOString();

  return CAMERA_DEFINITIONS.map((camera) => ({
    id: camera.id,
    label: camera.label,
    category: camera.category,
    lat: camera.lat,
    lng: camera.lng,
    provider: camera.provider,
    sourcePageUrl: camera.sourcePageUrl,
    embedUrl: camera.embedUrl,
    snapshotUrl: `/api/public-cameras/${camera.id}/snapshot`,
    status: "live",
    refreshSeconds: CAMERA_REFRESH_SECONDS,
    lastCheckedAt: checkedAt,
  }));
}

export function getPublicCameraDefinition(cameraId: string) {
  return CAMERA_DEFINITIONS.find((camera) => camera.id === cameraId) ?? null;
}

export async function resolvePublicCameraSnapshot(cameraId: string) {
  const camera = getPublicCameraDefinition(cameraId);

  if (!camera) {
    throw new Error("Camera not found");
  }

  const imageUrl =
    camera.directSnapshotUrl ??
    extractMetaImage(await fetchText(camera.sourcePageUrl), camera.sourcePageUrl);

  if (!imageUrl) {
    throw new Error(`No snapshot image found for ${camera.label}`);
  }

  return fetchBuffer(imageUrl);
}
