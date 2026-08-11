"use client";

import { useEffect, useState } from "react";
import { fallbackEconomicIndicators, fallbackAseanGdp } from "../../lib/mock-data";
import type { EconomicIndicator, AseanGdpDatum } from "../../types/dashboard";

const isEconomicIndicatorArray = (value: unknown): value is EconomicIndicator[] =>
  Array.isArray(value);

function formatGdpCompact(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(0)}B`;
  return `$${(value / 1_000_000).toFixed(0)}M`;
}

export default function EconomicMonitor() {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [gdpData, setGdpData] = useState<AseanGdpDatum[]>(fallbackAseanGdp);

  useEffect(() => {
    const fetchEconomics = async () => {
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

          if ("aseanGdp" in payload && Array.isArray(payload.aseanGdp) && payload.aseanGdp.length > 0) {
            setGdpData(payload.aseanGdp);
          }
          return;
        }

        setIndicators(fallbackEconomicIndicators);
      } catch {
        setIndicators(fallbackEconomicIndicators);
      }
    };
    fetchEconomics();
    const interval = setInterval(fetchEconomics, 120000);
    return () => clearInterval(interval);
  }, []);

  if (indicators.length === 0) {
    return (
      <div className="flex h-full items-center px-5">
        <span className="eyebrow">Synchronizing market signals</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden select-none gap-1.5">
      {/* Compact vertical list of market indicators */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
        {indicators.slice(0, 5).map((item) => (
          <div key={item.label} className="flex items-center justify-between border-b border-[var(--line-dim)] pb-1">
            <div className="min-w-0">
              <div className="text-[12px] font-black uppercase tracking-widest opacity-30">{item.category ?? "REF"}</div>
              <div className="text-[13px] font-black truncate">{item.label}</div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <div className="text-[15px] font-black tabular-nums leading-none">{item.value}</div>
              <span className={`text-[12px] font-black tabular-nums ${item.up ? "text-[var(--safe)]" : "text-[var(--accent)]"}`}>
                {item.up ? "\u25B2" : "\u25BC"} {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* GDP mini strip */}
      <div className="shrink-0 pt-1 border-t border-[var(--line-dim)]">
        <div className="text-[11px] font-black opacity-25 uppercase tracking-widest mb-0.5">ASEAN GDP TOP 5</div>
        <div className="flex gap-2">
          {gdpData.slice(0, 5).map((d) => (
            <div key={d.countryCode} className="text-center">
              <div className="text-[12px] font-black opacity-40">{d.countryCode}</div>
              <div className="text-[12px] font-black tabular-nums">{formatGdpCompact(d.gdpUsd)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
