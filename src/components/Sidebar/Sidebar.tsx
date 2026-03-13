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
    <aside className="flex h-screen w-[336px] flex-col bg-[#eae3d8] text-[#171512] select-none">
      <div className="border-b border-[#d6cebf] p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">Overview</div>
            <h1 className="pt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#171512]">
              Thailand Border Monitor
            </h1>
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-[#171512]" />
        </div>
        <p className="pt-4 text-[14px] leading-6 text-[#4a453d]">
          A quieter, map-led monitoring surface. Start with terrain and imagery,
          then use incidents, markets, and briefings to understand pressure
          around the border.
        </p>
      </div>

      <div className="flex-1 space-y-10 overflow-y-auto px-8 py-8">
        <section className="space-y-5">
          <div className="space-y-2">
            <div className="eyebrow">Current watchpoints</div>
            <div className="h-px w-full bg-[#d6cebf]" />
          </div>
          <ConvergenceAlerts />
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <div className="eyebrow">How to read the map</div>
            <div className="h-px w-full bg-[#d6cebf]" />
          </div>

          <div className="grid gap-3">
            {[
              {
                title: "Start with imagery",
                detail: "Use VIIRS or MODIS first so terrain, settlements, and weather context are legible.",
              },
              {
                title: "Add one layer at a time",
                detail: "Turn on incidents, thermal anomalies, rainfall, or movement only when that question matters.",
              },
              {
                title: "Cross-check with context",
                detail: "Use the briefing and market cards to decide whether a signal is isolated or system-wide.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[20px] border border-[#d6cebf] bg-[#f7f2ea] p-4"
              >
                <div className="text-[13px] font-medium text-[#171512]">
                  {item.title}
                </div>
                <p className="pt-2 text-[12px] leading-5 text-[#5b554b]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <div className="eyebrow">Recent incidents</div>
            <div className="h-px w-full bg-[#d6cebf]" />
          </div>

          <div className="space-y-6">
            {incidents.slice(0, 4).map((incident, idx) => (
              <article
                key={incident.id}
                className="border-b border-[#dbd3c5] pb-5 last:border-b-0"
              >
                <div className="flex items-start gap-4">
                  <span className="pt-1 text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`text-[10px] uppercase tracking-[0.16em] ${
                          incident.severity === "high"
                            ? "text-[#8b5a40]"
                            : "text-[#4f6871]"
                        }`}
                      >
                        {incident.type}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
                        {incident.time}
                      </span>
                    </div>
                    <p className="pt-3 text-[13px] leading-6 text-[#4a453d]">
                      {incident.notes.length > 110
                        ? `${incident.notes.substring(0, 110)}...`
                        : incident.notes}
                    </p>
                    <div className="pt-3 flex items-center gap-2 text-[11px] text-[#6c655a]">
                      <MapPin size={12} />
                      <span>{incident.location}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="border-t border-[#d6cebf] p-8">
        <div className="rounded-[20px] border border-[#d6cebf] bg-[#f7f2ea] p-4">
          <div className="flex items-start gap-3">
            <Info size={16} className="mt-0.5 text-[#4f6871]" />
            <div>
              <div className="text-[12px] font-medium text-[#171512]">
                Why this layout works
              </div>
              <p className="pt-2 text-[12px] leading-5 text-[#5b554b]">
                The map stays primary, controls are grouped by task, and the
                right-hand panels explain what the signal means instead of
                competing for attention.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
