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
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
        <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[var(--ink)]">
          {briefing.title}
        </h2>
        <div className="text-right text-[9px] font-mono tabular-nums text-[var(--dim)]">
          {formatTimestamp(briefing.updatedAt)}
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-[var(--muted)]">
        {briefing.summary}
      </p>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
        <div className="eyebrow mb-1 opacity-60">Strategic Outlook</div>
        <p className="text-[12px] leading-relaxed text-[var(--muted)]">
          {briefing.outlook}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-3">
          <div className="eyebrow opacity-60">Operational Priorities</div>
          {briefing.priorities.map((item, index) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-3"
            >
              <span className="text-[10px] font-bold text-[var(--dim)]">0{index + 1}</span>
              <div className="text-[12px] leading-tight text-[var(--ink)] font-medium">
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
