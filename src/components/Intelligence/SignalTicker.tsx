"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import type { TickerResponse } from "../../types/dashboard";

function isTickerResponse(value: unknown): value is TickerResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    Array.isArray(value.items)
  );
}

const EMPTY_TICKER: TickerResponse = {
  items: [],
  generatedAt: new Date(0).toISOString(),
  mode: "live",
};

export default function SignalTicker({
  endpoint = "/api/ticker",
}: {
  endpoint?: string;
}) {
  const { buildUrl, isHistorical, timeWindow } = useTimeWindow();
  const [ticker, setTicker] = useState<TickerResponse>(EMPTY_TICKER);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(buildUrl(endpoint), { cache: "no-store" });
        const payload: unknown = await response.json();

        if (!response.ok) {
          setErrorCode(`HTTP_${response.status}`);
          setTicker(
            isHistorical
              ? { ...EMPTY_TICKER, items: [], mode: "historical-empty" }
              : { ...EMPTY_TICKER, generatedAt: new Date().toISOString() },
          );
          return;
        }

        if (isTickerResponse(payload)) {
          setErrorCode(null);
          setTicker(payload);
        }
      } catch {
        setErrorCode("FETCH_FAILED");
        setTicker(
          isHistorical
            ? { ...EMPTY_TICKER, items: [], mode: "historical-empty" }
            : { ...EMPTY_TICKER, generatedAt: new Date().toISOString() },
        );
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, 60_000);
    return () => clearInterval(interval);
  }, [buildUrl, endpoint, isHistorical, timeWindow]);

  if (ticker.items.length === 0) {
    return (
      <div
        className="flex items-center gap-3 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.16em] text-white/55"
        role="status"
        aria-live="polite"
      >
        {ticker.mode === "historical-empty" && timeWindow
          ? `No archived ticker snapshot for ${timeWindow.bangkokDay} ICT`
          : errorCode
            ? `LIVE UNAVAILABLE · ${errorCode}`
            : "Synchronizing signal ticker"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 animate-marquee whitespace-nowrap" role="status" aria-live="polite">
      {[...ticker.items, ...ticker.items].map((item, idx) => {
        const Icon =
          item.tone === "up"
            ? ArrowUpRight
            : item.tone === "down"
              ? ArrowDownRight
              : ArrowRight;

        return (
          <div
            key={`${item.id}-${idx}`}
            className="flex items-center gap-3 px-5 shrink-0"
          >
            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
              {item.label}
            </span>
            <span className="text-[11px] font-black tabular-nums tracking-tight">
              {item.value}
            </span>
            <span className={`flex items-center gap-0.5 text-[9px] font-black tabular-nums ${
              item.tone === "up" ? "text-[var(--safe)]" :
              item.tone === "down" ? "text-[var(--accent)]" :
              "text-[var(--dim)]"
            }`}>
              <Icon size={10} strokeWidth={3} />
              {item.delta}
            </span>
            <div className="h-2 w-[1px] bg-white/20 ml-2" />
          </div>
        );
      })}
    </div>
  );
}
