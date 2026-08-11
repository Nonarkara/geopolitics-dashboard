"use client";

import { useEffect, useState } from "react";
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
  const [briefing, setBriefing] = useState<BriefingPayload | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/briefings/latest");
        const payload: unknown = await response.json();

        if (isBriefingPayload(payload)) {
          setBriefing(payload);
        }
      } catch {
        // Fail closed: the honest empty state below stands in for mock copy.
      }
    };

    load();
  }, []);

  if (!briefing) {
    return (
      <section className="flex flex-col gap-3">
        <div className="border-b border-[var(--line)] pb-2">
          <h2 className="text-[14px] font-black tracking-tight uppercase leading-tight">
            Operational Briefing
          </h2>
        </div>
        <div className="border border-[var(--line-dim)] border-dashed p-3 text-center text-[9px] font-black uppercase tracking-widest text-[var(--dim)]">
          Live briefing unavailable
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-2">
        <h2 className="text-[14px] font-black tracking-tight uppercase leading-tight">
          {briefing?.title || "Operational Briefing"}
        </h2>
        <div className="text-right text-[8px] font-mono tabular-nums text-[var(--dim)] shrink-0">
          {briefing?.updatedAt ? formatTimestamp(briefing.updatedAt) : "Syncing..."}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--muted)]">
        {briefing?.summary}
      </p>

      {briefing?.outlook && (
        <div className="border border-[var(--line)] bg-[var(--bg)] p-3">
          <div className="eyebrow mb-1 opacity-60">Strategic Outlook</div>
          <p className="text-[10px] leading-relaxed text-[var(--muted)]">
            {briefing.outlook}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="eyebrow opacity-60">Operational Priorities</div>
        {briefing?.priorities?.map((item, index) => (
          <div
            key={item}
            className="flex items-start gap-2 border border-[var(--line-dim)] bg-white p-2"
          >
            <span className="text-[9px] font-black text-[var(--dim)] tabular-nums mt-0.5">0{index + 1}</span>
            <div className="text-[10px] leading-tight font-medium">
              {item}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
