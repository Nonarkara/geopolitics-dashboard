"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicCamera, PublicCameraResponse } from "../../types/dashboard";
import { IS_STATIC_EXPORT } from "../../lib/static-detect";

type CameraSeed = {
  id: string;
  label: string;
  category: PublicCamera["category"];
  lat: number;
  lng: number;
  provider: string;
  sourcePageUrl: string;
  directSnapshotUrl?: string;
  locationLabel?: string;
  focusArea?: string;
  strategicNote?: string;
  validationState?: PublicCamera["validationState"];
};

const STATIC_CAMERA_SEEDS: CameraSeed[] = [
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
      "Frontier tempo at the northern crossing and nearby commercial flow.",
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
      "Northern logistics pressure proxy when border spillover pushes into the interior.",
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
      "Southern rail-road throughput toward the Malaysia-facing corridor.",
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
      "National command center in view when congestion or demonstrations tighten movement.",
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
      "Northern ingress, commuter pressure, and reroute behavior in the capital.",
  },
];

function buildStaticPayload(cacheBuster: number): PublicCameraResponse {
  const now = new Date().toISOString();
  const cameras: PublicCamera[] = STATIC_CAMERA_SEEDS.map((seed) => ({
    id: seed.id,
    label: seed.label,
    category: seed.category,
    lat: seed.lat,
    lng: seed.lng,
    provider: seed.provider,
    sourcePageUrl: seed.sourcePageUrl,
    snapshotUrl: seed.directSnapshotUrl
      ? `${seed.directSnapshotUrl}?ts=${cacheBuster}`
      : undefined,
    validationState: seed.validationState ?? "verified",
    locationLabel: seed.locationLabel,
    focusArea: seed.focusArea,
    strategicNote: seed.strategicNote,
    status: "live",
    refreshSeconds: 180,
    lastCheckedAt: now,
  }));
  return { cameras, generatedAt: now };
}

function isPublicCameraResponse(value: unknown): value is PublicCameraResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "cameras" in value &&
    Array.isArray(value.cameras)
  );
}

export function useCriticalCameras() {
  const [payload, setPayload] = useState<PublicCameraResponse | null>(
    IS_STATIC_EXPORT ? buildStaticPayload(Date.now()) : null,
  );

  const load = useCallback(async () => {
    if (IS_STATIC_EXPORT) {
      setPayload(buildStaticPayload(Date.now()));
      return;
    }
    try {
      const response = await fetch("/api/critical-cameras");
      const nextPayload: unknown = await response.json();

      if (isPublicCameraResponse(nextPayload)) {
        setPayload(nextPayload);
      }
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void load();
    }, 0);
    const interval = setInterval(
      () => {
        void load();
      },
      3 * 60 * 1000,
    );

    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [load]);

  return {
    payload,
    cameras: payload?.cameras ?? [],
    generatedAt: payload?.generatedAt ?? null,
    reload: load,
  };
}
