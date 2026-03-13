"use client";

import React from "react";
import { fallbackEconomicIndicators } from "../../lib/mock-data";
import type { EconomicIndicator } from "../../types/dashboard";

const isEconomicIndicatorArray = (value: unknown): value is EconomicIndicator[] =>
  Array.isArray(value);

export default function EconomicMonitor() {
  const [indicators, setIndicators] = React.useState<EconomicIndicator[]>([]);

  React.useEffect(() => {
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
          return;
        }

        setIndicators(fallbackEconomicIndicators);
      } catch {
        setIndicators(fallbackEconomicIndicators);
      }
    };
    fetchEconomics();
  }, []);

  if (indicators.length === 0) {
    return (
      <div className="flex h-full items-center px-5">
        <span className="eyebrow">Synchronizing market signals</span>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col bg-[var(--bg-surface)] p-4 select-none">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 px-1">
        <div>
          <div className="eyebrow">Economic stress</div>
          <h3 className="pt-1 text-[14px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            Regional market signals
          </h3>
        </div>
        <span className="live-badge">LIVE / MACRO</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 flex-1 overflow-y-auto no-scrollbar">
        {indicators.slice(0, 4).map((item) => (
          <article
            key={item.label}
            className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--dim)] truncate">
                {item.category ?? "REF"}
              </span>
              <span
                className={`text-[9px] font-bold tabular-nums ${
                  item.up ? "text-[var(--success)]" : "text-[var(--danger)]"
                }`}
              >
                {item.up ? "▲" : "▼"} {item.change}
              </span>
            </div>

            <div className="pt-4">
              <div className="text-[10px] font-medium text-[var(--muted)]">
                {item.label}
              </div>
              <div className="pt-1 text-[20px] font-bold leading-none tracking-[-0.04em] text-[var(--ink)]">
                {item.value}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
