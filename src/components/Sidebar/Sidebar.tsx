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
    const interval = setInterval(load, 2 * 60 * 1000); // Refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="flex h-full w-full flex-col text-[var(--ink)] select-none">
      <div className="border-b border-[var(--line)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">Command</div>
            <h1 className="pt-2 text-[22px] font-bold tracking-[-0.03em] text-[var(--ink)]">
              Thailand Border
            </h1>
          </div>
          <div className="live-badge">LIVE</div>
        </div>
        <p className="pt-3 text-[12px] leading-5 text-[var(--muted)]">
          Map-led monitoring surface. Streets, terrain, and analytic overlays
          first, then packages, incidents, markets, and briefings.
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <section className="space-y-4">
          <div className="space-y-2">
            <div className="eyebrow">Watchpoints</div>
            <div className="h-px w-full bg-[var(--bg-raised)]" />
          </div>
          <ConvergenceAlerts />
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <div className="eyebrow">Data pipeline</div>
            <div className="h-px w-full bg-[var(--bg-raised)]" />
          </div>

          <div className="grid gap-1.5">
            {[
              { name: "ACLED Conflict", status: "live", interval: "2 min", source: "acleddata.com" },
              { name: "NASA FIRMS", status: "live", interval: "2 min", source: "firms.modaps.eosdis.nasa.gov" },
              { name: "OpenSky Flights", status: "live", interval: "30s", source: "opensky-network.org" },
              { name: "Open-Meteo AQI", status: "live", interval: "5 min", source: "open-meteo.com" },
              { name: "RSS / Google News", status: "live", interval: "5 min", source: "rss2json.com" },
              { name: "Binance / FX", status: "live", interval: "90s", source: "binance.com" },
            ].map((feed) => (
              <div
                key={feed.name}
                className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      feed.status === "live" ? "bg-[#22c55e] animate-pulse" : "bg-[#ef4444]"
                    }`}
                  />
                  <span className="text-[10px] font-medium text-[var(--ink)]">
                    {feed.name}
                  </span>
                </div>
                <span className="text-[8px] font-mono tracking-[0.1em] text-[var(--dim)]">
                  {feed.interval}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <div className="eyebrow">Recent incidents</div>
            <div className="h-px w-full bg-[var(--bg-raised)]" />
          </div>

          <div className="space-y-4">
            {incidents.slice(0, 4).map((incident, idx) => (
              <article
                key={incident.id}
                className="border-b border-[var(--line)] pb-4 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <span className="pt-0.5 text-[10px] font-mono tabular-nums text-[var(--dim)]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-[0.16em] ${
                          incident.severity === "high"
                            ? "text-[#f59e0b]"
                            : "text-[var(--cool)]"
                        }`}
                      >
                        {incident.type}
                      </span>
                      <span className="text-[9px] font-mono tabular-nums text-[var(--dim)]">
                        {incident.time}
                      </span>
                    </div>
                    <p className="pt-2 text-[12px] leading-5 text-[var(--muted)]">
                      {incident.notes.length > 100
                        ? `${incident.notes.substring(0, 100)}...`
                        : incident.notes}
                    </p>
                    <div className="pt-2 flex items-center gap-2 text-[10px] text-[var(--dim)]">
                      <MapPin size={10} />
                      <span>{incident.location}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="border-t border-[var(--line)] p-6">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-3">
          <div className="flex items-start gap-3">
            <Info size={14} className="mt-0.5 text-[var(--cool)]" />
            <div>
              <div className="text-[11px] font-medium text-[var(--ink)]">
                Data from NASA, RSS/search feeds, reference APIs, and market sources
              </div>
              <p className="pt-1 text-[11px] leading-4 text-[var(--dim)]">
                Contact: Dr. Non Arkara
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
