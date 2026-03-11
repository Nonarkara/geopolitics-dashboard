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
    <div className="grid h-full grid-cols-2 lg:grid-cols-4">
      {ticker.items.slice(0, 4).map((item) => {
        const toneClass =
          item.tone === "up"
            ? "text-[#a33a16]"
            : item.tone === "down"
              ? "text-[#234657]"
              : "text-[#54514a]";
        const Icon =
          item.tone === "up"
            ? ArrowUpRight
            : item.tone === "down"
              ? ArrowDownRight
              : ArrowRight;

        return (
          <div
            key={item.id}
            className="flex min-w-0 items-center justify-between gap-4 border-r border-[#cfc7b7] px-4 py-3 last:border-r-0"
          >
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#787267]">
                {item.label}
              </div>
              <div className="truncate pt-1 text-[15px] font-semibold text-[#161616]">
                {item.value}
              </div>
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] ${toneClass}`}>
              <Icon size={12} />
              <span>{item.delta}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
