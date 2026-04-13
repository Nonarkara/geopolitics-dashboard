"use client";

import { useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useLiveResource } from "../../hooks/useLiveResource";

interface FeedItem {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  tag?: string;
  publishedAt: string;
  severity?: string;
}

interface LiveIntelligenceFeedProps {
  endpoint?: string;
}

export default function LiveIntelligenceFeed({
  endpoint = "/api/border/news",
}: LiveIntelligenceFeedProps) {
  const fetcher = useCallback(
    () =>
      fetch(endpoint)
        .then((r) => r.json())
        .then((data) => data.news ?? data.items ?? data),
    [endpoint],
  );

  const { data: rawNews, isRefreshing, isStale, error, refresh } =
    useLiveResource<FeedItem[]>(fetcher, {
      cacheKey: `live-feed-${endpoint}`,
      intervalMs: 3 * 60 * 1000,
      isUsable: (items) => Array.isArray(items) && items.length > 0,
    });

  const news = Array.isArray(rawNews) ? rawNews : [];

  if (news.length === 0 && !error) {
    return (
      <div className="flex h-8 items-center justify-center">
        <span className="text-[9px] text-white/25 tracking-wide">
          Live headline feeds connecting...
        </span>
      </div>
    );
  }

  const sourceColor = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes("acled")) return "#ef4444";
    if (s.includes("gdelt") || s.includes("bbc") || s.includes("reuters")) return "#3b82f6";
    if (s.includes("firms") || s.includes("fire")) return "#f97316";
    if (s.includes("unhcr") || s.includes("refugee")) return "#22c55e";
    return "rgba(255,255,255,0.4)";
  };

  return (
    <div className="flex h-8 items-center overflow-hidden border-t border-white/10 bg-[linear-gradient(90deg,#07090d_0%,#0b1018_28%,#091018_100%)] px-4 text-white">
      {/* Badge */}
      <div className="flex items-center gap-3 mr-4 shrink-0">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded text-black"
          style={{
            background: isStale ? "#f59e0b" : "#3b82f6",
          }}
        >
          {isStale ? "STALE" : "LIVE INTEL"}
        </span>
        <button
          onClick={refresh}
          className="text-white/30 hover:text-white/60 transition-colors"
          title="Refresh feed"
        >
          <RefreshCw
            size={12}
            className={isRefreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Marquee */}
      <div className="flex-1 overflow-hidden relative">
        <div className="flex animate-marquee whitespace-nowrap gap-8">
          {[...news, ...news].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[10px]">
              <span
                className="font-bold uppercase tracking-wide"
                style={{ color: sourceColor(item.source), fontSize: "9px" }}
              >
                {item.source}:
              </span>
              <span className="text-white/60">{item.title}</span>
              {item.tag && (
                <span className="text-[8px] text-blue-400/60">
                  #{item.tag}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
