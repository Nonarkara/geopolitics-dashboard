"use client";

import { useEffect, useState, useCallback } from "react";
import { ExternalLink, AlertTriangle, Eye, Radio } from "lucide-react";
import type { BorderAreaId } from "../../lib/border-regions";

interface FrontierSignal {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  severity: "alert" | "watch" | "stable";
  provider: string;
}

interface FrontierIncident {
  id: string;
  title: string;
  type: string;
  location: string;
  fatalities: number;
  date: string;
}

interface FrontierData {
  areaId: BorderAreaId;
  areaLabel: string;
  counterpart: string;
  signals: FrontierSignal[];
  incidents: FrontierIncident[];
  humanitarian: { label: string; count: number; unit: string; asOf: string }[];
  histogram: number[];
  watchpoints: string[];
  generatedAt: string;
}

function severityIcon(severity: "alert" | "watch" | "stable") {
  switch (severity) {
    case "alert":
      return <AlertTriangle size={8} className="text-[var(--accent)]" />;
    case "watch":
      return <Eye size={8} className="text-[var(--hazard)]" />;
    default:
      return <Radio size={8} className="text-[var(--safe)]" />;
  }
}

function severityColor(severity: "alert" | "watch" | "stable") {
  switch (severity) {
    case "alert":
      return "var(--accent)";
    case "watch":
      return "var(--hazard)";
    default:
      return "var(--safe)";
  }
}

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MiniHistogram({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-px h-[28px]">
      {data.map((value, i) => (
        <div
          key={i}
          className="flex-1 min-w-[3px] transition-all"
          style={{
            height: `${Math.max(2, (value / max) * 100)}%`,
            backgroundColor:
              value === max && value > 0
                ? "var(--accent)"
                : value > 0
                  ? "rgba(255,255,255,0.4)"
                  : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

interface FrontierNewsPanelProps {
  areaId: BorderAreaId;
}

export default function FrontierNewsPanel({ areaId }: FrontierNewsPanelProps) {
  const [data, setData] = useState<FrontierData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFrontierNews = useCallback(async () => {
    try {
      const res = await fetch(`/api/border/frontier-news?area=${areaId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetchFrontierNews();
    const interval = setInterval(fetchFrontierNews, 60_000);
    return () => clearInterval(interval);
  }, [fetchFrontierNews]);

  if (loading && !data) {
    return (
      <div className="border border-white/10 bg-black/70 backdrop-blur-sm px-3 py-3">
        <div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40 animate-pulse">
          Loading frontier intelligence…
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="border border-white/10 bg-black/70 backdrop-blur-sm overflow-hidden">
      {/* Header with histogram */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/70">
            {data.counterpart} Headlines
          </span>
          <span className="text-[8px] font-mono text-white/30">
            {data.signals.length} signals
          </span>
        </div>
        <MiniHistogram data={data.histogram} />
        <div className="flex justify-between mt-0.5">
          <span className="text-[7px] text-white/25">7d ago</span>
          <span className="text-[7px] text-white/25">now</span>
        </div>
      </div>

      {/* Signals list */}
      <div className="max-h-[180px] overflow-y-auto">
        {data.signals.length === 0 && data.incidents.length === 0 ? (
          <div className="px-3 py-2 text-[8px] text-white/30">
            No active signals for this frontier
          </div>
        ) : (
          <>
            {data.signals.slice(0, 5).map((signal) => (
              <a
                key={signal.id}
                href={signal.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 px-3 py-1.5 border-b border-white/5 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="mt-0.5 shrink-0">{severityIcon(signal.severity)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-bold text-white/80 leading-tight line-clamp-2 group-hover:text-white">
                    {signal.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[7px] text-white/30">{signal.source}</span>
                    <span className="text-[7px] text-white/20">{timeAgo(signal.publishedAt)}</span>
                  </div>
                </div>
                <ExternalLink
                  size={7}
                  className="mt-1 shrink-0 text-white/20 group-hover:text-white/50"
                />
              </a>
            ))}
            {data.incidents.slice(0, 2).map((inc) => (
              <div
                key={inc.id}
                className="flex items-start gap-2 px-3 py-1.5 border-b border-white/5"
              >
                <div className="mt-0.5 shrink-0">
                  <AlertTriangle
                    size={8}
                    style={{ color: severityColor(inc.fatalities >= 1 ? "alert" : "watch") }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-bold text-white/80 leading-tight line-clamp-1">
                    {inc.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[7px] text-white/30">{inc.location}</span>
                    <span className="text-[7px] text-white/20">{inc.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Watchpoints footer */}
      {data.watchpoints.length > 0 && (
        <div className="px-3 py-1.5 border-t border-white/10 bg-white/[0.02]">
          <div className="text-[7px] font-black uppercase tracking-[0.12em] text-white/30 mb-0.5">
            Watchpoints
          </div>
          {data.watchpoints.slice(0, 2).map((wp, i) => (
            <div key={i} className="text-[8px] text-white/40 leading-tight truncate">
              • {wp}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
