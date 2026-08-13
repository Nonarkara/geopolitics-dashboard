"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import type { BorderCommandBrief } from "../../types/dashboard";
import type { BorderInsightsPayload } from "../../lib/border-insights";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normGrowth(value: number | null) {
  if (value === null) return 0;
  return clamp(((value + 2) / 10) * 100, 0, 100);
}

function normAqi(value: number | null) {
  if (value === null) return 50;
  return clamp(100 - value / 2, 0, 100);
}

function riskColor(level: string) {
  if (level === "critical" || level === "high") return "var(--accent)";
  if (level === "moderate") return "var(--ink)";
  return "var(--ink-dim)";
}

export default function BorderInsightLab({
  brief,
}: {
  brief: BorderCommandBrief | null;
}) {
  const [payload, setPayload] = useState<BorderInsightsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/border/insights", {
          cache: "default",
        });
        const json = (await response.json()) as {
          success?: boolean;
          data?: BorderInsightsPayload;
          error?: string;
        };
        if (!active) return;
        if (!response.ok || !json.data) {
          setError(json.error ?? `HTTP_${response.status}`);
          return;
        }
        setError(null);
        setPayload(json.data);
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof DOMException && caughtError.name === "TimeoutError"
            ? "UPSTREAM_TIMEOUT"
            : "FETCH_FAILED");
        }
      }
    };
    void load();
    const id = setInterval(() => void load(), 15 * 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [reloadKey]);

  const spider = useMemo(() => {
    if (!payload) return null;
    const scoreByIso: Record<string, number> = {
      THA: 40,
      MMR: brief?.areas.find((a) => a.id === "myanmar-frontier")?.score ?? 70,
      KHM: brief?.areas.find((a) => a.id === "cambodia-frontier")?.score ?? 55,
      MYS: brief?.areas.find((a) => a.id === "malaysia-frontier")?.score ?? 45,
      CHN: 35,
    };
    const airByIso: Record<string, number | null> = {
      THA: payload.air.find((a) => a.id === "bangkok")?.usAqi ?? null,
      MMR: payload.air.find((a) => a.id === "mae-sot")?.usAqi ?? null,
      KHM: payload.air.find((a) => a.id === "aranyaprathet")?.usAqi ?? null,
      MYS: payload.air.find((a) => a.id === "sadao")?.usAqi ?? null,
      CHN: payload.air.find((a) => a.id === "chiang-saen")?.usAqi ?? null,
    };

    const labels = ["GDP growth", "Urban %", "Forest %", "Air clarity", "Calm score"];
    const colors = ["#f5f5f5", "#f59e0b", "#a0a0a0", "#6a6a6a", "#d6d3d1"];

    return {
      labels,
      datasets: payload.countries.map((country, index) => ({
        label: country.label,
        data: [
          normGrowth(country.gdpGrowthPct),
          country.urbanPct ?? 0,
          country.forestPct ?? 0,
          normAqi(airByIso[country.iso3] ?? null),
          clamp(100 - (scoreByIso[country.iso3] ?? 50), 0, 100),
        ],
        borderColor: colors[index % colors.length],
        backgroundColor: `${colors[index % colors.length]}22`,
        borderWidth: 1.5,
        pointRadius: 2,
      })),
    };
  }, [payload, brief]);

  return (
    <section className="flex h-full flex-col overflow-hidden bg-[var(--bg-panel)] select-none">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 shrink-0">
        <div>
          <div className="eyebrow text-white/90">Border Insight Lab</div>
          <div className="text-[13px] font-black uppercase tracking-[0.04em] text-white/70">
            Air · Mekong · Growth / land spider — free APIs only
          </div>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {(payload?.sources ?? []).map((source) => (
            <span
              key={source.id}
              className={`border px-1.5 py-0.5 text-[12px] font-black uppercase tracking-[0.12em] ${
                source.status === "live"
                  ? "border-white/20 text-[var(--safe,#22c55e)]"
                  : "border-white/10 text-white/35"
              }`}
            >
              {source.label} · {source.status}
            </span>
          ))}
        </div>
      </div>

      {!payload ? (
        <div className="grid flex-1 place-items-center px-6">
          <div className="max-w-xl border-l-2 border-[var(--accent)] pl-4">
            <div className="eyebrow text-white/85">
              {error ? "Insight feeds delayed" : "Checking three public sources"}
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-white/48">
              {error
                ? "The map and cited news remain available. Retry if the three public sources timed out on this Worker."
                : "Open-Meteo air, GloFAS river discharge, and World Bank indicators are loading. First Worker fetch can take a minute; then it holds for 15 minutes."}
            </p>
            <div className="mt-3 flex items-center gap-3 text-[13px] font-mono uppercase tracking-[0.12em] text-white/35">
              <span>Air</span><span>River</span><span>World Bank</span>
              {error ? (
                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                  className="ml-auto h-9 border border-[var(--accent)] px-3 text-[var(--accent)]"
                >
                  Retry
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-[1.5px] overflow-y-auto bg-[var(--line)] xl:grid-cols-12 xl:overflow-hidden">
          {/* AIR */}
          <div className="col-span-1 bg-[var(--bg-panel)] p-3 xl:col-span-4 xl:overflow-y-auto">
            <div className="eyebrow text-white/80 mb-2">Air & CO₂ (CAMS model)</div>
            <p className="text-[14px] leading-snug text-white/45 mb-3">
              Border crossings vs Bangkok. CO₂ is near-surface model ppm — educational, not a satellite plume map.
            </p>
            <div className="space-y-1.5">
              {payload.air.map((site) => (
                <div
                  key={site.id}
                  className="border border-white/10 bg-white/[0.03] px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-black uppercase tracking-tight text-white/90">
                        {site.label}
                      </div>
                      <div className="text-[13px] text-white/40">{site.theater}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-black tabular-nums text-white">
                        {site.usAqi ?? "—"}
                      </div>
                      <div className="text-[13px] uppercase tracking-[0.12em] text-white/35">
                        US AQI
                      </div>
                    </div>
                  </div>
                  <div className="mt-1.5 flex gap-3 text-[14px] font-mono text-white/55">
                    <span>PM2.5 {site.pm25 ?? "—"}</span>
                    <span>CO₂ {site.co2Ppm ?? "—"} ppm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MEKONG */}
          <div className="col-span-1 bg-[var(--bg-panel)] p-3 xl:col-span-4 xl:overflow-y-auto">
            <div className="eyebrow text-white/80 mb-2">Mekong pulse (GloFAS)</div>
            <p className="text-[14px] leading-snug text-white/45 mb-3">
              Thai-bank gauges. Upstream dam ops in China/Laos reshape the flood pulse — MRC holds the official stations; this is a free simulation for teaching the pressure.
            </p>
            <div className="space-y-2">
              {payload.rivers.map((river) => (
                <div
                  key={river.id}
                  className="border border-white/10 bg-white/[0.03] px-2.5 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-black uppercase tracking-tight text-white/90">
                        {river.name}
                      </div>
                      <div
                        className="text-[13px] font-black uppercase tracking-[0.14em] mt-0.5"
                        style={{ color: riskColor(river.riskLevel) }}
                      >
                        {river.riskLevel} · {river.trend}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-black tabular-nums">
                        {river.currentDischarge}
                      </div>
                      <div className="text-[13px] text-white/35">m³/s now</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-end gap-[2px] h-10">
                    {river.series.slice(-14).map((point) => {
                      const max = Math.max(
                        ...river.series.map((entry) => entry.discharge),
                        1,
                      );
                      const height = Math.max(4, (point.discharge / max) * 100);
                      return (
                        <div
                          key={point.date}
                          className="flex-1 bg-white/25"
                          style={{ height: `${height}%` }}
                          title={`${point.date}: ${point.discharge} m³/s`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-1 text-[13px] text-white/35">
                    Peak {river.forecastPeak} m³/s
                    {river.forecastPeakDate ? ` · ${river.forecastPeakDate}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SPIDER */}
          <div className="col-span-1 flex min-h-[360px] flex-col bg-[var(--bg-panel)] p-3 xl:col-span-4 xl:min-h-0 xl:overflow-hidden">
            <div className="eyebrow text-white/80 mb-2">Compare · spider</div>
            <p className="text-[14px] leading-snug text-white/45 mb-2">
              GDP growth, urbanisation, forest cover, air clarity, and calm score (inverse frontier pressure). China sits upstream on water politics; Myanmar leads conflict pressure.
            </p>
            <div className="min-h-0 flex-1 relative">
              {spider ? (
                <Radar
                  data={spider}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          color: "rgba(255,255,255,0.55)",
                          boxWidth: 8,
                          font: { size: 10, family: "JetBrains Mono" },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx) =>
                            `${ctx.dataset.label}: ${Math.round(Number(ctx.raw))}`,
                        },
                      },
                    },
                    scales: {
                      r: {
                        min: 0,
                        max: 100,
                        ticks: { display: false },
                        grid: { color: "rgba(255,255,255,0.08)" },
                        angleLines: { color: "rgba(255,255,255,0.08)" },
                        pointLabels: {
                          color: "rgba(255,255,255,0.55)",
                          font: { size: 10, family: "Source Sans 3" },
                        },
                      },
                    },
                  }}
                />
              ) : null}
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {payload.countries.map((country) => (
                <div
                  key={country.iso3}
                  className="border border-white/10 px-1 py-1 text-center"
                >
                  <div className="text-[13px] font-black uppercase text-white/70">
                    {country.iso3}
                  </div>
                  <div className="text-[14px] font-mono tabular-nums text-white/90">
                    {country.gdpGrowthPct ?? "—"}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
