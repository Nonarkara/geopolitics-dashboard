"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { fallbackTicker } from "../../lib/mock-data";
import type { TickerResponse } from "../../types/dashboard";

function isTickerResponse(value: unknown): value is TickerResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    Array.isArray(value.items)
  );
}

export default function SignalTicker() {
  const [ticker, setTicker] = useState<TickerResponse>(fallbackTicker);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/ticker");
        const payload: unknown = await response.json();

        if (isTickerResponse(payload)) {
          setTicker(payload);
        }
      } catch {
        setTicker(fallbackTicker);
      }
    };

    load();
    const interval = setInterval(load, 2 * 60 * 1000); // Refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="flex h-[38px] items-center justify-between bg-[var(--bg-surface)] px-4">
      <div className="flex flex-1 items-center">
        {ticker.items.slice(0, 4).map((item, i) => {
          const toneClass =
            item.tone === "up"
              ? "text-[#f59e0b]"
              : item.tone === "down"
                ? "text-[var(--cool)]"
                : "text-[var(--dim)]";
          const Icon =
            item.tone === "up"
              ? ArrowUpRight
              : item.tone === "down"
                ? ArrowDownRight
                : ArrowRight;

          return (
            <div
              key={item.id}
              className={`flex min-w-0 flex-1 items-center justify-between gap-3 border-r border-[var(--line)] px-4 ${i === 3 ? "border-r-0" : ""}`}
            >
              <div className="min-w-0 flex items-center gap-3">
                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--dim)]">
                  {item.label}
                </span>
                <span className="truncate text-[12px] font-bold font-mono tabular-nums text-[var(--ink)]">
                  {item.value}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 text-[9px] font-mono tabular-nums ${toneClass}`}
              >
                <Icon size={10} />
                <span className="truncate">{item.delta}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 border-l border-[var(--line)] pl-4 opacity-40 grayscale-75 transition-opacity hover:opacity-100 hover:grayscale-0">
        <img src="/images/uwn-logo.jpg" alt="UWN" className="h-[20px] w-auto" />
        <img src="/images/depa-logo.png" alt="depa" className="h-[18px] w-auto" />
        <img src="/images/smart-city-logo.jpg" alt="Smart City Thailand" className="h-[22px] w-auto" />
      </div>
    </section>
  );
}
