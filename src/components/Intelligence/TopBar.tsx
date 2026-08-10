"use client";

import { useEffect, useState } from "react";
import { BookOpen, Database, Printer, Shield } from "lucide-react";
import AnimatedNumber from "../Common/AnimatedNumber";
import CommandTooltip from "../Common/CommandTooltip";
import DashboardVersionBadge from "../Common/DashboardVersionBadge";
import LogoStrip from "../Identity/LogoStrip";
import { TOPBAR_TOOLTIPS } from "../../lib/tooltip-catalog";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import { formatBangkokDayLabel } from "../../lib/time-window";
import type { BorderCommandBrief } from "../../types/dashboard";

// ── WORLD CLOCKS ─────────────────────────────────────────────────────────────
// Use IANA timezone IDs so DST is handled automatically.
// Groups: Bangkok home | SE Asia | East Asia | US | Europe
type CountryClock = {
  label: string;
  tz: string;
  flag: string;
  group?: string;
};

const COUNTRY_CLOCKS: CountryClock[] = [
  // SE Asia & home
  { label: "BKK",  tz: "Asia/Bangkok",       flag: "🇹🇭", group: "SEA" },
  { label: "SGP",  tz: "Asia/Singapore",      flag: "🇸🇬", group: "SEA" },
  { label: "MNL",  tz: "Asia/Manila",         flag: "🇵🇭", group: "SEA" },
  // East Asia
  { label: "SEL",  tz: "Asia/Seoul",          flag: "🇰🇷", group: "EA"  },
  { label: "TYO",  tz: "Asia/Tokyo",          flag: "🇯🇵", group: "EA"  },
  // US
  { label: "NYC",  tz: "America/New_York",    flag: "🇺🇸", group: "US"  },
  { label: "LAX",  tz: "America/Los_Angeles", flag: "🇺🇸", group: "US"  },
  // Europe
  { label: "LON",  tz: "Europe/London",       flag: "🇬🇧", group: "EU"  },
  { label: "PAR",  tz: "Europe/Paris",        flag: "🇫🇷", group: "EU"  },
  { label: "MSK",  tz: "Europe/Moscow",       flag: "🇷🇺", group: "EU"  },
];

function formatTimeForTz(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  } catch {
    return "--:--";
  }
}

// Dim clocks whose city is in the same "night" band (≥22:00 or <06:00)
function isNight(tz: string): boolean {
  try {
    const h = parseInt(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date()),
      10
    );
    return h >= 22 || h < 6;
  } catch { return false; }
}

// Group separator label
const GROUP_LABELS: Record<string, string> = {
  SEA: "SE Asia",
  EA: "E Asia",
  US: "US",
  EU: "Europe",
};

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
  const { isHistorical, timeWindow, bangkokDay } = useTimeWindow();
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
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
                Playback {formatBangkokDayLabel(bangkokDay ?? "")}
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

        <div className="hidden min-w-0 flex-1 gap-[1px] bg-white/5 lg:grid lg:grid-cols-3">
          {(brief?.areas ?? []).slice(0, 3).map((area) => {
            const postureColor =
              area.posture === "priority"
                ? "var(--accent)"
                : area.posture === "watch"
                  ? "var(--hazard)"
                  : "var(--safe)";
            return (
              <div key={area.id} className="bg-[#0a0b10] px-3 py-2 relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ backgroundColor: postureColor }}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/60">
                    {area.counterpart}
                  </span>
                  <span className="text-[10px] font-black tabular-nums" style={{ color: postureColor }}>
                    {area.score ?? "--"}
                  </span>
                </div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-tight text-white/90 truncate">
                  {area.label}
                </div>
                <div className="mt-0.5 text-[8px] leading-tight text-white/40 line-clamp-1">
                  {area.signals[0] ?? area.summary}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 border-l border-white/10 px-3 overflow-x-auto scrollbar-none">
        {/* World Clocks — grouped with subtle dividers between regions */}
        <div className="flex items-center gap-0 shrink-0">
          {COUNTRY_CLOCKS.map((clock, idx) => {
            const prevGroup = idx > 0 ? COUNTRY_CLOCKS[idx - 1].group : null;
            const showDivider = prevGroup && prevGroup !== clock.group;
            const night = isNight(clock.tz);
            return (
              <div key={clock.label} className="flex items-stretch">
                {showDivider && (
                  <div className="flex flex-col items-center justify-center px-1.5">
                    <div className="h-6 w-px bg-white/10" />
                    <div className="mt-0.5 text-[6px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">
                      {GROUP_LABELS[clock.group ?? ""] ?? ""}
                    </div>
                  </div>
                )}
                <div className={`px-2 py-1.5 text-center transition-opacity ${night ? "opacity-30" : "opacity-100"}`}>
                  <div className={`text-[13px] font-black tabular-nums tracking-tight leading-none ${night ? "text-white/50" : "text-white/90"}`}>
                    {formatTimeForTz(clock.tz)}
                  </div>
                  <div className="mt-0.5 flex items-center justify-center gap-0.5">
                    <span className="text-[8px] leading-none">{clock.flag}</span>
                    <span className={`text-[7px] font-black uppercase tracking-[0.14em] ${night ? "text-white/20" : "text-white/35"}`}>
                      {clock.label}
                    </span>
                    {night && (
                      <span className="text-[6px] text-white/20">🌙</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-10 w-px bg-white/10 shrink-0" />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <CommandTooltip content={TOPBAR_TOOLTIPS.apis} position="bottom">
            <button
              onClick={onOpenArchitecture}
              className="flex h-7 items-center gap-1.5 border border-white/15 bg-transparent px-2.5 text-[8px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <Shield size={9} strokeWidth={3} />
              APIs
            </button>
          </CommandTooltip>
          {onOpenDataExplorer && (
            <CommandTooltip content={TOPBAR_TOOLTIPS.data} position="bottom">
              <button
                onClick={onOpenDataExplorer}
                className="flex h-7 items-center gap-1.5 border border-white/15 bg-transparent px-2.5 text-[8px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/[0.06] hover:text-white"
              >
                <Database size={9} strokeWidth={3} />
                Data
              </button>
            </CommandTooltip>
          )}
          <CommandTooltip content={TOPBAR_TOOLTIPS.docs} position="bottom">
            <button
              onClick={onOpenManual}
              className="flex h-7 items-center gap-1.5 border border-white/15 bg-transparent px-2.5 text-[8px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <BookOpen size={9} strokeWidth={3} />
              Docs
            </button>
          </CommandTooltip>
          <a
            href="/briefing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 items-center gap-1.5 border border-white/15 bg-transparent px-2.5 text-[8px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <Printer size={9} strokeWidth={3} />
            PDF
          </a>
        </div>
      </div>
    </header>
  );
}
