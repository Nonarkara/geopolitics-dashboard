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
  }, []);

  return (
    <section className="flex h-[48px] items-center divide-x divide-[var(--line)] bg-[var(--bg-raised)] overflow-x-auto no-scrollbar">
      {ticker?.items?.map((item) => {
        const toneClass =
          item.tone === "up"
            ? "text-[var(--success)]"
            : item.tone === "down"
              ? "text-[var(--danger)]"
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
            className="flex min-w-[200px] items-center justify-between gap-3 px-5 py-2 shrink-0"
          >
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--dim)]">
                {item.label}
              </div>
              <div className="truncate text-[14px] font-bold tracking-[-0.02em] text-[var(--ink)]">
                {item.value}
              </div>
            </div>
            <div
              className={`flex items-center gap-1 text-[11px] font-bold tabular-nums ${toneClass}`}
            >
              <Icon size={12} strokeWidth={3} />
              <span>{item.delta}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
