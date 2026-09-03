"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Tv, ExternalLink } from "lucide-react";

interface TVChannel {
  country: string;
  code: string;
  name: string;
  ytChannelId?: string;
  ytHandle?: string;
  externalUrl: string;
  color: string;
}

type LiveTVPanelVariant = "sidebar" | "rail";

const CHANNELS: TVChannel[] = [
  {
    country: "Thailand",
    code: "PBS",
    name: "Thai PBS News",
    ytHandle: "@ThaiPBSNews",
    externalUrl: "https://www.youtube.com/@ThaiPBSNews",
    color: "#38bdf8",
  },
  {
    country: "Thailand",
    code: "NBT",
    name: "NBT Connext",
    ytHandle: "@NBTConnext",
    externalUrl: "https://www.youtube.com/@NBTConnext",
    color: "#f59e0b",
  },
  {
    country: "Thailand",
    code: "TNN",
    name: "TNN Online",
    ytHandle: "@TNNOnline",
    externalUrl: "https://www.youtube.com/@TNNOnline",
    color: "#22c55e",
  },
  {
    country: "Thailand",
    code: "PPTV",
    name: "PPTV HD 36",
    ytHandle: "@PPTVHD36",
    externalUrl: "https://www.youtube.com/@PPTVHD36",
    color: "#a855f7",
  },
  {
    country: "Thailand",
    code: "NAT",
    name: "NationTV",
    ytHandle: "@NationTV22",
    externalUrl: "https://www.youtube.com/@NationTV22",
    color: "#ef4444",
  },
  {
    country: "Thailand",
    code: "AMR",
    name: "Amarin TV",
    ytHandle: "@AMARINTVHD",
    externalUrl: "https://www.youtube.com/@AMARINTVHD",
    color: "#f97316",
  },
];

function TVSlot({
  channel,
  variant,
}: {
  channel: TVChannel;
  variant: LiveTVPanelVariant;
}) {
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [dynamicId, setDynamicId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const compact = variant === "rail";

  useEffect(() => {
    if (!visible || !channel.ytHandle || dynamicId) {
      return;
    }

    fetch(`/api/live-tv?handle=${encodeURIComponent(channel.ytHandle)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.videoId) {
          setDynamicId(data.videoId);
          return;
        }

        setError(true);
      })
      .catch(() => setError(true));
  }, [channel.ytHandle, dynamicId, visible]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const embedUrl = channel.ytChannelId
    ? `https://www.youtube.com/embed/live_stream?channel=${channel.ytChannelId}&autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1&enablejsapi=1`
    : dynamicId
      ? `https://www.youtube.com/embed/${dynamicId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1&enablejsapi=1`
      : "";

  const toggleMute = useCallback(() => {
    if (!iframeRef.current?.contentWindow) {
      return;
    }

    const nextMuted = !muted;
    setMuted(nextMuted);
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: nextMuted ? "mute" : "unMute",
        args: [],
      }),
      "*",
    );
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "*",
    );
  }, [muted]);

  return (
    <div
      ref={containerRef}
      data-testid={`tv-card-${channel.code.toLowerCase()}`}
      className="relative flex flex-col overflow-hidden rounded-md border border-[var(--line-bright)] bg-[var(--bg)]"
    >
      <div className="relative aspect-video w-full bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Tv size={compact ? 14 : 16} className="text-[#ef4444]" />
            <span className="text-[13px] text-[var(--muted)]">Offline</span>
          </div>
        ) : visible && embedUrl ? (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={`${channel.name} Live`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen={false}
            className="absolute inset-0 h-full w-full origin-center scale-[1.35] transform-gpu pointer-events-none"
            style={{ border: "none" }}
            onLoad={() => {
              setLoaded(true);
              iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: "command", func: "playVideo", args: [] }),
                "*",
              );
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Tv size={compact ? 14 : 16} className="text-[var(--dim)]" />
          </div>
        )}

        {visible && !loaded && !error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-3 w-3 animate-spin rounded-full border border-[var(--cool)] border-t-transparent" />
          </div>
        ) : null}
      </div>

      <div
        className={`flex items-center justify-between bg-[var(--bg-surface)] ${
          compact ? "px-1.5 py-1" : "px-1.5 py-1.5"
        }`}
      >
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1">
            <span
              className={`${compact ? "text-[11px]" : "text-[12px]"} font-bold uppercase tracking-[0.1em]`}
              style={{ color: channel.color }}
            >
              {channel.code}
            </span>
            <span
              className={`${compact ? "text-[12px]" : "text-[12px]"} truncate font-bold uppercase tracking-[0.1em] text-[var(--muted)]`}
            >
              {channel.name}
            </span>
          </div>
          <span className="mt-0.5 flex items-center gap-0.5">
            <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-[#ef4444]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--dim)]">
              LIVE
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleMute}
            className={`flex items-center justify-center rounded-sm border border-[var(--line-bright)] bg-[var(--bg-raised)] text-[var(--ink)] transition-colors hover:bg-[var(--bg-surface)] hover:text-white ${
              compact ? "h-4 w-4" : "h-5 w-5"
            }`}
            title={muted ? "Unmute" : "Mute"}
            aria-label={`${muted ? "Unmute" : "Mute"} ${channel.name}`}
          >
            {muted ? (
              <VolumeX size={compact ? 8 : 10} />
            ) : (
              <Volume2 size={compact ? 8 : 10} />
            )}
          </button>
          <a
            href={channel.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center rounded-sm border border-[var(--line-bright)] bg-[var(--bg-raised)] text-[var(--ink)] transition-colors hover:bg-[var(--bg-surface)] hover:text-white ${
              compact ? "h-4 w-4" : "h-5 w-5"
            }`}
            title="Open Stream"
            aria-label={`Open stream for ${channel.name}`}
          >
            <ExternalLink size={compact ? 7 : 9} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LiveTVPanel({
  variant = "sidebar",
}: {
  variant?: LiveTVPanelVariant;
}) {
  const compact = variant === "rail";

  return (
    <section
      data-testid={`live-tv-panel-${variant}`}
      className={`flex h-full flex-col bg-[var(--bg-surface)] ${
        compact ? "p-0" : "p-3"
      } overflow-visible`}
    >
      <div
        className={`flex items-center justify-between ${
          compact ? "pb-1.5" : "pb-2"
        }`}
      >
        <div className="flex items-center gap-2">
          <Tv size={14} className="text-[var(--cool)]" />
          <div className="eyebrow">Thailand / south</div>
        </div>
        <span className="text-[12px] font-mono uppercase tracking-[0.12em] text-[var(--dim)]">
          6 channels
        </span>
      </div>

      <div
        className={`grid gap-1.5 ${
          compact ? "grid-cols-3 pt-0.5" : "grid-cols-2 pt-1"
        }`}
      >
        {CHANNELS.map((channel) => (
          <TVSlot key={channel.code} channel={channel} variant={variant} />
        ))}
      </div>

      <div
        className={`${compact ? "mt-1 text-[11px]" : "mt-1 text-[12px]"} font-mono tracking-[0.1em] text-[var(--dim)]`}
      >
        Source: YouTube Live feeds with strong Phuket and southern Thailand coverage
      </div>
    </section>
  );
}
