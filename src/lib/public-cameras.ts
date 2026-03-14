import {
  type CameraDefinition,
  findCameraDefinition,
  listCameraDefinitions,
  resolveCameraSnapshot,
} from "./camera-utils";

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

export function listPublicCameras() {
  return listCameraDefinitions(CAMERA_DEFINITIONS, "/api/public-cameras");
}

export function getPublicCameraDefinition(cameraId: string) {
  return findCameraDefinition(CAMERA_DEFINITIONS, cameraId);
}

export async function resolvePublicCameraSnapshot(cameraId: string) {
  const camera = getPublicCameraDefinition(cameraId);

  if (!camera) {
    throw new Error("Camera not found");
  }

  return resolveCameraSnapshot(camera);
}
