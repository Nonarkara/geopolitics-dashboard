"use client";

import { useEffect, useState } from "react";
import { BookOpen, Database, Network } from "lucide-react";

/**
 * Southeast Asian timezone clocks with temperature and AQI.
 * Thailand (BKK) is the hero center clock.
 * Left side: Myanmar, Laos, Vietnam, Cambodia
 * Right side: Malaysia, Singapore, Philippines, Indonesia
 */
const SE_ASIAN_CLOCKS = [
  { label: "MMR", code: "MMR", tz: "Asia/Yangon" },
  { label: "LAO", code: "LAO", tz: "Asia/Vientiane" },
  { label: "VNM", code: "VNM", tz: "Asia/Ho_Chi_Minh" },
  { label: "KHM", code: "KHM", tz: "Asia/Phnom_Penh" },
  { label: "MYS", code: "MYS", tz: "Asia/Kuala_Lumpur" },
  { label: "SGP", code: "SGP", tz: "Asia/Singapore" },
  { label: "PHL", code: "PHL", tz: "Asia/Manila" },
  { label: "IDN", code: "IDN", tz: "Asia/Jakarta" },
];

const LEFT_CLOCKS = SE_ASIAN_CLOCKS.slice(0, 4);
const RIGHT_CLOCKS = SE_ASIAN_CLOCKS.slice(4);

interface EnvData {
  code: string;
  temperature: number | null;
  aqi: number | null;
}

interface TopBarProps {
  onOpenManual: () => void;
  onOpenArchitecture: () => void;
  onOpenDataExplorer: () => void;
}

function formatTime(tz: string) {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatMainClock() {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function aqiColor(aqi: number | null): string {
  if (aqi === null) return "text-[var(--dim)]";
  if (aqi <= 50) return "text-[#22c55e]";   // Good
  if (aqi <= 100) return "text-[#f59e0b]";  // Moderate
  if (aqi <= 150) return "text-[#f97316]";  // Unhealthy for sensitive
  if (aqi <= 200) return "text-[#ef4444]";  // Unhealthy
  return "text-[#a855f7]";                   // Very unhealthy / hazardous
}

export default function TopBar({
  onOpenManual,
  onOpenArchitecture,
  onOpenDataExplorer,
}: TopBarProps) {
  const [time, setTime] = useState("");
  const [leftTimes, setLeftTimes] = useState<string[]>([]);
  const [rightTimes, setRightTimes] = useState<string[]>([]);
  const [envData, setEnvData] = useState<EnvData[]>([]);
  const [thaiEnv, setThaiEnv] = useState<EnvData | null>(null);

  useEffect(() => {
    const tick = () => {
      setTime(formatMainClock());
      setLeftTimes(LEFT_CLOCKS.map((c) => formatTime(c.tz)));
      setRightTimes(RIGHT_CLOCKS.map((c) => formatTime(c.tz)));
    };

    tick();
    const clockInterval = setInterval(tick, 1000);

    // Fetch environment data
    const fetchEnv = async () => {
      try {
        const res = await fetch("/api/environment");
        const data: EnvData[] = await res.json();
        setEnvData(data);
        const thai = data.find((d) => d.code === "THA");
        if (thai) setThaiEnv(thai);
      } catch {
        /* fallback handled by API */
      }
    };

    fetchEnv();
    const envInterval = setInterval(fetchEnv, 5 * 60 * 1000); // Refresh every 5 min

    return () => {
      clearInterval(clockInterval);
      clearInterval(envInterval);
    };
  }, []);

  const getEnv = (code: string) => envData.find((d) => d.code === code);

  return (
    <header className="flex h-[58px] items-center justify-between border-b border-[var(--line)] bg-[var(--bg-surface)] px-5">
      <div className="flex items-center gap-4">
        {LEFT_CLOCKS.map((clock, i) => {
          const env = getEnv(clock.code);
          return (
            <div key={clock.label} className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--dim)]">
                  {clock.label}
                </span>
                <span className="font-mono text-[13px] font-medium tabular-nums text-[var(--muted)]">
                  {leftTimes[i] || "--:--"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] tabular-nums text-[var(--muted)]">
                  {env?.temperature != null ? `${Math.round(env.temperature)}°C` : "--"}
                </span>
                <span className={`font-mono text-[9px] tabular-nums ${aqiColor(env?.aqi ?? null)}`}>
                  {env?.aqi != null ? `AQI ${env.aqi}` : "--"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center">
        <div className="font-mono text-[28px] font-bold tabular-nums tracking-[-0.02em] text-[var(--ink)]">
          {time || "--:--:--"}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--cool)]">
            Bangkok (TH)
          </span>
          {thaiEnv && (
            <>
              <span className="font-mono text-[9px] tabular-nums text-[var(--muted)]">
                {thaiEnv.temperature != null ? `${Math.round(thaiEnv.temperature)}°C` : ""}
              </span>
              <span className={`font-mono text-[9px] tabular-nums ${aqiColor(thaiEnv.aqi)}`}>
                {thaiEnv.aqi != null ? `AQI ${thaiEnv.aqi}` : ""}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-4">
          {RIGHT_CLOCKS.map((clock, i) => {
            const env = getEnv(clock.code);
            return (
              <div key={clock.label} className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--dim)]">
                    {clock.label}
                  </span>
                  <span className="font-mono text-[13px] font-medium tabular-nums text-[var(--muted)]">
                    {rightTimes[i] || "--:--"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] tabular-nums text-[var(--muted)]">
                    {env?.temperature != null ? `${Math.round(env.temperature)}°C` : "--"}
                  </span>
                  <span className={`font-mono text-[9px] tabular-nums ${aqiColor(env?.aqi ?? null)}`}>
                    {env?.aqi != null ? `AQI ${env.aqi}` : "--"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenArchitecture}
          aria-haspopup="dialog"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-bright)] bg-[var(--bg-raised)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--cool)]"
        >
          <Network size={14} className="text-[var(--cool)]" />
          APIs / Architecture
        </button>

        <button
          type="button"
          onClick={onOpenDataExplorer}
          aria-haspopup="dialog"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-bright)] bg-[var(--bg-raised)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--cool)]"
        >
          <Database size={14} className="text-[var(--cool)]" />
          Data / Export
        </button>

        <button
          type="button"
          onClick={onOpenManual}
          aria-haspopup="dialog"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-bright)] bg-[var(--bg-raised)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--cool)]"
        >
          <BookOpen size={14} className="text-[var(--cool)]" />
          Help / Manual
        </button>
      </div>
    </header>
  );
}
