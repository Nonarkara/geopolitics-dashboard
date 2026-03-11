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
    <section className="grid h-full grid-cols-2 bg-[#f6f1e8] lg:grid-cols-4">
      {ticker.items.slice(0, 4).map((item) => {
        const toneClass =
          item.tone === "up"
            ? "text-[#8b5a40]"
            : item.tone === "down"
              ? "text-[#4f6871]"
              : "text-[#5c564c]";
        const Icon =
          item.tone === "up"
            ? ArrowUpRight
            : item.tone === "down"
              ? ArrowDownRight
              : ArrowRight;

        return (
          <div
            key={item.id}
            className="flex min-w-0 items-center justify-between gap-4 border-r border-[#d6cebf] px-5 py-4 last:border-r-0"
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#736c61]">
                {item.label}
              </div>
              <div className="truncate pt-1 text-[17px] font-semibold tracking-[-0.03em] text-[#171512]">
                {item.value}
              </div>
            </div>
            <div
              className={`flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] ${toneClass}`}
            >
              <Icon size={12} />
              <span>{item.delta}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
