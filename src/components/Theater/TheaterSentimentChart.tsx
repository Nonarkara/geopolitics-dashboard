"use client";

import { useCallback } from "react";
import { useLiveResource } from "../../hooks/useLiveResource";
import type { BorderAreaId } from "../../lib/border-regions";

interface SentimentPoint {
  date: string;
  tone: number;
  articleCount: number;
}

interface SentimentResponse {
  timeline: SentimentPoint[];
}

interface TheaterSentimentChartProps {
  theaterId: BorderAreaId;
  accentColor?: string;
}

export default function TheaterSentimentChart({
  theaterId,
  accentColor = "#3b82f6",
}: TheaterSentimentChartProps) {
  const fetcher = useCallback(
    () =>
      fetch(`/api/border/sentiment?theater=${theaterId}`).then(
        (r) => r.json() as Promise<SentimentResponse>,
      ),
    [theaterId],
  );

  const { data } = useLiveResource(fetcher, {
    cacheKey: `sentiment-${theaterId}`,
    intervalMs: 30 * 60 * 1000,
    isUsable: (d) => (d?.timeline?.length ?? 0) >= 3,
  });

  const timeline = data?.timeline ?? [];

  if (timeline.length < 3) {
    return (
      <div className="flex items-center justify-center h-[50px] text-white/20 text-[13px] font-mono">
        Awaiting sentiment data
      </div>
    );
  }

  const tones = timeline.map((d) => d.tone || 0);
  const minT = Math.min(...tones, -5);
  const maxT = Math.max(...tones, 5);
  const range = Math.max(maxT - minT, 1);
  const W = 200;
  const H = 50;
  const PAD = 2;

  const toX = (i: number) =>
    PAD + (i / (timeline.length - 1)) * (W - PAD * 2);
  const toY = (t: number) =>
    PAD + (1 - (t - minT) / range) * (H - PAD * 2);
  const zeroY = toY(0);

  const linePath = timeline
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.tone || 0).toFixed(1)}`,
    )
    .join(" ");

  const posArea =
    timeline
      .map((d, i) => {
        const y = toY(Math.max(d.tone || 0, 0));
        return `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") +
    ` L${toX(timeline.length - 1).toFixed(1)},${zeroY.toFixed(1)} L${toX(0).toFixed(1)},${zeroY.toFixed(1)} Z`;

  const negArea =
    timeline
      .map((d, i) => {
        const y = toY(Math.min(d.tone || 0, 0));
        return `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") +
    ` L${toX(timeline.length - 1).toFixed(1)},${zeroY.toFixed(1)} L${toX(0).toFixed(1)},${zeroY.toFixed(1)} Z`;

  const latest = tones[tones.length - 1];
  const trend = tones.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, tones.length);
  const trendLabel =
    trend < -3
      ? "VERY NEG"
      : trend < -1
        ? "NEGATIVE"
        : trend < 1
          ? "NEUTRAL"
          : "IMPROVING";
  const trendColor =
    trend < -3
      ? "#ef4444"
      : trend < -1
        ? "#f59e0b"
        : trend < 1
          ? "rgba(255,255,255,0.5)"
          : "#22c55e";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-mono text-white/30">
          7d sentiment
        </span>
        <span
          className="text-[12px] font-bold tracking-wide px-1.5 py-0.5 rounded"
          style={{
            color: trendColor,
            background: `${trendColor}18`,
            border: `1px solid ${trendColor}30`,
          }}
        >
          {trendLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[50px]">
        <defs>
          <linearGradient id={`posGrad-${theaterId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`negGrad-${theaterId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <line
          x1={PAD}
          y1={zeroY}
          x2={W - PAD}
          y2={zeroY}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />
        <path d={posArea} fill={`url(#posGrad-${theaterId})`} />
        <path d={negArea} fill={`url(#negGrad-${theaterId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={accentColor}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={toX(timeline.length - 1)}
          cy={toY(latest)}
          r="2"
          fill={latest < 0 ? "#ef4444" : "#22c55e"}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="0.5"
        >
          <animate
            attributeName="opacity"
            values="1;0.5;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
