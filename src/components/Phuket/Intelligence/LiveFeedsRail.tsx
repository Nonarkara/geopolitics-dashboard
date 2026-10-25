"use client";

import { Camera, RefreshCw, Tv } from "lucide-react";
import LiveTVPanel from "./LiveTVPanel";
import PublicCameraCard from "./PublicCameraCard";
import { usePublicCameras } from "./usePublicCameras";

function formatGeneratedAt(value: string | null) {
  if (!value) {
    return "loading";
  }

  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function LiveFeedsRail() {
  const { cameras, generatedAt, reload } = usePublicCameras();

  return (
    <section
      data-testid="live-feeds-zone"
      className="flex h-full flex-col overflow-hidden bg-[var(--bg-raised)] p-3"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
        <div>
          <div className="eyebrow">Live feeds</div>
          <div className="pt-1 text-[17px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            TV wall + public cameras
          </div>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1 text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--dim)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--cool)]"
          aria-label="Refresh live feeds"
        >
          <RefreshCw size={14} />
          {formatGeneratedAt(generatedAt)}
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 pt-3 xl:grid-cols-[1.15fr_0.95fr]">
        <div className="min-h-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[rgba(6,10,18,0.44)] p-3">
          <div className="mb-2 flex items-center gap-2">
            <Tv size={14} className="text-[var(--cool)]" />
            <div className="eyebrow">Broadcast monitor</div>
          </div>
          <LiveTVPanel variant="rail" />
        </div>

        <div className="min-h-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[rgba(6,10,18,0.44)] p-3">
          <div className="mb-2 flex items-center gap-2">
            <Camera size={14} className="text-[var(--cool)]" />
            <div className="eyebrow">Public cameras</div>
          </div>
          <div className="grid h-full gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {cameras.map((camera) => (
              <PublicCameraCard key={camera.id} camera={camera} variant="rail" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
