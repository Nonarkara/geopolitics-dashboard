"use client";

import Image from "next/image";
import { useState } from "react";
import { Camera, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import type { PublicCamera } from "../../types/dashboard";
import { useCriticalCameras } from "./useCriticalCameras";

function formatGeneratedAt(value: string | null) {
  if (!value) {
    return "syncing";
  }

  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

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
    return "stat-pill safe";
  }

  if (status === "stale") {
    return "stat-pill warning";
  }

  return "stat-pill danger";
}

function focusClass(category: PublicCamera["category"]) {
  if (category === "border") {
    return "stat-pill danger";
  }

  if (category === "capital") {
    return "stat-pill warning";
  }

  return "stat-pill info";
}

function CriticalCameraCard({ camera }: { camera: PublicCamera }) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedStatus = imageFailed ? "offline" : camera.status;

  return (
    <article
      data-testid={`critical-camera-card-${camera.id}`}
      className="flex h-full w-[192px] shrink-0 flex-col border border-[var(--line)] bg-white"
    >
      <div className="relative h-[92px] overflow-hidden bg-[var(--bg)]">
        {camera.snapshotUrl && !imageFailed ? (
          <Image
            src={camera.snapshotUrl}
            alt={`${camera.label} camera`}
            fill
            unoptimized
            sizes="192px"
            className="object-cover"
            onError={() => setImageFailed(true)}
            onLoad={() => setImageFailed(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg)]">
            <div className="flex flex-col items-center gap-1 text-[var(--dim)]">
              <Camera size={18} />
              <span className="text-[8px] font-black uppercase tracking-[0.16em]">
                Feed unavailable
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-2 py-2">
          <span className={`${statusClass(resolvedStatus)} text-[7px]`}>
            {resolvedStatus}
          </span>
          <span className={`${focusClass(camera.category)} text-[7px]`}>
            {camera.focusArea ?? camera.category}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2">
        <div className="min-h-0">
          <div className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--dim)]">
            {camera.locationLabel ?? camera.provider}
          </div>
          <h3 className="mt-1 text-[11px] font-black uppercase leading-tight tracking-tight text-[var(--ink)]">
            {camera.label}
          </h3>
        </div>

        <p className="h-[34px] overflow-hidden text-[9px] leading-[1.25] text-[var(--muted)]">
          {camera.strategicNote ?? camera.provider}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--line-dim)] pt-2 text-[8px] font-mono uppercase text-[var(--dim)]">
          <span>{formatCameraAge(camera.lastCheckedAt)}</span>
          <a
            href={camera.sourcePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
            aria-label={`Open source feed for ${camera.label}`}
          >
            <ExternalLink size={11} />
            Source
          </a>
        </div>
      </div>
    </article>
  );
}

export default function CriticalCameraRail() {
  const { cameras, generatedAt, reload } = useCriticalCameras();

  return (
    <section
      data-testid="critical-camera-rail"
      className="flex h-full flex-col bg-[var(--bg-surface)] select-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2">
        <div>
          <div className="eyebrow mb-1">Critical CCTV</div>
          <div className="text-[11px] font-black uppercase tracking-[0.03em] text-[var(--ink)]">
            Public cameras across crossings, logistics hubs, and the capital grid
          </div>
        </div>

        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex shrink-0 items-center gap-2 border border-[var(--line)] px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--dim)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          aria-label="Refresh critical camera feeds"
        >
          <RefreshCw size={12} />
          {formatGeneratedAt(generatedAt)}
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-[var(--line-dim)] px-3 py-2 text-[8px] font-mono uppercase tracking-[0.14em] text-[var(--dim)]">
        <div className="inline-flex items-center gap-1.5">
          <Camera size={11} className="text-[var(--accent)]" />
          {cameras.length || 0} feeds
        </div>
        <div className="inline-flex items-center gap-1.5">
          <MapPin size={11} className="text-[var(--tech)]" />
          Strategic chokepoints
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-2">
        {cameras.length > 0 ? (
          <div className="no-scrollbar flex h-full gap-2 overflow-x-auto">
            {cameras.map((camera) => (
              <CriticalCameraCard key={camera.id} camera={camera} />
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border border-[var(--line-dim)] bg-[var(--bg)]">
            <span className="eyebrow">Pulling public camera feeds</span>
          </div>
        )}
      </div>
    </section>
  );
}
