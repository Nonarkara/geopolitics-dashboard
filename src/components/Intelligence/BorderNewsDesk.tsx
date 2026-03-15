"use client";

import { useEffect, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { fallbackNews } from "../../lib/mock-data";
import type { NewsResponse } from "../../types/dashboard";

function isNewsResponse(value: unknown): value is NewsResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "news" in value &&
    Array.isArray(value.news)
  );
}

function formatPublishedAt(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function BorderNewsDesk() {
  const [news, setNews] = useState<NewsResponse>(fallbackNews);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/border/news", { cache: "no-store" });
        const payload: unknown = await response.json();

        if (isNewsResponse(payload)) {
          setNews(payload);
        }
      } catch {
        setNews(fallbackNews);
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      data-testid="border-news-desk"
      className="flex h-full flex-col overflow-hidden border-l border-[var(--line)] bg-[linear-gradient(180deg,rgba(250,248,242,0.98)_0%,rgba(238,233,226,0.94)_100%)] select-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2.5">
        <div>
          <div className="eyebrow mb-1">Border News Wire</div>
          <div className="text-[11px] font-black uppercase tracking-[0.03em] text-[var(--ink)]">
            Refreshing headlines and cited sources
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.14em] text-[var(--dim)]">
          <RefreshCw size={11} />
          {formatPublishedAt(news.generatedAt)}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 no-scrollbar">
        {news.news.length > 0 ? (
          <div className="flex h-full flex-col gap-2.5">
            <article className="relative overflow-hidden border border-black bg-[linear-gradient(135deg,#fffdf9_0%,#f6efe4_100%)] p-3.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#ef4444_0%,#f59e0b_100%)]" />
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest ${
                    news.news[0].severity === "alert"
                      ? "bg-[var(--accent)] text-white"
                      : news.news[0].severity === "watch"
                        ? "bg-[var(--hazard)] text-black"
                        : "bg-[var(--line-dim)] text-[var(--ink)]"
                  }`}
                >
                  Lead {news.news[0].tag}
                </div>
                <span className="text-[8px] font-black tabular-nums opacity-35">
                  {formatPublishedAt(news.news[0].publishedAt)}
                </span>
              </div>

              <h3 className="mt-2 text-[14px] font-black uppercase leading-[1.15] tracking-tight text-[var(--ink)]">
                {news.news[0].title}
              </h3>
              <p className="mt-2 text-[10px] leading-[1.45] text-[var(--muted)] line-clamp-3">
                {news.news[0].summary}
              </p>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--line-dim)] pt-2">
                <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.14em] text-[var(--dim)]">
                  <Newspaper size={10} />
                  {news.news[0].source}
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.16em] text-[var(--tech)]">
                  cited
                </span>
              </div>
            </article>

            <div className="grid grid-cols-1 gap-2">
              {news.news.slice(1, 4).map((item) => (
                <article
                  key={item.id}
                  className="border border-[var(--line)] bg-white/78 px-3 py-2.5 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-[0.16em] opacity-40">
                        {item.tag}
                      </div>
                      <h3 className="mt-1 text-[11px] font-black uppercase leading-[1.2] tracking-tight text-[var(--ink)]">
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-[8px] font-black tabular-nums opacity-30">
                      {formatPublishedAt(item.publishedAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--line-dim)] pt-2">
                    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.14em] text-[var(--dim)]">
                      <Newspaper size={10} />
                      {item.source}
                    </span>
                    <span
                      className={`text-[8px] font-black uppercase tracking-[0.16em] ${
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
          <div className="flex h-full items-center justify-center border border-[var(--line-dim)] bg-white/70">
            <span className="eyebrow">Refreshing border headlines</span>
          </div>
        )}
      </div>
    </section>
  );
}
