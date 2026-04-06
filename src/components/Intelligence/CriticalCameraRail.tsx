"use client";

import Image from "next/image";
import { useState } from "react";
import { Camera, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import type { PublicCamera } from "../../types/dashboard";
import { CameraSkeleton } from "../Common/LoadingSkeleton";
import { FreshnessDot } from "../Common/ProvenanceBadge";
import { useCriticalCameras } from "./useCriticalCameras";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import { formatBangkokDayLabel } from "../../lib/time-window";
import { useNow } from "../../hooks/useNow";

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

function formatAbsoluteTime(value: string) {
  const d = new Date(value);
  const day = d.getDate();
  const mon = d.toLocaleString("en-GB", { month: "short" });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} ${mon} ${time}`;
}

function formatRelativeAge(value: string, nowMs: number | null) {
  if (nowMs === null) {
    return "(syncing)";
  }

  const diffMs = Math.max(0, nowMs - new Date(value).getTime());
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= 1) {
    return "(just now)";
  }

  if (diffMinutes < 60) {
    return `(${diffMinutes}m ago)`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  return `(${diffHours}h ago)`;
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

function validationClass(validationState: PublicCamera["validationState"]) {
  return validationState === "candidate" ? "stat-pill warning" : "stat-pill safe";
}

function CriticalCameraCard({ camera, nowMs }: { camera: PublicCamera; nowMs: number | null }) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedStatus = imageFailed ? "offline" : camera.status;

  return (
    <article
      data-testid={`critical-camera-card-${camera.id}`}
      className="flex h-full w-[200px] shrink-0 flex-col overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#0b1018_0%,#121925_100%)] text-white"
    >
      <div className="relative h-[110px] overflow-hidden bg-black">
        {camera.snapshotUrl && !imageFailed ? (
          <Image
            src={camera.snapshotUrl}
            alt={`${camera.label} camera`}
            fill
            unoptimized
            sizes="200px"
            className="object-cover"
            onError={() => setImageFailed(true)}
            onLoad={() => setImageFailed(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[rgba(255,255,255,0.04)]">
            <div className="flex flex-col items-center gap-1 text-white/45">
              <Camera size={18} />
              <span className="text-[8px] font-black uppercase tracking-[0.16em]">
                Feed unavailable
              </span>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,15,0.18)_0%,rgba(4,8,15,0.1)_35%,rgba(4,8,15,0.88)_100%)]" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-2 py-2">
          <span className={`${statusClass(resolvedStatus)} text-[7px]`}>
            {resolvedStatus}
          </span>
          <span className={`${focusClass(camera.category)} text-[7px]`}>
            {camera.focusArea ?? camera.category}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-2.5 py-2">
        <div className="min-h-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
              {camera.locationLabel ?? camera.provider}
            </div>
            <span className={`${validationClass(camera.validationState)} text-[7px]`}>
              {camera.validationState}
            </span>
          </div>
          <h3 className="mt-1 text-[12px] font-black uppercase leading-tight tracking-tight text-white">
            {camera.label}
          </h3>
        </div>

        <p className="h-[38px] overflow-hidden text-[9px] leading-[1.35] text-white/64">
          {camera.strategicNote ?? camera.provider}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-1.5 text-[8px] font-mono tabular-nums text-white/38">
          <span>
            {formatAbsoluteTime(camera.lastCheckedAt)}{" "}
            <span className="text-white/25">{formatRelativeAge(camera.lastCheckedAt, nowMs)}</span>
          </span>
          <a
            href={camera.sourcePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-white/82 transition-colors hover:text-[#fda4af]"
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
  const { isHistorical, timeWindow } = useTimeWindow();
  const { cameras, generatedAt, reload } = useCriticalCameras();
  const nowMs = useNow(60_000);
  const verifiedCount = cameras.filter(
    (camera) => camera.validationState === "verified",
  ).length;
  const candidateCount = cameras.filter(
    (camera) => camera.validationState === "candidate",
  ).length;

  return (
    <section
      data-testid="critical-camera-rail"
      className="flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#05070b_0%,#0b1017_100%)] text-white select-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5">
        <div>
          <div className="eyebrow mb-1">Critical CCTV</div>
          <div className="text-[11px] font-black uppercase tracking-[0.03em] text-white">
            Border chokepoints, scout coverage, and live visual confirmation
          </div>
          {isHistorical && timeWindow ? (
            <div className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-[#fda4af]">
              Live reference only during playback for {formatBangkokDayLabel(timeWindow.bangkokDay)}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <FreshnessDot lastUpdated={generatedAt} />
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-2 border border-white/12 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/65 transition-colors hover:border-white/25 hover:text-white"
            aria-label="Refresh critical camera feeds"
          >
            <RefreshCw size={12} />
            {formatGeneratedAt(generatedAt)}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10 px-3 py-2 text-[8px] font-mono uppercase tracking-[0.14em] text-white/42">
        <div className="inline-flex items-center gap-1.5">
          <Camera size={11} className="text-[#f97316]" />
          {cameras.length || 0} feeds
        </div>
        <div className="inline-flex items-center gap-1.5">
          <MapPin size={11} className="text-[#67e8f9]" />
          {verifiedCount} verified / {candidateCount} scout
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-2.5">
        {cameras.length > 0 ? (
          <div className="no-scrollbar flex h-full gap-2.5 overflow-x-auto">
            {cameras.map((camera) => (
              <CriticalCameraCard key={camera.id} camera={camera} nowMs={nowMs} />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 px-3 py-2">
            <CameraSkeleton />
            <CameraSkeleton />
            <CameraSkeleton />
          </div>
        )}
      </div>
    </section>
  );
}
