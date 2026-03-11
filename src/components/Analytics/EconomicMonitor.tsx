"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { fallbackEconomicIndicators } from "../../lib/mock-data";
import type { EconomicIndicator } from "../../types/dashboard";

const isEconomicIndicatorArray = (value: unknown): value is EconomicIndicator[] =>
  Array.isArray(value);

export default function EconomicMonitor() {
  const [indicators, setIndicators] = React.useState<EconomicIndicator[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchEconomics = React.useCallback(async () => {
    try {
      const res = await fetch("/api/markets");
      const payload: unknown = await res.json();

      if (isEconomicIndicatorArray(payload)) {
        setIndicators(payload);
        return;
      }

      if (
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        isEconomicIndicatorArray(payload.data)
      ) {
        setIndicators(payload.data);
        return;
      }

      setIndicators(fallbackEconomicIndicators);
    } catch {
      setIndicators(fallbackEconomicIndicators);
    }
  }, []);

  React.useEffect(() => {
    fetchEconomics();
    const interval = setInterval(fetchEconomics, 90 * 1000);
    return () => clearInterval(interval);
  }, [fetchEconomics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEconomics().then(() => setTimeout(() => setRefreshing(false), 600));
  };

  if (indicators.length === 0) {
    return (
      <div className="flex h-full items-center px-5">
        <span className="eyebrow">Synchronizing market signals</span>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col bg-[var(--bg-surface)] p-4 select-none overflow-y-auto">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div>
          <div className="eyebrow">Market radar</div>
          <h3 className="pt-1 text-[14px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            Trade & supply
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} className="text-[var(--dim)] hover:text-[var(--cool)] transition-colors" title="Refresh market data">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          </button>
          <span className="live-badge">LIVE</span>
        </div>
      </div>

      <div className="mt-3 space-y-2 flex-1">
        {indicators.slice(0, 4).map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--dim)]">
                {item.category ?? "REF"}
              </span>
              <span className="text-[12px] font-bold text-[var(--ink)]">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[13px] font-bold tabular-nums text-[var(--ink)]">
                {typeof item.value === "number"
                  ? item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : item.value}
              </span>
              <span
                className={`font-mono text-[10px] font-bold tabular-nums ${
                  item.up ? "text-[#22c55e]" : "text-[#ef4444]"
                }`}
              >
                {item.up ? "▲" : "▼"}{" "}
                {typeof item.change === "number"
                  ? Math.abs(item.change).toFixed(2)
                  : item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[7px] font-mono tracking-[0.1em] text-[var(--dim)]">
        Source: Binance Ticker · ExchangeRate API · 90s refresh
      </div>
    </section>
  );
}
