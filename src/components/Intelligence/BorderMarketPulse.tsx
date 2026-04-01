"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Coins, ExternalLink, RefreshCw } from "lucide-react";
import { FreshnessDot } from "../Common/ProvenanceBadge";
import Sparkline from "../Common/Sparkline";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
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
  const { timeWindow } = useTimeWindow();
  const [payload, setPayload] = useState<MarketRadarResponse>(
    fallbackMarketRadarResponse,
  );

  useEffect(() => {
    const load = async () => {
      try {
        let url = "/api/markets";
        if (timeWindow) {
          url += `?from=${encodeURIComponent(timeWindow.from)}&to=${encodeURIComponent(timeWindow.to)}`;
        }
        const response = await fetch(url, { cache: "no-store" });
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
  }, [timeWindow]);

  // Sparkline historical data for each indicator
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const labels = payload.data.map((d) => d.label);
    if (labels.length === 0) return;

    Promise.all(
      labels.slice(0, 5).map(async (label) => {
        try {
          const res = await fetch(`/api/research/sparklines?metric=${encodeURIComponent(label)}&days=14`);
          const data = (await res.json()) as { values: number[] };
          return [label, data.values ?? []] as const;
        } catch {
          return [label, []] as const;
        }
      }),
    ).then((results) => {
      const map: Record<string, number[]> = {};
      for (const [label, values] of results) map[label] = [...values];
      setSparklines(map);
    });
  }, [payload.data]);

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
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2">
        <div>
          <div className="eyebrow mb-0.5">Market Pulse</div>
          <div className="text-[10px] font-black uppercase tracking-[0.03em] text-[var(--ink)]">
            Cross-border pricing with source links
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.14em] text-[var(--dim)]">
          <FreshnessDot lastUpdated={payload.generatedAt} />
          <RefreshCw size={10} />
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
                <div className="mt-1 flex items-end gap-2">
                  <span className="text-[31px] font-black tabular-nums leading-none tracking-[-0.04em]">
                    {formatIndicatorValue(primary)}
                  </span>
                  {sparklines[primary.label]?.length > 2 && (
                    <Sparkline
                      data={sparklines[primary.label]}
                      width={56}
                      height={20}
                      color={primary.up ? "#86efac" : "#fda4af"}
                      fillOpacity={0.15}
                    />
                  )}
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
            <div className="mt-2.5 grid grid-cols-2 gap-3 border-t border-white/10 pt-2.5 text-[8px] uppercase tracking-[0.14em] text-white/55">
              <div>
                <div>Sampled</div>
                <div className="mt-0.5 text-[9px] font-mono font-black tabular-nums leading-tight text-white/75">
                  {formatGeneratedAt(payload.generatedAt)} ICT
                </div>
              </div>
              <div>
                <div>Source</div>
                <a
                  href="https://open.er-api.com/v6/latest/USD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-black leading-tight text-white/75 hover:text-white transition-colors"
                >
                  {primary.source ?? "ExchangeRate API"}
                  <ExternalLink size={7} className="opacity-40" />
                </a>
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
              <div className="mt-1.5 text-[10px] font-black uppercase tracking-tight">
                {indicator.label}
              </div>
              <div className="flex items-end justify-between gap-1">
                <div className="text-[16px] font-black tabular-nums leading-none tracking-[-0.03em]">
                  {formatIndicatorValue(indicator)}
                </div>
                {sparklines[indicator.label]?.length > 2 && (
                  <Sparkline
                    data={sparklines[indicator.label]}
                    width={44}
                    height={14}
                    color={indicator.up ? "var(--safe)" : "var(--accent)"}
                  />
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[6px] font-mono uppercase tracking-[0.08em] opacity-35 border-t border-[var(--line-dim)] pt-1">
                <span>{indicator.source ?? "FX API"}</span>
                <span>·</span>
                <span className="tabular-nums">{formatGeneratedAt(payload.generatedAt)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-[var(--line-dim)] pt-2">
          <div className="mb-1.5 inline-flex items-center gap-2 text-[7px] font-mono uppercase tracking-[0.12em] text-[var(--dim)]">
            <Activity size={10} className="text-[var(--tech)]" />
            Source stack — verified providers
          </div>
          <div className="flex flex-wrap gap-1">
            {(
              [
                { label: "ExchangeRate API", url: "https://open.er-api.com" },
                { label: "World Bank WDI", url: "https://data.worldbank.org" },
                { label: "Binance", url: "https://api.binance.com" },
              ] as const
            ).map((source) => (
              <a
                key={source.label}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/70 px-2 py-0.5 text-[7px] font-mono uppercase tracking-[0.12em] text-[var(--dim)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
              >
                <Coins size={8} className="mr-1 opacity-60" />
                {source.label}
                <ExternalLink size={6} className="ml-0.5 opacity-30" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
