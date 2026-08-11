"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import LoadingSkeleton from "../Common/LoadingSkeleton";
import { FreshnessDot } from "../Common/ProvenanceBadge";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import { formatBangkokDayLabel } from "../../lib/time-window";
import type { NewsResponse, SourceHealth } from "../../types/dashboard";

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

function ageLabel(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function sourceChipClass(status: SourceHealth["status"]) {
  if (status === "live") return "text-[var(--safe,#22c55e)] border-white/20";
  if (status === "stale") return "text-[var(--hazard,#f59e0b)] border-white/15";
  return "text-white/35 border-white/10";
}

const EMPTY_LIVE: NewsResponse = {
  news: [],
  generatedAt: new Date(0).toISOString(),
  mode: "live",
};

export default function BorderNewsDesk() {
  const { timeWindow, bangkokDay, buildUrl, isHistorical } = useTimeWindow();
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
  const [hasLoaded, setHasLoaded] = useState(isStatic);
  const hasLoadedRef = useRef(isStatic);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(buildUrl("/api/border/news"), {
          cache: "no-store",
          signal: AbortSignal.timeout(8_000),
        });
        const payload: unknown = await response.json();

        if (!response.ok) {
          const code =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as { error?: { code?: string } }).error?.code === "string"
              ? (payload as { error: { code: string } }).error.code
              : `HTTP_${response.status}`;
          setErrorCode(code);
          setNews(
            isHistorical
              ? { ...EMPTY_LIVE, news: [], mode: "historical-empty" }
              : { ...EMPTY_LIVE, news: [], generatedAt: new Date().toISOString() },
          );
          if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            setHasLoaded(true);
          }
          return;
        }

        if (isNewsResponse(payload)) {
          setErrorCode(payload.news.length === 0 ? "NO_MATCHED_HEADLINES" : null);
          setNews(payload);
          if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            setHasLoaded(true);
          }
        }
      } catch {
        setErrorCode("FETCH_FAILED");
        setNews(
          isHistorical
            ? { ...EMPTY_LIVE, news: [], mode: "historical-empty" }
            : { ...EMPTY_LIVE, news: [], generatedAt: new Date().toISOString() },
        );
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
          setHasLoaded(true);
        }
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, 30_000);

    return () => clearInterval(interval);
  }, [buildUrl, isHistorical, timeWindow]);

  const display = news ?? EMPTY_LIVE;
  const sources = display.sources ?? [];

  return (
    <section
      data-testid="border-news-desk"
      className="flex h-full flex-col overflow-hidden border-l border-white/10 bg-[var(--bg-panel)] select-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          <div className="eyebrow text-white/90 mb-0.5">Border News Wire</div>
          <div className="text-[10px] font-black uppercase tracking-[0.03em] text-white/90">
            Cited headlines with source links
          </div>
          {sources.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {sources.map((source) => (
                <span
                  key={source.id}
                  className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] ${sourceChipClass(source.status)}`}
                  title={source.message ?? source.label}
                >
                  {source.label}
                  <span className="opacity-50">· {source.status}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="inline-flex flex-col items-end gap-0.5 text-[8px] font-mono uppercase tracking-[0.14em] text-white/35 shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <FreshnessDot lastUpdated={display.generatedAt} />
            <RefreshCw size={10} />
            {display.generatedAt === EMPTY_LIVE.generatedAt
              ? "—"
              : formatHeaderTime(display.generatedAt)}
          </span>
          {display.generatedAt !== EMPTY_LIVE.generatedAt ? (
            <span className="opacity-50">{ageLabel(display.generatedAt)}</span>
          ) : null}
        </div>
      </div>

      {!hasLoaded ? (
        <div className="flex h-full flex-col gap-2 p-2.5">
          <LoadingSkeleton variant="list" />
          <LoadingSkeleton variant="list" count={3} className="space-y-1.5" />
        </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5 no-scrollbar">
        {isHistorical && timeWindow ? (
          <div className="mb-2 border border-white/10 bg-black px-2.5 py-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/70">
            Playback window: {formatBangkokDayLabel(bangkokDay ?? "")} ICT
          </div>
        ) : null}
        {display.news.length > 0 ? (
          <div className="flex h-full flex-col gap-2">
            <article className="relative overflow-hidden border border-white/10 bg-white/[0.03] p-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[var(--accent)]" />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest ${
                      display.news[0].severity === "alert"
                        ? "bg-[var(--accent)] text-white"
                        : display.news[0].severity === "watch"
                          ? "bg-[var(--hazard)] text-black"
                          : "bg-white/10 text-white/90"
                    }`}
                  >
                    Lead {display.news[0].tag}
                  </div>
                  {display.news[0].provider && (
                    <span className="text-[6px] font-black uppercase tracking-[0.16em] px-1 py-px bg-white/[0.06] text-white/35">
                      {display.news[0].provider}
                    </span>
                  )}
                </div>
                <time className="text-[7px] font-mono tabular-nums opacity-40">
                  {formatDatetime(display.news[0].publishedAt)}
                </time>
              </div>

              <h3 className="mt-1.5 text-[13px] font-black uppercase leading-[1.15] tracking-tight text-white/90">
                {display.news[0].sourceUrl ? (
                  <a
                    href={display.news[0].sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline decoration-[var(--accent)] underline-offset-2"
                  >
                    {display.news[0].title}
                  </a>
                ) : (
                  display.news[0].title
                )}
              </h3>
              <p className="mt-1.5 text-[9px] leading-[1.45] text-white/50 line-clamp-2">
                {display.news[0].summary}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-1.5">
                {display.news[0].sourceUrl ? (
                  <a
                    href={display.news[0].sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.14em] text-white/35 hover:text-white/90 transition-colors"
                    title={`Open source: ${display.news[0].source}`}
                  >
                    <Newspaper size={9} />
                    {display.news[0].source}
                    <ExternalLink size={7} className="opacity-40" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.14em] text-white/35">
                    <Newspaper size={9} />
                    {display.news[0].source}
                  </span>
                )}
                <span className="text-[7px] font-black uppercase tracking-[0.16em] text-[var(--tech)]">
                  cited
                </span>
              </div>
            </article>

            <div className="grid grid-cols-1 gap-1.5">
              {display.news.slice(1, 5).map((item) => (
                <article
                  key={item.id}
                  className="border border-white/10 bg-white/[0.04] px-2.5 py-2"
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
          <div className="flex h-full flex-col items-center justify-center gap-2 border border-white/[0.06] bg-white/[0.04] px-4 text-center">
            <span className="eyebrow text-white/90">
              {display.mode === "historical-empty"
                ? "No archived border headlines for this playback day"
                : "LIVE UNAVAILABLE"}
            </span>
            {errorCode && display.mode !== "historical-empty" ? (
              <span className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/40">
                {errorCode}
              </span>
            ) : null}
          </div>
        )}
      </div>
      )}
    </section>
  );
}
