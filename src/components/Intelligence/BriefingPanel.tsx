"use client";

import { useEffect, useState } from "react";
import { fallbackBriefing } from "../../lib/mock-data";
import type { BriefingPayload } from "../../types/dashboard";

function isBriefingPayload(value: unknown): value is BriefingPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    "summary" in value &&
    "priorities" in value &&
    Array.isArray(value.priorities)
  );
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BriefingPanel() {
  const [briefing, setBriefing] = useState<BriefingPayload>(fallbackBriefing);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/briefings/latest");
        const payload: unknown = await response.json();

        if (isBriefingPayload(payload)) {
          setBriefing(payload);
        }
      } catch {
        setBriefing(fallbackBriefing);
      }
    };

    load();
  }, []);

  return (
    <section className="flex h-full flex-col bg-[#eee6da] p-6">
      <div className="flex items-start justify-between gap-4 border-b border-[#d6cebf] pb-4">
        <div>
          <div className="eyebrow">
            Regional briefing
          </div>
          <h2 className="pt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#171512]">
            {briefing.title}
          </h2>
        </div>
        <div className="text-right text-[10px] uppercase tracking-[0.18em] text-[#736c61]">
          {formatTimestamp(briefing.updatedAt)}
        </div>
      </div>

      <p className="pt-5 text-[15px] leading-7 text-[#2f2d29]">
        {briefing.summary}
      </p>

      <div className="mt-5 rounded-[22px] border border-[#d6cebf] bg-[#f7f2ea] p-4">
        <div className="eyebrow">Why it matters</div>
        <p className="pt-2 text-[13px] leading-6 text-[#4f4a42]">
          {briefing.outlook}
        </p>
      </div>

      <div className="grid gap-5 pt-6 xl:grid-cols-2">
        <div>
          <div className="eyebrow">
            What to watch today
          </div>
          <div className="pt-3 space-y-3">
            {briefing.priorities.map((item, index) => (
              <div
                key={item}
                className="rounded-[18px] border border-[#d6cebf] bg-[#f7f2ea] p-4"
              >
                <div className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
                  Priority {index + 1}
                </div>
                <div className="pt-2 text-[13px] leading-6 text-[#20201d]">
                {item}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow">
            Market Signals
          </div>
          <div className="pt-3 space-y-3">
            {briefing.marketSignals.map((item) => (
              <div
                key={item}
                className="rounded-[18px] border border-[#d6cebf] bg-[#f7f2ea] p-4 text-[13px] leading-6 text-[#444039]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
