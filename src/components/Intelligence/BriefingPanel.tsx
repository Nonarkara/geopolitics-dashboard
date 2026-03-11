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
    <section className="flex h-full flex-col border-b border-[#cfc7b7] bg-[#ece6db] p-6">
      <div className="flex items-start justify-between gap-4 border-b border-[#cfc7b7] pb-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">
            Latest Briefing
          </div>
          <h2 className="pt-2 text-[26px] font-semibold tracking-[-0.03em] text-[#121212]">
            {briefing.title}
          </h2>
        </div>
        <div className="text-right text-[10px] uppercase tracking-[0.18em] text-[#787267]">
          {formatTimestamp(briefing.updatedAt)}
        </div>
      </div>

      <p className="pt-5 text-[15px] leading-7 text-[#2f2d29]">
        {briefing.summary}
      </p>

      <div className="grid gap-5 pt-6 xl:grid-cols-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">
            Priorities
          </div>
          <div className="pt-3 space-y-3">
            {briefing.priorities.map((item) => (
              <div key={item} className="border-l-2 border-[#121212] pl-3 text-[13px] leading-6 text-[#20201d]">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">
            Market Signals
          </div>
          <div className="pt-3 space-y-3">
            {briefing.marketSignals.map((item) => (
              <div key={item} className="border-l-2 border-[#8d8372] pl-3 text-[13px] leading-6 text-[#444039]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[#cfc7b7] pt-4 text-[12px] uppercase tracking-[0.16em] text-[#5d594f]">
        Outlook: {briefing.outlook}
      </div>
    </section>
  );
}
