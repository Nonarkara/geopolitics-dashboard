"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Coins, ExternalLink, RefreshCw } from "lucide-react";
import LoadingSkeleton from "../Common/LoadingSkeleton";
import AnimatedNumber from "../Common/AnimatedNumber";
import { FreshnessDot } from "../Common/ProvenanceBadge";
import Sparkline from "../Common/Sparkline";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import { fallbackMarketRadarResponse } from "../../lib/mock-data";
import { formatBangkokDayLabel } from "../../lib/time-window";
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
  const { timeWindow, bangkokDay, buildUrl, isHistorical } = useTimeWindow();
  const [payload, setPayload] = useState<MarketRadarResponse>(
    fallbackMarketRadarResponse,
  );
  const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
  const [hasLoaded, setHasLoaded] = useState(isStatic);
  const hasLoadedRef = useRef(isStatic);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(buildUrl("/api/markets"), { cache: "no-store" });
        const nextPayload: unknown = await response.json();

        if (isMarketRadarResponse(nextPayload)) {
          setPayload(nextPayload);
          if (!hasLoadedRef.current) { hasLoadedRef.current = true; setHasLoaded(true); }
          return;
        }

        if (isEconomicIndicatorArray(nextPayload)) {
          setPayload({
            ...fallbackMarketRadarResponse,
            generatedAt: new Date().toISOString(),
            data: nextPayload,
            signals: nextPayload,
          });
          if (!hasLoadedRef.current) { hasLoadedRef.current = true; setHasLoaded(true); }
        }
      } catch {
        setPayload(isHistorical ? { ...fallbackMarketRadarResponse, data: [], signals: [], aseanGdp: [], mode: "historical-empty" } : fallbackMarketRadarResponse);
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, 60_000);

    return () => clearInterval(interval);
  }, [buildUrl, isHistorical, timeWindow]);

  // Sparkline historical data for each indicator
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const labels = payload.data.map((d) => d.label);
    if (labels.length === 0) return;

    Promise.all(
      labels.slice(0, 5).map(async (label) => {
        try {
          const url = buildUrl("/api/research/sparklines", {
            metric: label,
            days: 14,
          });
          const res = await fetch(url);
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
  }, [buildUrl, payload.data]);

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
      className="flex h-full flex-col overflow-hidden border-r border-white/10 bg-[var(--bg-panel)] select-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div>
          <div className="eyebrow mb-0.5 text-white/90">Market Pulse</div>
          <div className="text-[10px] font-black uppercase tracking-[0.03em] text-white/90">
            {payload.mode === "historical-empty"
              ? "No archived market snapshot for this playback day"
              : "Cross-border pricing with source links"}
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.14em] text-white/35">
          <FreshnessDot lastUpdated={payload.generatedAt} />
          <RefreshCw size={10} />
          {formatGeneratedAt(payload.generatedAt)}
        </div>
      </div>

      {!hasLoaded ? (
        <div className="flex flex-1 flex-col gap-2.5 p-3">
          <LoadingSkeleton variant="card" />
          <div className="grid grid-cols-2 gap-2">
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
          </div>
        </div>
      ) : (
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {isHistorical && timeWindow ? (
          <div className="border border-white/10 bg-black px-2.5 py-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/70">
            Playback window: {bangkokDay ? formatBangkokDayLabel(bangkokDay) : ""} ICT
          </div>
        ) : null}
        {payload.mode === "historical-empty" ? (
          <div className="flex flex-1 items-center justify-center border border-dashed border-white/10 bg-white/[0.04] px-4 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
            No archived market data for this Bangkok command day.
          </div>
        ) : null}
        {primary ? (
          <div className="relative overflow-hidden border border-white/15 bg-black p-3 text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[var(--accent)]" />
            <div className="flex items-center justify-between gap-2">
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
                Primary FX anchor
              </div>
              <span className="border border-white/15 bg-white/10 px-2 py-1 text-[7px] font-black uppercase tracking-[0.16em] text-white/80">
                {primary.source ?? "FX"}
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                  {primary.label}
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <AnimatedNumber value={typeof primary.value === 'number' ? primary.value : 0} format={(n) => formatIndicatorValue({...primary, value: n})} className="text-[31px] font-black tabular-nums leading-none tracking-[-0.04em]" />
                  {sparklines[primary.label]?.length > 2 && (
                    <Sparkline
                      data={sparklines[primary.label]}
                      width={56}
                      height={20}
                      color="var(--accent)"
                      fillOpacity={0.15}
                    />
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-[11px] font-black tabular-nums ${
                    "text-[var(--accent)]"
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

        {payload.mode !== "historical-empty" ? (
          <div className="grid grid-cols-2 gap-2">
            {secondary.slice(0, 4).map((indicator) => (
              <div
                key={indicator.label}
                className="border border-white/10 bg-white/[0.04] p-2.5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.16em] opacity-40">
                    {indicator.category ?? "signal"}
                  </span>
                  <span
                    className={`text-[8px] font-black tabular-nums ${
                      indicator.up ? "text-white/70" : "text-[var(--accent)]"
                    }`}
                  >
                    {formatIndicatorChange(indicator.change)}
                  </span>
                </div>
                <div className="mt-1.5 text-[10px] font-black uppercase tracking-tight">
                  {indicator.label}
                </div>
                <div className="flex items-end justify-between gap-1">
                  <AnimatedNumber value={typeof indicator.value === 'number' ? indicator.value : 0} format={(n) => formatIndicatorValue({...indicator, value: n})} className="text-[16px] font-black tabular-nums leading-none tracking-[-0.03em]" />
                  {sparklines[indicator.label]?.length > 2 && (
                    <Sparkline
                      data={sparklines[indicator.label]}
                      width={44}
                      height={14}
                      color={indicator.up ? "var(--ink-dim)" : "var(--accent)"}
                    />
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1 border-t border-white/[0.06] pt-1 text-[6px] font-mono uppercase tracking-[0.08em] opacity-35">
                  <span>{indicator.source ?? "FX API"}</span>
                  <span>·</span>
                  <span className="tabular-nums">{formatGeneratedAt(payload.generatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {payload.mode !== "historical-empty" ? (
          <div className="mt-auto border-t border-white/[0.06] pt-2">
            <div className="mb-1.5 inline-flex items-center gap-2 text-[7px] font-mono uppercase tracking-[0.12em] text-white/35">
              <Activity size={10} className="text-[var(--accent)]" />
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
                  className="inline-flex items-center border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[7px] font-mono uppercase tracking-[0.12em] text-white/35 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Coins size={8} className="mr-1 opacity-60" />
                  {source.label}
                  <ExternalLink size={6} className="ml-0.5 opacity-30" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      )}
    </section>
  );
}
