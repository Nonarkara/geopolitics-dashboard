"use client";

import type { BorderCommandBrief } from "../../types/dashboard";

function postureColor(posture: string) {
  switch (posture) {
    case "priority":
      return "var(--accent)";
    case "watch":
      return "var(--warning, #f59e0b)";
    default:
      return "var(--safe, #22c55e)";
  }
}

function ScoreBar({ label, counterpart, score, posture }: {
  label: string;
  counterpart: string;
  score: number;
  posture: string;
}) {
  const color = postureColor(posture);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-[90px] shrink-0 text-right">
        <div className="text-[9px] font-black uppercase tracking-tight leading-none truncate">{label}</div>
        <div className="text-[7px] opacity-40 uppercase leading-none">{counterpart}</div>
      </div>
      <div className="flex-1 h-[10px] bg-white/5 rounded-sm overflow-hidden relative min-w-[80px]">
        <div
          className="h-full rounded-sm transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
        <div className="absolute inset-0 flex items-center justify-end pr-1">
          <span className="text-[7px] font-black tabular-nums" style={{ color: score > 60 ? '#000' : color }}>
            {score}
          </span>
        </div>
      </div>
      <div
        className="text-[7px] font-black uppercase w-[52px] text-center py-0.5 rounded-sm shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
      >
        {posture}
      </div>
    </div>
  );
}

function MetricCell({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="text-center px-2">
      <div className="text-[7px] font-black uppercase tracking-wider opacity-40 leading-none mb-0.5">{label}</div>
      <div className="text-[14px] font-black tabular-nums leading-none">{value}</div>
      {sub && <div className="text-[7px] opacity-30 leading-none mt-0.5">{sub}</div>}
    </div>
  );
}

export default function BorderStatusStrip({ brief }: { brief: BorderCommandBrief | null }) {
  if (!brief) {
    return (
      <section className="bg-[var(--bg)] border-t border-black shrink-0 h-[72px] flex items-center justify-center">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-20 animate-pulse">
          SYNCHRONIZING COMMAND PICTURE
        </span>
      </section>
    );
  }

  const totalIncidents = brief.areas.reduce((s, a) => s + a.incidentCount, 0);
  const totalFatalities = brief.areas.reduce((s, a) => s + a.fatalityCount, 0);
  const totalVerified = brief.areas.reduce((s, a) => s + a.verifiedCameras, 0);
  const totalCandidates = brief.areas.reduce((s, a) => s + a.candidateCameras, 0);
  const totalSignals = brief.areas.reduce((s, a) => s + a.signals.length, 0);

  return (
    <section className="bg-[var(--bg)] border-t border-black shrink-0 px-4 py-2 relative z-40">
      <div className="max-w-[1800px] mx-auto flex items-center gap-6">

        {/* Overall posture badge */}
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <div
            className="w-[44px] h-[44px] rounded-sm flex items-center justify-center"
            style={{ backgroundColor: `color-mix(in srgb, ${postureColor(brief.overallPosture)} 15%, transparent)` }}
          >
            <span
              className="text-[18px] font-black tabular-nums"
              style={{ color: postureColor(brief.overallPosture) }}
            >
              {brief.overallScore}
            </span>
          </div>
          <div
            className="text-[6px] font-black uppercase tracking-widest"
            style={{ color: postureColor(brief.overallPosture) }}
          >
            {brief.overallPosture}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-[48px] bg-white/10 shrink-0" />

        {/* Area score bars */}
        <div className="flex-1 flex flex-col gap-1 min-w-0 max-w-[420px]">
          {brief.areas.map((area) => (
            <ScoreBar
              key={area.id}
              label={area.label}
              counterpart={area.counterpart}
              score={area.score}
              posture={area.posture}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-[48px] bg-white/10 shrink-0" />

        {/* Key metrics */}
        <div className="flex items-center gap-1 shrink-0">
          <MetricCell label="Incidents" value={totalIncidents} sub="matched" />
          <MetricCell label="Fatalities" value={totalFatalities} sub="reported" />
          <MetricCell label="Cameras" value={totalVerified} sub={`+${totalCandidates} scout`} />
          <MetricCell label="Signals" value={totalSignals} sub="OSINT" />
          <MetricCell label="Sources" value={brief.sources.length} sub="active" />
        </div>

        {/* Divider */}
        <div className="w-px h-[48px] bg-white/10 shrink-0" />

        {/* Headline */}
        <div className="flex-1 min-w-0 hidden xl:block">
          <div className="text-[8px] font-black uppercase tracking-wider opacity-30 leading-none mb-1">COMMAND HEADLINE</div>
          <div className="text-[10px] font-bold leading-tight line-clamp-2 opacity-70">{brief.headline}</div>
        </div>

        {/* Timestamp */}
        <div className="shrink-0 text-right hidden lg:block">
          <div className="text-[7px] font-black uppercase tracking-wider opacity-20 leading-none mb-0.5">GENERATED</div>
          <div className="text-[9px] tabular-nums opacity-40">
            {new Date(brief.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div className="text-[7px] opacity-20 uppercase mt-0.5">Connected Grid V5</div>
        </div>
      </div>
    </section>
  );
}
