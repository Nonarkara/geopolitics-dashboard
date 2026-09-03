"use client";

import Image from "next/image";
import { useState } from "react";
import { Camera, ExternalLink, MapPin } from "lucide-react";
import type { PublicCamera } from "../../../types/dashboard";

function formatCameraAge(value: string) {
  const diffMs = Math.max(0, Date.now() - new Date(value).getTime());
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= 1) {
    return "just refreshed";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  return `${diffHours}h ago`;
}

function statusClass(status: "live" | "offline" | "stale") {
  if (status === "live") {
    return "bg-[rgba(34,197,94,0.14)] text-[#22c55e]";
  }

  if (status === "stale") {
    return "bg-[rgba(245,158,11,0.14)] text-[#f59e0b]";
  }

  return "bg-[rgba(239,68,68,0.14)] text-[#ef4444]";
}

export default function PublicCameraCard({
  camera,
  variant = "rail",
}: {
  camera: PublicCamera;
  variant?: "rail" | "map-detail";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedStatus = imageFailed ? "offline" : camera.status;
  const compact = variant === "rail";

  return (
    <article
      data-testid={`camera-card-${camera.id}`}
      className={`overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-surface)] ${
        compact ? "" : "shadow-[0_18px_40px_rgba(15,23,42,0.22)]"
      }`}
    >
      <div
        className={`relative overflow-hidden bg-[var(--bg)] ${
          compact ? "aspect-[16/9]" : "aspect-[16/10]"
        }`}
      >
        {camera.snapshotUrl && !imageFailed ? (
          <Image
            src={camera.snapshotUrl}
            alt={`${camera.label} camera`}
            fill
            unoptimized
            sizes={compact ? "(min-width: 1280px) 18rem, 50vw" : "280px"}
            className="object-cover"
            onError={() => setImageFailed(true)}
            onLoad={() => setImageFailed(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,111,136,0.2),_rgba(6,10,18,0.94)_58%)]">
            <div className="flex flex-col items-center gap-2 text-[var(--dim)]">
              <Camera size={compact ? 18 : 22} />
              <span className="text-[13px] font-semibold uppercase tracking-[0.16em]">
                Snapshot unavailable
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-2 py-2">
          <span
            className={`rounded-full px-2 py-1 text-[12px] font-bold uppercase tracking-[0.18em] ${statusClass(
              resolvedStatus,
            )}`}
          >
            {resolvedStatus}
          </span>
          <span className="rounded-full bg-[rgba(6,10,18,0.74)] px-2 py-1 text-[12px] font-mono uppercase tracking-[0.16em] text-white">
            {camera.category}
          </span>
        </div>
      </div>

      <div className={compact ? "space-y-2 p-3" : "space-y-3 p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
              {camera.label}
            </div>
            <div className="pt-1 text-[13px] text-[var(--dim)]">{camera.provider}</div>
          </div>
          <a
            href={camera.sourcePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--cool)]"
            aria-label={`Open source feed for ${camera.label}`}
            title="Open source feed"
          >
            <ExternalLink size={15} />
          </a>
        </div>

        <div className="flex items-center justify-between gap-3 text-[13px] text-[var(--muted)]">
          <div className="inline-flex items-center gap-2">
            <MapPin size={14} className="text-[var(--cool)]" />
            <span>
              {camera.lat.toFixed(3)}, {camera.lng.toFixed(3)}
            </span>
          </div>
          <span className="font-mono uppercase tracking-[0.14em] text-[var(--dim)]">
            {formatCameraAge(camera.lastCheckedAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
