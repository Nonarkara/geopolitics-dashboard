"use client";

import { useEffect, useState, useCallback } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import type { BorderAreaId } from "../../lib/border-regions";

interface FrontierSignal {
  id: string;
  areaId: BorderAreaId;
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  severity: "alert" | "watch" | "stable";
  provider: string;
}

interface AllFrontierData {
  myanmar: FrontierSignal[];
  cambodia: FrontierSignal[];
  malaysia: FrontierSignal[];
}

const FRONTIER_COLORS: Record<BorderAreaId, string> = {
  "myanmar-frontier": "var(--accent)",
  "cambodia-frontier": "var(--hazard)",
  "malaysia-frontier": "var(--tech)",
  "deep-south": "var(--hazard)",
};

const FRONTIER_LABELS: Record<BorderAreaId, string> = {
  "myanmar-frontier": "MYA",
  "cambodia-frontier": "KHM",
  "malaysia-frontier": "MYS",
  "deep-south": "DPS",
};

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function BorderNewsFeed() {
  const [data, setData] = useState<AllFrontierData>({ myanmar: [], cambodia: [], malaysia: [] });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [mya, khm, mys] = await Promise.all([
        fetch("/api/border/frontier-news?area=myanmar-frontier", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/border/frontier-news?area=cambodia-frontier", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/border/frontier-news?area=malaysia-frontier", { cache: "no-store" }).then(r => r.json()),
      ]);
      setData({
        myanmar: mya.success ? mya.data.signals : [],
        cambodia: khm.success ? khm.data.signals : [],
        malaysia: mys.success ? mys.data.signals : [],
      });
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 120_000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Merge all signals and sort by date, keeping frontier tag
  const allSignals: FrontierSignal[] = [
    ...data.myanmar,
    ...data.cambodia,
    ...data.malaysia,
  ].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Count per frontier
  const counts = {
    myanmar: data.myanmar.length,
    cambodia: data.cambodia.length,
    malaysia: data.malaysia.length,
  };

  return (
    <section className="pt-3 border-t border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow text-white/90 flex items-center gap-2">
          <Newspaper size={10} className="text-[var(--tech)]" />
          Border News Feed
        </div>
        <span className="live-badge scale-75">LIVE</span>
      </div>

      {/* Frontier count chips */}
      <div className="flex items-center gap-1.5 mb-2">
        {(["myanmar-frontier", "cambodia-frontier", "malaysia-frontier"] as BorderAreaId[]).map(id => (
          <div
            key={id}
            className="flex items-center gap-1 px-1.5 py-0.5 border border-white/10"
            style={{ borderLeftColor: FRONTIER_COLORS[id], borderLeftWidth: "2px" }}
          >
            <span className="text-[8px] font-black tracking-wider" style={{ color: FRONTIER_COLORS[id] }}>
              {FRONTIER_LABELS[id]}
            </span>
            <span className="text-[8px] font-black tabular-nums opacity-40">
              {id === "myanmar-frontier" ? counts.myanmar : id === "cambodia-frontier" ? counts.cambodia : counts.malaysia}
            </span>
          </div>
        ))}
      </div>

      {/* News items */}
      <div className="space-y-1">
        {loading && allSignals.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.06] p-2 text-[8px] text-white/30 animate-pulse">
            Fetching border headlines…
          </div>
        ) : allSignals.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.06] p-2 text-[8px] text-white/30">
            No signals in current window
          </div>
        ) : (
          allSignals.slice(0, 12).map((signal) => (
            <a
              key={signal.id}
              href={signal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-white/10 bg-white/[0.03] p-2 hover:bg-white/[0.06] transition-colors group"
              style={{ borderLeftColor: FRONTIER_COLORS[signal.areaId], borderLeftWidth: "2px" }}
            >
              <div className="flex items-start gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-white/80 leading-tight line-clamp-2 group-hover:text-white">
                    {signal.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="text-[7px] font-black uppercase tracking-wider"
                      style={{ color: FRONTIER_COLORS[signal.areaId] }}
                    >
                      {FRONTIER_LABELS[signal.areaId]}
                    </span>
                    <span className="text-[7px] text-white/25">{signal.source}</span>
                    <span className="text-[7px] text-white/20">{timeAgo(signal.publishedAt)}</span>
                  </div>
                </div>
                <ExternalLink
                  size={7}
                  className="mt-0.5 shrink-0 text-white/15 group-hover:text-white/40"
                />
              </div>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
