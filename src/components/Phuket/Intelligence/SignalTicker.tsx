"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { TickerResponse } from "../../../types/dashboard";

const emptyTicker: TickerResponse = { items: [], generatedAt: "" };

function isTickerResponse(value: unknown): value is TickerResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    Array.isArray(value.items)
  );
}

export default function SignalTicker() {
  const [ticker, setTicker] = useState<TickerResponse>(emptyTicker);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/ticker");
        const payload: unknown = await response.json();

        if (isTickerResponse(payload)) {
          setTicker(payload);
        }
      } catch {
        // Fail closed: an empty strip beats fabricated signals.
      }
    };

    load();
    const interval = setInterval(load, 2 * 60 * 1000); // Refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="grid h-[38px] grid-cols-2 bg-[var(--bg-surface)] lg:grid-cols-4">
      {ticker.items.slice(0, 4).map((item) => {
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
            className="flex min-w-0 items-center justify-between gap-3 border-r border-[var(--line)] px-4 last:border-r-0"
          >
            <div className="min-w-0 flex items-center gap-3">
              <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--dim)]">
                {item.label}
              </span>
              <span className="truncate text-[14px] font-bold font-mono tabular-nums text-[var(--ink)]">
                {item.value}
              </span>
            </div>
            <div
              className={`flex items-center gap-1 text-[13px] font-mono tabular-nums ${toneClass}`}
            >
              <Icon size={12} />
              <span className="truncate">{item.delta}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
