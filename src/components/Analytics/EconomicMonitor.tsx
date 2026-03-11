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
      <div className="flex h-full items-center px-6">
        <span className="eyebrow">Synchronizing market signals</span>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col bg-[#f7f2ea] p-5 select-none">
      <div className="flex items-start justify-between gap-4 border-b border-[#d6cebf] pb-4">
        <div>
          <div className="eyebrow">Market context</div>
          <h3 className="pt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#171512]">
            Pressure around trade and supply
          </h3>
        </div>
        <p className="max-w-[180px] text-right text-[12px] leading-5 text-[#5c564c]">
          Market moves do not explain everything, but they often explain why a
          border signal deserves extra attention.
        </p>
      </div>

      <div className="mt-4 grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
        {indicators.slice(0, 4).map((item) => (
          <article
            key={item.label}
            className="flex flex-col justify-between rounded-[20px] border border-[#d6cebf] bg-white/65 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
                {item.category ?? item.source ?? "Reference"}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${
                  item.up
                    ? "bg-[#ead8ce] text-[#8b5a40]"
                    : "bg-[#dce7ea] text-[#4f6871]"
                }`}
              >
                {item.up ? "Up" : "Down"} {item.change}
              </span>
            </div>

            <div className="pt-6">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#736c61]">
                {item.label}
              </div>
              <div className="pt-2 text-[28px] font-semibold leading-none tracking-[-0.05em] text-[#171512]">
                {item.value}
              </div>
            </div>

            <div className="pt-5 text-[11px] text-[#5c564c]">
              {item.province ?? "Regional context"}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
