"use client";

import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Radio,
  Shield,
  Siren,
} from "lucide-react";
import type { BorderCommandBrief } from "../../types/dashboard";

function postureClasses(posture: BorderCommandBrief["overallPosture"]) {
  switch (posture) {
    case "priority":
      return "border-[var(--accent)] bg-[rgba(255,59,48,0.06)]";
    case "watch":
      return "border-[var(--hazard)] bg-[rgba(245,158,11,0.06)]";
    default:
      return "border-[var(--line)] bg-white";
  }
}

function posturePill(posture: BorderCommandBrief["overallPosture"]) {
  switch (posture) {
    case "priority":
      return "danger";
    case "watch":
      return "warning";
    default:
      return "safe";
  }
}

interface SidebarProps {
  brief: BorderCommandBrief | null;
}

export default function Sidebar({ brief }: SidebarProps) {
  return (
    <aside className="flex h-full flex-col select-none overflow-hidden bg-white">
      <div className="border-b-[1.5px] border-[var(--line)] p-4 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="eyebrow flex items-center gap-2">
              <Shield size={10} className="text-[var(--accent)]" />
              Border Command Posture
            </div>
            <div className="mt-2 text-[15px] font-black uppercase tracking-tight">
              {brief?.headline ?? "Synchronizing command posture"}
            </div>
          </div>
          <span className={`stat-pill ${posturePill(brief?.overallPosture ?? "watch")}`}>
            {brief?.overallPosture ?? "sync"}
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="text-[11px] leading-relaxed text-[var(--muted)]">
            {brief?.summary ??
              "The border command story will appear here once the executive brief finishes loading."}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[22px] font-black tabular-nums leading-none">
              {brief?.overallScore ?? "--"}
            </div>
            <div className="text-[8px] font-black uppercase tracking-[0.18em] opacity-35">
              command score
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar thin-scrollbar p-4 space-y-5">
        <section>
          <div className="eyebrow mb-3 flex items-center gap-2">
            <Siren size={10} className="text-[var(--accent)]" />
            Tri-Border Priority Board
          </div>
          <div className="space-y-2.5">
            {(brief?.areas ?? []).map((area) => (
              <article
                key={area.id}
                className={`border p-3 transition-all ${postureClasses(area.posture)}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">
                      {area.counterpart}
                    </div>
                    <div className="mt-1 text-[12px] font-black uppercase tracking-tight">
                      {area.label}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`stat-pill ${posturePill(area.posture)}`}>
                      {area.posture}
                    </span>
                    <div className="mt-1 text-[10px] font-black tabular-nums opacity-60">
                      {area.score}/100
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
                  {area.summary}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--line)] pt-2">
                  <div>
                    <div className="text-[8px] font-black uppercase opacity-30">Incidents</div>
                    <div className="text-[12px] font-black tabular-nums">
                      {area.incidentCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase opacity-30">Fatalities</div>
                    <div className="text-[12px] font-black tabular-nums">
                      {area.fatalityCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase opacity-30">Cameras</div>
                    <div className="text-[12px] font-black tabular-nums">
                      {area.verifiedCameras}/{area.candidateCameras}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {area.watchpoints.slice(0, 2).map((watchpoint) => (
                    <span
                      key={watchpoint}
                      className="border border-[var(--line-dim)] bg-[var(--bg)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest opacity-70"
                    >
                      {watchpoint}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="pt-3 border-t border-[var(--line)]">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <AlertTriangle size={10} className="text-[var(--accent)]" />
            Immediate Concerns
          </div>
          <div className="space-y-2">
            {(brief?.topConcerns ?? []).slice(0, 5).map((concern) => (
              <div key={concern.id} className="border border-[var(--line)] bg-[var(--bg)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`stat-pill ${posturePill(concern.posture)}`}>
                    {concern.areaLabel.split(" ")[0]}
                  </span>
                  <span className="text-[9px] font-black tabular-nums opacity-40">
                    {concern.metric}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-tight">
                  {concern.label}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                  {concern.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-3 border-t border-[var(--line)]">
          <div className="flex items-center justify-between mb-3">
            <div className="eyebrow flex items-center gap-2">
              <Radio size={10} />
              Intervention Queue
            </div>
            <span className="live-badge scale-75">LIVE</span>
          </div>
          <div className="space-y-2">
            {(brief?.actionQueue ?? []).map((action, index) => (
              <div key={action.id} className="border border-[var(--line)] bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black tabular-nums opacity-40">
                    0{index + 1}
                  </span>
                  <span className={`stat-pill ${posturePill(action.posture)}`}>
                    {action.owner}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-tight">
                  {action.title}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                  {action.detail}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.14em] opacity-50">
                  {action.areaLabel}
                  <ArrowRight size={10} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-3 border-t border-[var(--line)]">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <Camera size={10} />
            Coverage Note
          </div>
          <div className="border border-[var(--line)] bg-[var(--bg)] p-3 text-[10px] leading-relaxed text-[var(--muted)]">
            Verified cameras now anchor the Myanmar and Malaysia corridors, while scout slots flag the coverage gap on the Cambodia frontier. That makes the intervention queue useful to a governor: it shows both where the heat is and where visibility is still weak.
          </div>
        </section>
      </div>

      <div className="p-3 bg-white border-t border-[var(--line)] flex items-center justify-between shrink-0">
        <div className="text-[11px] font-black opacity-15 uppercase tracking-[0.4em]">
          Sentinel // Border
        </div>
        <div className="flex items-center gap-2 text-[8px] font-black uppercase opacity-30">
          {(brief?.sources ?? ["Synchronizing sources"]).slice(0, 2).join(" / ")}
        </div>
      </div>
    </aside>
  );
}
