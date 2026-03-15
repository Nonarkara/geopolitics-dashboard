import {
  type CameraDefinition,
  findCameraDefinition,
  listCameraDefinitions,
  resolveCameraSnapshot,
} from "./camera-utils";

const CRITICAL_CAMERA_DEFINITIONS: CameraDefinition[] = [
  {
    id: "mae-sot-crossing",
    label: "Mae Sot crossing",
    category: "border",
    lat: 16.7163,
    lng: 98.5746,
    provider: "Pictimo public webcam",
    sourcePageUrl:
      "https://www.pictimo.com/thailand/mae-sot/44215/webcam-ip-camera-mae-sot",
    directSnapshotUrl: "https://images.pictimo.com/storage/live_thumbs/44215.jpg",
    locationLabel: "Tak / Myawaddy approach",
    focusArea: "Border gate",
    strategicNote:
      "Western crossing watchpoint for queue buildup, truck movement, and sudden access changes.",
  },
  {
    id: "aranyaprathet-gate",
    label: "Aranyaprathet gate",
    category: "border",
    lat: 13.6587,
    lng: 102.5636,
    provider: "Scout slot",
    sourcePageUrl:
      "https://www.openstreetmap.org/?mlat=13.6587&mlon=102.5636#map=13/13.6587/102.5636",
    validationState: "candidate",
    locationLabel: "Sa Kaeo / Poipet approach",
    focusArea: "Eastern gate",
    strategicNote:
      "Camera scout slot for queue buildup, customs pressure, and passenger-turnback risk on the Cambodia frontier.",
  },
  {
    id: "mae-sai-frontier",
    label: "Mae Sai frontier",
    category: "border",
    lat: 20.4335,
    lng: 99.8762,
    provider: "Pictimo public webcam",
    sourcePageUrl:
      "https://www.pictimo.com/thailand/mae-sai/40195/webcam-live-view-in-mae-sai",
    directSnapshotUrl: "https://images.pictimo.com/storage/live_thumbs/40195.jpg",
    locationLabel: "Golden Triangle approach",
    focusArea: "Northern gate",
    strategicNote:
      "Useful for frontier tempo around the northern crossing and nearby commercial flow.",
  },
  {
    id: "chiang-mai-hub",
    label: "Chiang Mai hub",
    category: "logistics",
    lat: 18.7883,
    lng: 98.9853,
    provider: "Pictimo public webcam",
    sourcePageUrl:
      "https://www.pictimo.com/thailand/chiang-mai/50862/webcam-ip-camera-chiang-mai",
    directSnapshotUrl: "https://images.pictimo.com/storage/live_thumbs/50862.jpg",
    locationLabel: "Northern air-road hub",
    focusArea: "Staging node",
    strategicNote:
      "A strong proxy for northern logistics pressure when border spillover pushes into the interior.",
  },
  {
    id: "hat-yai-corridor",
    label: "Hat Yai corridor",
    category: "logistics",
    lat: 7.0084,
    lng: 100.4747,
    provider: "Pictimo public webcam",
    sourcePageUrl:
      "https://www.pictimo.com/thailand/hat-yai/48578/webcam-ip-camera-hat-yai",
    directSnapshotUrl: "https://images.pictimo.com/storage/live_thumbs/48578.jpg",
    locationLabel: "Malaysia corridor",
    focusArea: "Southbound flow",
    strategicNote:
      "Tracks southern rail-road throughput and diversion risk toward the Malaysia-facing corridor.",
  },
  {
    id: "sadao-checkpoint",
    label: "Sadao checkpoint",
    category: "border",
    lat: 6.7483,
    lng: 100.4186,
    provider: "Scout slot",
    sourcePageUrl:
      "https://www.openstreetmap.org/?mlat=6.7483&mlon=100.4186#map=13/6.7483/100.4186",
    validationState: "candidate",
    locationLabel: "Songkhla / Bukit Kayu Hitam",
    focusArea: "Southern gate",
    strategicNote:
      "Camera scout slot for customs lane congestion, coach traffic, and surge control on the Malaysia corridor.",
  },
  {
    id: "bangkok-traffic",
    label: "Bangkok traffic",
    category: "capital",
    lat: 13.7563,
    lng: 100.5018,
    provider: "Pictimo public webcam",
    sourcePageUrl:
      "https://www.pictimo.com/thailand/bangkok/7806/webcam-bangkok-traffic",
    directSnapshotUrl: "https://images.pictimo.com/storage/live_thumbs/7806.jpg",
    locationLabel: "Capital movement grid",
    focusArea: "Command core",
    strategicNote:
      "Keeps the national command center in view when congestion or demonstrations tighten movement.",
  },
  {
    id: "nonthaburi-approach",
    label: "Nonthaburi approach",
    category: "capital",
    lat: 13.8591,
    lng: 100.5217,
    provider: "Pictimo public webcam",
    sourcePageUrl:
      "https://www.pictimo.com/thailand/mueang-nonthaburi/51483/webcam-ip-camera-mueang-nonthaburi",
    directSnapshotUrl: "https://images.pictimo.com/storage/live_thumbs/51483.jpg",
    locationLabel: "Metro north approach",
    focusArea: "Urban ingress",
    strategicNote:
      "Adds another capital-area angle for northern ingress, commuter pressure, and reroute behavior.",
  },
];

export function listCriticalCameras() {
  return listCameraDefinitions(
    CRITICAL_CAMERA_DEFINITIONS,
    "/api/critical-cameras",
  );
}

export function getCriticalCameraDefinition(cameraId: string) {
  return findCameraDefinition(CRITICAL_CAMERA_DEFINITIONS, cameraId);
}

export async function resolveCriticalCameraSnapshot(cameraId: string) {
  const camera = getCriticalCameraDefinition(cameraId);

  if (!camera) {
    throw new Error("Camera not found");
  }

  return resolveCameraSnapshot(camera);
}
