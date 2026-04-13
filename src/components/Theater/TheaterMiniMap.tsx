"use client";

import { useEffect, useState } from "react";
import type { BorderAreaId } from "../../lib/border-regions";

/**
 * Theater-specific coordinates for the mini-map static views.
 * Each maps to a satellite image crop showing the theater zone.
 */
const THEATER_VIEWS: Record<
  BorderAreaId,
  { bbox: string; label: string }
> = {
  "myanmar-frontier": {
    bbox: "96,15,101,20",
    label: "Myanmar frontier — Mae Sot / Myawaddy corridor",
  },
  "cambodia-frontier": {
    bbox: "101,12,104,15",
    label: "Cambodia frontier — Aranyaprathet / Poipet corridor",
  },
  "malaysia-frontier": {
    bbox: "99.5,6,101.5,8",
    label: "Malaysia corridor — Sadao / Hat Yai",
  },
  "deep-south": {
    bbox: "100,5.5,103,7.5",
    label: "Deep South — Pattani / Yala / Narathiwat",
  },
};

interface TheaterMiniMapProps {
  theaterId: BorderAreaId;
  accentColor?: string;
}

export default function TheaterMiniMap({
  theaterId,
  accentColor = "#3b82f6",
}: TheaterMiniMapProps) {
  const view = THEATER_VIEWS[theaterId];
  const [loaded, setLoaded] = useState(false);

  // Static satellite image from ESRI for the theater zone
  const imageUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${view.bbox}&bboxSR=4326&size=400,300&imageSR=4326&format=jpg&f=image`;

  useEffect(() => {
    setLoaded(false);
  }, [theaterId]);

  return (
    <div
      className="relative w-full overflow-hidden rounded"
      style={{
        aspectRatio: "4/3",
        border: `1px solid ${accentColor}30`,
        background: "#0a1628",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={view.label}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: loaded ? 0.7 : 0,
          transition: "opacity 0.5s ease",
        }}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-3 w-3 rounded-full animate-pulse"
            style={{ background: accentColor }}
          />
        </div>
      )}
      {/* Accent border glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded"
        style={{
          boxShadow: `inset 0 0 20px ${accentColor}15`,
        }}
      />
      {/* Theater label */}
      <div className="absolute bottom-1 left-1.5 text-[7px] font-mono text-white/40 tracking-wider uppercase">
        {theaterId.replace("-", " ")}
      </div>
    </div>
  );
}
