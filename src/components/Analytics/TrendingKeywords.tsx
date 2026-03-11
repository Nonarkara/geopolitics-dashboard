"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendItem {
  keyword: string;
  category: "conflict" | "border" | "politics" | "humanitarian" | "military";
  traffic: string;
  trendDirection: "up" | "down" | "stable";
  relatedCountries: string[];
  source: string;
}

interface TrendsPayload {
  keywords: TrendItem[];
  lastUpdated: string;
  source: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  conflict: "text-[#ef4444]",
  military: "text-[#f59e0b]",
  border: "text-[var(--cool)]",
  humanitarian: "text-[#22c55e]",
  politics: "text-[#a855f7]",
};

const CATEGORY_BG: Record<string, string> = {
  conflict: "bg-[rgba(239,68,68,0.15)]",
  military: "bg-[rgba(245,158,11,0.15)]",
  border: "bg-[var(--line-bright)]",
  humanitarian: "bg-[rgba(34,197,94,0.15)]",
  politics: "bg-[rgba(168,85,247,0.15)]",
};

function trafficToWidth(traffic: string): number {
  const num = parseInt(traffic.replace(/[^0-9]/g, ""), 10) || 0;
  if (num >= 500) return 100;
  if (num >= 200) return 80;
  if (num >= 100) return 65;
  if (num >= 50) return 50;
  if (num >= 20) return 35;
  return 20;
}

export default function TrendingKeywords() {
  const [payload, setPayload] = useState<TrendsPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/trends");
      const data: TrendsPayload = await res.json();
      setPayload(data);
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
    }, 5 * 60 * 1000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load().then(() => setTimeout(() => setRefreshing(false), 600));
  };

  if (!payload || payload.keywords.length === 0) {
    return (
      <div className="flex h-full items-center px-5">
        <span className="eyebrow">Scanning conflict keywords…</span>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col bg-[var(--bg-surface)] p-3 select-none overflow-hidden">
      <div className="flex items-center justify-between pb-2">
        <div>
          <div className="eyebrow">Conflict signals</div>
          <h3 className="pt-0.5 text-[13px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            Trending keywords
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} className="text-[var(--dim)] hover:text-[var(--cool)] transition-colors" title="Refresh trends">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          </button>
          <span className="live-badge">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
        {payload.keywords.slice(0, 8).map((item, idx) => {
          const DirIcon =
            item.trendDirection === "up"
              ? TrendingUp
              : item.trendDirection === "down"
                ? TrendingDown
                : Minus;

          return (
            <div
              key={`${item.keyword}-${idx}`}
              className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-1"
            >
              <span className="text-[8px] font-mono tabular-nums text-[var(--dim)] w-3">
                {idx + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[7px] font-bold uppercase tracking-[0.12em] px-1 py-0 rounded ${CATEGORY_BG[item.category]} ${CATEGORY_COLORS[item.category]}`}
                  >
                    {item.category}
                  </span>
                  <span className="truncate text-[10px] font-medium text-[var(--ink)]">
                    {item.keyword}
                  </span>
                </div>

                {/* Traffic bar */}
                <div className="mt-0.5 flex items-center gap-2">
                  <div className="h-[3px] flex-1 rounded-full bg-[var(--bg-raised)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.trendDirection === "up"
                          ? "bg-[#f59e0b]"
                          : item.trendDirection === "down"
                            ? "bg-[var(--cool)]"
                            : "bg-[#475569]"
                      }`}
                      style={{ width: `${trafficToWidth(item.traffic)}%` }}
                    />
                  </div>
                  <span className="text-[7px] font-mono tabular-nums text-[var(--muted)] shrink-0">
                    {item.traffic}
                  </span>
                </div>
              </div>

              <DirIcon
                size={10}
                className={
                  item.trendDirection === "up"
                    ? "text-[#f59e0b] shrink-0"
                    : item.trendDirection === "down"
                      ? "text-[var(--cool)] shrink-0"
                      : "text-[var(--dim)] shrink-0"
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1 text-[7px] font-mono tracking-[0.1em] text-[var(--dim)]">
        Source: Google Trends RSS (TH/KH/MM) · 5-min refresh
      </div>
    </section>
  );
}
