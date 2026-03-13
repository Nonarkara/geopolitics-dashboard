"use client";

import { useEffect, useState } from "react";
import { Info, MapPin } from "lucide-react";
import ConvergenceAlerts from "./ConvergenceAlerts";
import type { IncidentFeature } from "../../types/dashboard";

interface Incident {
    id: number | string;
    type: string;
    location: string;
    time: string;
    severity: string;
    notes: string;
}

export default function Sidebar() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/incidents");
        const payload: unknown = await res.json();
        if (!Array.isArray(payload)) {
          setIncidents([]);
          return;
        }

        const items = (payload as IncidentFeature[]).map((d) => ({
          id: d.id,
          type: d.properties.type,
          location: d.properties.location || "Border area",
          time: d.properties.eventDate || "--",
          severity: d.properties.fatalities > 0 ? "high" : "medium",
          notes: d.properties.notes,
        }));
        setIncidents(items);
      } catch {
        setIncidents([]);
      }
    };
    load();
  }, []);

  return (
    <article className="flex h-full flex-col select-none px-1">
      <div className="pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[20px] font-bold tracking-[-0.03em] text-[var(--ink)]">
            Border Monitor
          </h1>
          <div className="h-2 w-2 rounded-full bg-[var(--danger)] animate-pulse" />
        </div>
        <p className="text-[12px] leading-relaxed text-[var(--muted)]">
          Real-time geospatial intelligence focused on regional stability and border dynamics.
        </p>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
        <section className="space-y-4">
          <div className="eyebrow opacity-60">Critical Watchpoints</div>
          <ConvergenceAlerts />
        </section>

        <section className="space-y-4">
          <div className="eyebrow opacity-60 flex items-center justify-between">
            Recent Activity
            <span className="text-[9px] font-mono opacity-50">{incidents.length} EVENTS</span>
          </div>

          <div className="space-y-4">
            {incidents.slice(0, 5).map((incident, idx) => (
              <div
                key={incident.id}
                className="group relative flex gap-4 border-l border-[var(--line)] pl-4 transition-colors hover:border-[var(--line-bright)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        incident.severity === "high"
                          ? "text-[var(--danger)]"
                          : "text-[var(--cool)]"
                      }`}
                    >
                      {incident.type}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--dim)] group-hover:text-[var(--muted)]">
                      {incident.time}
                    </span>
                  </div>
                  <p className="pt-1.5 text-[12px] leading-relaxed text-[var(--ink)] font-medium line-clamp-2">
                    {incident.notes}
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-[10px] text-[var(--dim)] font-medium">
                    <MapPin size={10} strokeWidth={2.5} />
                    <span className="truncate">{incident.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="pt-6 mt-auto">
        <div className="rounded-xl bg-[var(--line)] p-4">
          <div className="flex items-start gap-3">
            <Info size={14} className="mt-0.5 text-[var(--muted)]" strokeWidth={2.5} />
            <div>
              <div className="text-[11px] font-bold text-[var(--ink)] leading-none mb-1">
                Spatial Guidance
              </div>
              <p className="text-[11px] leading-tight text-[var(--muted)]">
                Map imagery provides the primary ground truth. Use overlays to cross-reference with reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
