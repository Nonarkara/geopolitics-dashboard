"use client";

import { useEffect, useState } from "react";
import { BookOpen, Clock3, Database, Shield } from "lucide-react";
import DashboardVersionBadge from "../Common/DashboardVersionBadge";
import CommandTooltip from "../Common/CommandTooltip";
import { TOPBAR_TOOLTIPS } from "../../lib/tooltip-catalog";
import LogoStrip from "../Identity/LogoStrip";
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
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex h-20 w-full items-stretch justify-between border-b border-black bg-white select-none">
      <div className="flex items-center gap-4 border-r border-black px-6">
        <Shield size={20} className="text-[var(--accent)]" strokeWidth={3} />
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[12px] font-black tracking-tight leading-none">
              THAILAND GEOPOLITICAL WATCH
            </div>
            <DashboardVersionBadge className="border-black text-black" />
          </div>
          <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] opacity-40">
            Myanmar / Cambodia / Malaysia
          </div>
        </div>
        <div className="h-10 w-px bg-black/10 shrink-0" />
        <LogoStrip />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${
                brief ? postureClasses(brief.overallPosture) : "border-[var(--line)] text-[var(--dim)]"
              }`}
            >
              {brief?.overallPosture ?? "syncing"}
            </span>
            <span className="text-[10px] font-black tabular-nums opacity-40">
              {brief ? `${brief.overallScore}/100` : "--/100"}
            </span>
          </div>
          <div className="mt-2 text-[14px] font-black uppercase tracking-tight text-[var(--ink)] truncate">
            {brief?.headline ?? "Building the tri-border command picture"}
          </div>
          <div className="mt-1 text-[10px] leading-tight text-[var(--muted)] line-clamp-2">
            {brief?.summary ??
              "Synchronizing incidents, market signals, and border cameras for the executive view."}
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 gap-2 lg:grid lg:grid-cols-3">
          {(brief?.areas ?? []).slice(0, 3).map((area) => (
            <div key={area.id} className="border border-black px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] opacity-50">
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
              <div className="mt-1 text-[11px] font-black uppercase tracking-tight">
                {area.label}
              </div>
              <div className="mt-1 text-[9px] leading-tight text-[var(--muted)] line-clamp-2">
                {area.signals[0] ?? area.summary}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 border-l border-black px-6">
        <div className="text-right">
          <div className="text-[22px] font-black tracking-[-0.05em] tabular-nums">
            {time}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[8px] font-black uppercase tracking-[0.2em] opacity-35">
            <Clock3 size={9} />
            Bangkok command time
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CommandTooltip content={TOPBAR_TOOLTIPS.apis} position="bottom">
            <button
              onClick={onOpenArchitecture}
              className="flex h-8 items-center gap-2 border border-black bg-white px-3 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-black hover:text-white"
            >
              <Shield size={10} strokeWidth={3} />
              APIs
            </button>
          </CommandTooltip>
          {onOpenDataExplorer && (
            <CommandTooltip content={TOPBAR_TOOLTIPS.data} position="bottom">
              <button
                onClick={onOpenDataExplorer}
                className="flex h-8 items-center gap-2 border border-black bg-white px-3 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-black hover:text-white"
              >
                <Database size={10} strokeWidth={3} />
                Data
              </button>
            </CommandTooltip>
          )}
          <CommandTooltip content={TOPBAR_TOOLTIPS.docs} position="bottom">
            <button
              onClick={onOpenManual}
              className="flex h-8 items-center gap-2 border border-black bg-white px-3 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-black hover:text-white"
            >
              <BookOpen size={10} strokeWidth={3} />
              Docs
            </button>
          </CommandTooltip>
        </div>
      </div>
    </header>
  );
}
