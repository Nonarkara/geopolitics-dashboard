"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import {
  buildRecentBangkokDays,
  formatBangkokDayLabel,
  getBangkokTodayKey,
} from "../../lib/time-window";
import { useNow } from "../../hooks/useNow";

interface DayBucket {
  date: string; // YYYY-MM-DD
  count: number;
}

export default function TimeMachine() {
  const { bangkokDay, selectBangkokDay, clearTimeWindow, isLive, transitionState } = useTimeWindow();
  const [buckets, setBuckets] = useState<DayBucket[]>([]);
  const now = useNow(60_000);
  const days = useMemo(
    () => buildRecentBangkokDays(30, now ?? new Date()),
    [now],
  );

  useEffect(() => {
    if (days.length === 0) {
      return;
    }

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
  const today = getBangkokTodayKey(now ?? new Date());
  const selectedDate = bangkokDay;

  return (
    <div className="relative flex h-9 shrink-0 items-center gap-2 border-t border-[var(--line)] bg-black px-2 select-none sm:gap-4 sm:px-4">
      {/* TRANSITION OVERLAY */}
      <AnimatePresence>
        {transitionState === "entering-playback" && (
          <motion.div
            key="playback-wipe"
            className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-[#f59e0b]/15"
              initial={{ scaleX: 0, transformOrigin: "left" }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <motion.span
              className="relative z-10 text-[13px] font-black uppercase tracking-[0.3em] text-[#f59e0b]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              Entering Playback
            </motion.span>
          </motion.div>
        )}
        {transitionState === "entering-live" && (
          <motion.div
            key="live-wipe"
            className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-[var(--accent)]/10"
              initial={{ scaleX: 0, transformOrigin: "right" }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <motion.span
              className="relative z-10 text-[13px] font-black uppercase tracking-[0.3em] text-[var(--accent)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              Live Feed Restored
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT LABEL */}
      <div className="hidden items-center gap-1.5 shrink-0 sm:flex">
        <Clock size={12} className="text-[var(--tech)]" />
        <span className="text-[12px] font-black uppercase tracking-widest text-[var(--tech)]">
          Time Machine
        </span>
      </div>

      {/* CENTER: DAY CELLS */}
      <div
        className="no-scrollbar flex h-6 flex-1 items-end justify-start gap-[2px] overflow-x-auto sm:justify-center"
        role="listbox"
        aria-label="Select historical date"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const currentIdx = selectedDate ? days.indexOf(selectedDate) : -1;
            const nextIdx = e.key === "ArrowRight"
              ? Math.min(days.length - 1, currentIdx + 1)
              : Math.max(0, currentIdx - 1);
            if (nextIdx >= 0 && nextIdx < days.length) {
              selectBangkokDay(days[nextIdx]);
              const container = e.currentTarget;
              const buttons = container.querySelectorAll<HTMLButtonElement>('[role="option"]');
              buttons[nextIdx]?.focus();
            }
          }
        }}
      >
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
              role="option"
              title={`${formatBangkokDayLabel(day)} — ${count} signals`}
              aria-label={`Replay ${formatBangkokDayLabel(day)}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              data-testid={`time-machine-day-${day}`}
              className="group relative flex h-full w-[14px] min-w-[14px] cursor-pointer flex-col items-center justify-end sm:w-[16px] sm:min-w-[16px]"
              onClick={() => selectBangkokDay(day)}
            >
              <div
                className="w-[6px] transition-all duration-150 ease-out"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isSelected
                    ? "var(--accent)"
                    : "var(--tech)",
                  opacity: isSelected ? 1 : isToday ? 0.7 : 0.3,
                }}
              />
              {isToday && (
                <div className="absolute bottom-0 h-1 w-1 bg-white/50" />
              )}
              {/* hover highlight */}
              <div className="absolute inset-0 bg-white/[0.05] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100" />
            </button>
          );
        })}
      </div>

      {/* SELECTED DATE LABEL */}
      {selectedDate && (
        <span className="text-[12px] font-mono tabular-nums uppercase tracking-wider text-white/50 shrink-0">
          {formatBangkokDayLabel(selectedDate)}
        </span>
      )}

      {/* LIVE PILL */}
      <button
        type="button"
        onClick={clearTimeWindow}
        className={`flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[12px] font-black uppercase tracking-widest transition-all duration-150 ease-out ${
          isLive
            ? "border-[var(--accent)] bg-black text-[var(--accent)]"
            : "border-white/15 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/30"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 ${
            isLive ? "bg-[var(--accent)] animate-pulse" : "bg-white/30"
          }`}
        />
        Live
      </button>
    </div>
  );
}
