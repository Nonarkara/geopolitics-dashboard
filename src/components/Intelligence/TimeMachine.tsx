"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useTimeWindow } from "../../contexts/TimeWindowContext";

interface DayBucket {
  date: string; // YYYY-MM-DD
  count: number;
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildLast30Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(toISODate(d));
  }
  return days;
}

export default function TimeMachine() {
  const { timeWindow, setTimeWindow, isLive } = useTimeWindow();
  const [buckets, setBuckets] = useState<DayBucket[]>([]);
  const days = buildLast30Days();

  useEffect(() => {
    const from = days[0];
    const to = days[days.length - 1];

    const load = async () => {
      try {
        const res = await fetch(
          `/api/research/trends?from=${from}&to=${to}`,
          { cache: "no-store" },
        );
        const json = await res.json();
        const trends: { summary_date: string; signal_count: number }[] =
          json.trends ?? [];

        // Aggregate signal counts per day across all regions/types
        const map = new Map<string, number>();
        for (const t of trends) {
          const key = t.summary_date?.slice(0, 10);
          if (key) map.set(key, (map.get(key) ?? 0) + t.signal_count);
        }

        setBuckets(
          days.map((d) => ({ date: d, count: map.get(d) ?? 0 })),
        );
      } catch {
        setBuckets(days.map((d) => ({ date: d, count: 0 })));
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const today = toISODate(new Date());
  const selectedDate = timeWindow?.from?.slice(0, 10) ?? null;

  return (
    <div className="h-9 shrink-0 flex items-center bg-black border-t border-[var(--line)] px-4 gap-4 select-none">
      {/* LEFT LABEL */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Clock size={10} className="text-[var(--tech)]" />
        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--tech)]">
          Time Machine
        </span>
      </div>

      {/* CENTER: DAY CELLS */}
      <div className="flex items-end gap-[2px] h-6 flex-1 justify-center">
        {days.map((day, i) => {
          const bucket = buckets[i];
          const count = bucket?.count ?? 0;
          const heightPct = maxCount > 0 ? Math.max(8, (count / maxCount) * 100) : 8;
          const isSelected = day === selectedDate;
          const isToday = day === today;

          return (
            <button
              key={day}
              type="button"
              title={`${formatLabel(day)} — ${count} signals`}
              className="group relative flex flex-col items-center justify-end w-[16px] h-full cursor-pointer"
              onClick={() => {
                setTimeWindow({
                  from: `${day}T00:00:00Z`,
                  to: `${day}T23:59:59Z`,
                });
              }}
            >
              <div
                className="w-[6px] rounded-[1px] transition-all duration-150"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isSelected
                    ? "var(--accent)"
                    : "var(--tech)",
                  opacity: isSelected ? 1 : isToday ? 0.7 : 0.3,
                }}
              />
              {isToday && (
                <div className="absolute bottom-0 w-1 h-1 rounded-full bg-white/50" />
              )}
              {/* hover highlight */}
              <div className="absolute inset-0 bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity rounded-sm" />
            </button>
          );
        })}
      </div>

      {/* SELECTED DATE LABEL */}
      {selectedDate && (
        <span className="text-[8px] font-mono tabular-nums uppercase tracking-wider text-white/50 shrink-0">
          {formatLabel(selectedDate)}
        </span>
      )}

      {/* LIVE PILL */}
      <button
        type="button"
        onClick={() => setTimeWindow(null)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all shrink-0 ${
          isLive
            ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
            : "border-white/15 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/30"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isLive ? "bg-[#22c55e] animate-pulse" : "bg-white/30"
          }`}
        />
        Live
      </button>
    </div>
  );
}
