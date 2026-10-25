"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type {
  ApiSourceResponse,
  TickerResponse,
  TickerItem,
} from "../../../types/dashboard";

function isTickerResponse(value: unknown): value is TickerResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    Array.isArray(value.items)
  );
}

function isApiSourceResponse(value: unknown): value is ApiSourceResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "sources" in value &&
    Array.isArray(value.sources)
  );
}

function sourceHealthClass(health?: string) {
  if (health === "live") {
    return "bg-[rgba(34,197,94,0.14)] text-[#22c55e]";
  }

  if (health === "stale") {
    return "bg-[rgba(245,158,11,0.14)] text-[#f59e0b]";
  }

  return "bg-[rgba(239,68,68,0.14)] text-[#ef4444]";
}

function tickerToneClass(item: TickerItem) {
  if (item.tone === "up") {
    return "text-[#f59e0b]";
  }

  if (item.tone === "down") {
    return "text-[var(--cool)]";
  }

  return "text-[var(--dim)]";
}

export default function ContextRail() {
  const [ticker, setTicker] = useState<TickerResponse | null>(null);
  const [sources, setSources] = useState<ApiSourceResponse | null>(null);

  const load = useCallback(async () => {
    try {
      const [tickerResponse, sourceResponse] = await Promise.all([
        fetch("/api/ticker"),
        fetch("/api/sources"),
      ]);

      const [tickerPayload, sourcePayload]: [unknown, unknown] = await Promise.all([
        tickerResponse.json(),
        sourceResponse.json(),
      ]);

      if (isTickerResponse(tickerPayload)) {
        setTicker(tickerPayload);
      }

      if (isApiSourceResponse(sourcePayload)) {
        setSources(sourcePayload);
      }
    } catch {
      setTicker(null);
      setSources(null);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void load();
    }, 0);
    const interval = setInterval(() => {
      void load();
    }, 2 * 60 * 1000);

    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [load]);

  return (
    <section
      data-testid="context-rail-zone"
      className="flex h-full flex-col overflow-hidden bg-[var(--bg-raised)] p-3"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
        <div>
          <div className="eyebrow">Context</div>
          <div className="pt-1 text-[17px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            Source health and compact pulse
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--dim)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--cool)]"
          aria-label="Refresh source health"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto pt-3">
        <div className="grid gap-2">
          {ticker?.items.slice(0, 4).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-[var(--line)] bg-[rgba(6,10,18,0.42)] p-3"
            >
              <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--dim)]">
                {item.label}
              </div>
              <div className="pt-2 text-[18px] font-bold tracking-[-0.03em] text-[var(--ink)]">
                {item.value}
              </div>
              <div
                className={`pt-1 text-[13px] font-mono uppercase tracking-[0.14em] ${tickerToneClass(
                  item,
                )}`}
              >
                {item.delta}
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[rgba(6,10,18,0.42)] p-3">
          <div className="eyebrow">Provenance</div>
          <div className="space-y-2 pt-3">
            {sources?.sources.slice(0, 6).map((source) => (
              <div
                key={source.id}
                className="rounded-xl border border-[var(--line)] bg-[rgba(248,246,240,0.02)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--ink)]">
                      {source.label}
                    </div>
                    <div className="pt-1 text-[13px] uppercase tracking-[0.14em] text-[var(--dim)]">
                      {source.target}
                    </div>
                  </div>
                  {source.health ? (
                    <span
                      className={`rounded-full px-2 py-1 text-[12px] font-bold uppercase tracking-[0.16em] ${sourceHealthClass(
                        source.health,
                      )}`}
                    >
                      {source.health}
                    </span>
                  ) : null}
                </div>
                <div className="truncate pt-2 text-[13px] font-mono text-[var(--dim)]">
                  {source.url}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
