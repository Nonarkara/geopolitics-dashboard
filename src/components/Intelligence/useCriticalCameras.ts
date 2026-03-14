"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicCameraResponse } from "../../types/dashboard";

function isPublicCameraResponse(value: unknown): value is PublicCameraResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "cameras" in value &&
    Array.isArray(value.cameras)
  );
}

export function useCriticalCameras() {
  const [payload, setPayload] = useState<PublicCameraResponse | null>(null);

  const load = useCallback(async () => {
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
    const interval = setInterval(() => {
      void load();
    }, 3 * 60 * 1000);

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
