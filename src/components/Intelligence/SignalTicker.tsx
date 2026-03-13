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
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-0 animate-marquee whitespace-nowrap">
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
