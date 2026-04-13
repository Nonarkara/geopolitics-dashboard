"use client";

import { useEffect, useState } from "react";
import { BookOpen, Clock3, Database, Printer, Shield } from "lucide-react";
import AnimatedNumber from "../Common/AnimatedNumber";
import DashboardVersionBadge from "../Common/DashboardVersionBadge";
import CommandTooltip from "../Common/CommandTooltip";
import { TOPBAR_TOOLTIPS } from "../../lib/tooltip-catalog";
import LogoStrip from "../Identity/LogoStrip";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import { formatBangkokDayLabel } from "../../lib/time-window";
import type { BorderCommandBrief } from "../../types/dashboard";

function formatTime(value: Date) {
  return value.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function postureClasses(posture: BorderCommandBrief["overallPosture"]) {
  switch (posture) {
    case "priority":
      return "border-[var(--accent)] bg-[rgba(255,59,48,0.08)] text-[var(--accent)]";
    case "watch":
      return "border-[var(--hazard)] bg-[rgba(245,158,11,0.08)] text-[var(--hazard)]";
    default:
      return "border-[var(--safe)] bg-[rgba(34,197,94,0.08)] text-[var(--safe)]";
  }
}

interface TopBarProps {
  brief: BorderCommandBrief | null;
  onOpenManual: () => void;
  onOpenArchitecture: () => void;
  onOpenDataExplorer?: () => void;
}

export default function TopBar({
  brief,
  onOpenManual,
  onOpenArchitecture,
  onOpenDataExplorer,
}: TopBarProps) {
  const { isHistorical, timeWindow } = useTimeWindow();
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex h-20 w-full items-stretch justify-between border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,59,48,0.12),transparent_24%),linear-gradient(180deg,#08090e_0%,#090b11_100%)] select-none">
      <div className="flex items-center gap-4 border-r border-white/10 px-5">
        <div className="flex h-11 w-11 items-center justify-center border border-[rgba(255,59,48,0.22)] bg-[rgba(255,59,48,0.08)]">
          <Shield size={18} className="text-[var(--accent)]" strokeWidth={3} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="text-[13px] font-black tracking-[-0.02em] leading-none text-white/92">
              THAILAND GEOPOLITICAL WATCH
            </div>
            <DashboardVersionBadge className="border-white/15 text-white/60" />
          </div>
          <div className="mt-1 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">
            <span>Myanmar</span>
            <span className="h-[3px] w-[3px] bg-white/20" />
            <span>Cambodia</span>
            <span className="h-[3px] w-[3px] bg-white/20" />
            <span>Southern theatre</span>
          </div>
        </div>
        <div className="hidden 2xl:block h-10 w-px bg-white/10 shrink-0" />
        <LogoStrip />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${
                brief ? postureClasses(brief.overallPosture) : "border-white/15 text-white/40"
              }`}
            >
              {brief?.overallPosture ?? "syncing"}
            </span>
            <span className="text-[10px] font-black tabular-nums text-white/40">
              {brief ? <><AnimatedNumber value={brief.overallScore} format={(n) => Math.round(n).toString()} className="tabular-nums" />/100</> : "--/100"}
            </span>
            <span className="inline-flex items-center border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-white/55">
              {isHistorical ? "Archive playback" : "Live command"}
            </span>
            {isHistorical && timeWindow ? (
              <span className="inline-flex items-center border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                Playback {formatBangkokDayLabel(timeWindow.bangkokDay)}
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-[14px] font-black uppercase tracking-tight text-white/90 truncate">
            {brief?.headline ?? "Building the tri-border command picture"}
          </div>
          <div className="mt-1 text-[10px] leading-tight text-white/50 line-clamp-2">
            {brief?.summary ??
              "Synchronizing incidents, market signals, and border cameras for the executive view."}
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 gap-2 lg:grid lg:grid-cols-3">
          {(brief?.areas ?? []).slice(0, 3).map((area) => (
            <div key={area.id} className="border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">
                  {area.counterpart}
                </span>
                <span
                  className={`text-[8px] font-black uppercase ${
                    area.posture === "priority"
                      ? "text-[var(--accent)]"
                      : area.posture === "watch"
                        ? "text-[var(--hazard)]"
                        : "text-[var(--safe)]"
                  }`}
                >
                  {area.posture}
                </span>
              </div>
              <div className="mt-1 text-[11px] font-black uppercase tracking-tight text-white/90">
                {area.label}
              </div>
              <div className="mt-1 text-[9px] leading-tight text-white/50 line-clamp-2">
                {area.signals[0] ?? area.summary}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 border-l border-white/10 px-5">
        <div className="text-right">
          <div className="text-[22px] font-black tracking-[-0.05em] tabular-nums text-white/90">
            {time}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[8px] font-black uppercase tracking-[0.2em] text-white/35">
            <Clock3 size={9} />
            Bangkok command time
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CommandTooltip content={TOPBAR_TOOLTIPS.apis} position="bottom">
            <button
              onClick={onOpenArchitecture}
              className="flex h-8 items-center gap-2 border border-white/15 bg-transparent px-3 text-[9px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <Shield size={10} strokeWidth={3} />
              APIs
            </button>
          </CommandTooltip>
          {onOpenDataExplorer && (
            <CommandTooltip content={TOPBAR_TOOLTIPS.data} position="bottom">
              <button
                onClick={onOpenDataExplorer}
                className="flex h-8 items-center gap-2 border border-white/15 bg-transparent px-3 text-[9px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/[0.06] hover:text-white"
              >
                <Database size={10} strokeWidth={3} />
                Data
              </button>
            </CommandTooltip>
          )}
          <CommandTooltip content={TOPBAR_TOOLTIPS.docs} position="bottom">
            <button
              onClick={onOpenManual}
              className="flex h-8 items-center gap-2 border border-white/15 bg-transparent px-3 text-[9px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <BookOpen size={10} strokeWidth={3} />
              Docs
            </button>
          </CommandTooltip>
          <a
            href="/briefing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 items-center gap-2 border border-white/15 bg-transparent px-3 text-[9px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <Printer size={10} strokeWidth={3} />
            PDF
          </a>
        </div>
      </div>
    </header>
  );
}
