"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { fallbackNews } from "../../lib/mock-data";
import { FreshnessDot } from "../Common/ProvenanceBadge";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import { formatBangkokDayLabel } from "../../lib/time-window";
import type { NewsResponse } from "../../types/dashboard";

function isNewsResponse(value: unknown): value is NewsResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "news" in value &&
    Array.isArray(value.news)
  );
}

function formatDatetime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatHeaderTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function BorderNewsDesk() {
  const { timeWindow, bangkokDay, buildUrl, isHistorical } = useTimeWindow();
  const [news, setNews] = useState<NewsResponse>(fallbackNews);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(buildUrl("/api/border/news"), { cache: "no-store" });
        const payload: unknown = await response.json();

        if (isNewsResponse(payload)) {
          setNews(payload);
        }
      } catch {
        setNews(isHistorical ? { ...fallbackNews, news: [], mode: "historical-empty" } : fallbackNews);
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, 30_000);

    return () => clearInterval(interval);
  }, [buildUrl, isHistorical, timeWindow]);

  return (
    <section
      data-testid="border-news-desk"
      className="flex h-full flex-col overflow-hidden border-l border-white/10 bg-[linear-gradient(180deg,#08090e_0%,#0c0f16_100%)] select-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div>
          <div className="eyebrow text-white/90 mb-0.5">Border News Wire</div>
          <div className="text-[10px] font-black uppercase tracking-[0.03em] text-white/90">
            Cited headlines with source links
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.14em] text-white/35">
          <FreshnessDot lastUpdated={news.generatedAt} />
          <RefreshCw size={10} />
          {formatHeaderTime(news.generatedAt)}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5 no-scrollbar">
        {isHistorical && timeWindow ? (
          <div className="mb-2 rounded-sm border border-white/10 bg-black px-2.5 py-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/70">
            Playback window: {formatBangkokDayLabel(bangkokDay ?? "")} ICT
          </div>
        ) : null}
        {news.news.length > 0 ? (
          <div className="flex h-full flex-col gap-2">
            {/* LEAD STORY */}
            <article className="relative overflow-hidden border border-white/10 bg-white/[0.03] p-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#ef4444_0%,#f59e0b_100%)]" />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest ${
                      news.news[0].severity === "alert"
                        ? "bg-[var(--accent)] text-white"
                        : news.news[0].severity === "watch"
                          ? "bg-[var(--hazard)] text-black"
                          : "bg-white/10 text-white/90"
                    }`}
                  >
                    Lead {news.news[0].tag}
                  </div>
                  {news.news[0].provider && (
                    <span className="text-[6px] font-black uppercase tracking-[0.16em] px-1 py-px bg-white/[0.06] text-white/35">
                      {news.news[0].provider}
                    </span>
                  )}
                </div>
                <time className="text-[7px] font-mono tabular-nums opacity-40">
                  {formatDatetime(news.news[0].publishedAt)}
                </time>
              </div>

              <h3 className="mt-1.5 text-[13px] font-black uppercase leading-[1.15] tracking-tight text-white/90">
                {news.news[0].sourceUrl ? (
                  <a
                    href={news.news[0].sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline decoration-[var(--accent)] underline-offset-2"
                  >
                    {news.news[0].title}
                  </a>
                ) : (
                  news.news[0].title
                )}
              </h3>
              <p className="mt-1.5 text-[9px] leading-[1.45] text-white/50 line-clamp-2">
                {news.news[0].summary}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-1.5">
                {news.news[0].sourceUrl ? (
                  <a
                    href={news.news[0].sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.14em] text-white/35 hover:text-white/90 transition-colors"
                    title={`Open source: ${news.news[0].source}`}
                  >
                    <Newspaper size={9} />
                    {news.news[0].source}
                    <ExternalLink size={7} className="opacity-40" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.14em] text-white/35">
                    <Newspaper size={9} />
                    {news.news[0].source}
                  </span>
                )}
                <span className="text-[7px] font-black uppercase tracking-[0.16em] text-[var(--tech)]">
                  cited
                </span>
              </div>
            </article>

            {/* SECONDARY STORIES */}
            <div className="grid grid-cols-1 gap-1.5">
              {news.news.slice(1, 5).map((item) => (
                <article
                  key={item.id}
                  className="border border-white/10 bg-white/[0.04] px-2.5 py-2 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] font-black uppercase tracking-[0.16em] opacity-40">
                          {item.tag}
                        </span>
                        {item.provider && (
                          <span className="text-[6px] font-black uppercase tracking-[0.12em] px-1 py-px bg-white/[0.06] text-white/35">
                            {item.provider}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-0.5 text-[10px] font-black uppercase leading-[1.2] tracking-tight text-white/90">
                        {item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline decoration-[var(--accent)] underline-offset-2"
                          >
                            {item.title}
                          </a>
                        ) : (
                          item.title
                        )}
                      </h3>
                    </div>
                    <time className="text-[7px] font-mono tabular-nums opacity-30 shrink-0 whitespace-nowrap">
                      {formatDatetime(item.publishedAt)}
                    </time>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-1">
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-white/35 hover:text-white/90 transition-colors"
                      >
                        <Newspaper size={8} />
                        {item.source}
                        <ExternalLink size={6} className="opacity-40" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.14em] text-white/35">
                        <Newspaper size={8} />
                        {item.source}
                      </span>
                    )}
                    <span
                      className={`text-[7px] font-black uppercase tracking-[0.16em] ${
                        item.severity === "alert"
                          ? "text-[var(--accent)]"
                          : item.severity === "watch"
                            ? "text-[var(--hazard)]"
                            : "text-[var(--tech)]"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border border-white/[0.06] bg-white/[0.04]">
            <span className="eyebrow text-white/90">
              {news.mode === "historical-empty"
                ? "No archived border headlines for this playback day"
                : "Refreshing border headlines"}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
