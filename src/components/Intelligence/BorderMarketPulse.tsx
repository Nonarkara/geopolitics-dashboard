"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Coins, RefreshCw } from "lucide-react";
import { fallbackMarketRadarResponse } from "../../lib/mock-data";
import type {
  EconomicIndicator,
  MarketRadarResponse,
} from "../../types/dashboard";

function isEconomicIndicatorArray(value: unknown): value is EconomicIndicator[] {
  return Array.isArray(value);
}

function isMarketRadarResponse(value: unknown): value is MarketRadarResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray(value.data) &&
    "sources" in value &&
    Array.isArray(value.sources)
  );
}

function formatGeneratedAt(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatIndicatorValue(indicator: EconomicIndicator) {
  if (typeof indicator.value === "number") {
    if (indicator.value >= 1000 && indicator.label !== "USD/THB") {
      return indicator.value.toLocaleString();
    }

    return indicator.value.toFixed(2).replace(/\.00$/, "");
  }

  return String(indicator.value);
}

function formatIndicatorChange(change: number | string) {
  if (typeof change !== "number") {
    return String(change);
  }

  if (change === 0) {
    return "live";
  }

  return `${change > 0 ? "+" : ""}${change.toFixed(2).replace(/\.00$/, "")}`;
}

export default function BorderMarketPulse() {
  const [payload, setPayload] = useState<MarketRadarResponse>(
    fallbackMarketRadarResponse,
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/markets", { cache: "no-store" });
        const nextPayload: unknown = await response.json();

        if (isMarketRadarResponse(nextPayload)) {
          setPayload(nextPayload);
          return;
        }

        if (isEconomicIndicatorArray(nextPayload)) {
          setPayload({
            ...fallbackMarketRadarResponse,
            generatedAt: new Date().toISOString(),
            data: nextPayload,
            signals: nextPayload,
          });
        }
      } catch {
        setPayload(fallbackMarketRadarResponse);
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const primary = useMemo(
    () =>
      payload.data.find((indicator) => indicator.label === "USD/THB") ??
      payload.data[0] ??
      null,
    [payload.data],
  );

  const secondary = useMemo(
    () =>
      payload.data.filter((indicator) =>
        ["MYR/THB", "SGD/THB", "BTC/USD", "SET Index"].includes(indicator.label),
      ),
    [payload.data],
  );

  return (
    <section
      data-testid="border-market-pulse"
      className="flex h-full flex-col overflow-hidden border-r border-[var(--line)] bg-[linear-gradient(180deg,rgba(248,246,240,0.98)_0%,rgba(238,236,228,0.96)_100%)] select-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2.5">
        <div>
          <div className="eyebrow mb-1">Market Pulse</div>
          <div className="text-[11px] font-black uppercase tracking-[0.03em] text-[var(--ink)]">
            Cross-border pricing and source confidence
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.14em] text-[var(--dim)]">
          <RefreshCw size={11} />
          {formatGeneratedAt(payload.generatedAt)}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {primary ? (
          <div className="relative overflow-hidden border border-black bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_36%),linear-gradient(135deg,#06090f_0%,#121722_100%)] p-3 text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#f97316_0%,#facc15_45%,#22c55e_100%)]" />
            <div className="flex items-center justify-between gap-2">
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
                Primary FX anchor
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[7px] font-black uppercase tracking-[0.16em] text-white/80">
                {primary.source ?? "FX"}
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                  {primary.label}
                </div>
                <div className="mt-1 text-[31px] font-black tabular-nums leading-none tracking-[-0.04em]">
                  {formatIndicatorValue(primary)}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-[11px] font-black tabular-nums ${
                    primary.up ? "text-[#86efac]" : "text-[#fda4af]"
                  }`}
                >
                  {formatIndicatorChange(primary.change)}
                </div>
                <div className="mt-1 text-[8px] font-black uppercase tracking-[0.16em] text-white/35">
                  1 USD in baht today
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-[9px] uppercase tracking-[0.14em] text-white/55">
              <div>
                <div>Use</div>
                <div className="mt-1 text-[10px] font-black leading-tight text-white/85">
                  procurement and trade guidance
                </div>
              </div>
              <div>
                <div>Status</div>
                <div className="mt-1 text-[10px] font-black leading-tight text-white/85">
                  live provider value, not fallback
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          {secondary.slice(0, 4).map((indicator) => (
            <div
              key={indicator.label}
              className="border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-2.5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] font-black uppercase tracking-[0.16em] opacity-40">
                  {indicator.category ?? "signal"}
                </span>
                <span
                  className={`text-[8px] font-black tabular-nums ${
                    indicator.up ? "text-[var(--safe)]" : "text-[var(--accent)]"
                  }`}
                >
                  {formatIndicatorChange(indicator.change)}
                </span>
              </div>
              <div className="mt-2 text-[11px] font-black uppercase tracking-tight">
                {indicator.label}
              </div>
              <div className="mt-1 text-[17px] font-black tabular-nums leading-none tracking-[-0.03em]">
                {formatIndicatorValue(indicator)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-[var(--line-dim)] pt-2.5">
          <div className="mb-2 inline-flex items-center gap-2 text-[8px] font-mono uppercase tracking-[0.12em] text-[var(--dim)]">
            <Activity size={11} className="text-[var(--tech)]" />
            Source stack
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(payload.sources.length > 0
              ? payload.sources
              : ["ExchangeRate API (fallback)", "World Bank WDI"]
            ).map((source) => (
              <span
                key={source}
                className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/70 px-2 py-1 text-[8px] font-mono uppercase tracking-[0.12em] text-[var(--dim)]"
              >
                <Coins size={9} className="mr-1 opacity-60" />
                {source}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
