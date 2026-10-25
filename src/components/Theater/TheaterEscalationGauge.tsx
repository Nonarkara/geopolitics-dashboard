"use client";

const COLORS = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
};

function scoreColor(score: number) {
  if (score >= 70) return COLORS.red;
  if (score >= 40) return COLORS.amber;
  return COLORS.green;
}

interface TheaterEscalationGaugeProps {
  score: number;
  label?: string;
  history?: { score: number; timestamp: string }[];
  compact?: boolean;
}

export default function TheaterEscalationGauge({
  score,
  label,
  history,
  compact = false,
}: TheaterEscalationGaugeProps) {
  const color = scoreColor(score);
  const radius = compact ? 14 : 18;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  const svgW = compact ? 36 : 44;
  const svgH = compact ? 22 : 26;

  const sparkline =
    !compact && history && history.length > 1
      ? (() => {
          const max = Math.max(...history.map((h) => h.score), 1);
          const w = 48;
          const h = 14;
          const points = history
            .map((pt, i) => {
              const x = (i / (history.length - 1)) * w;
              const y = h - (pt.score / max) * h;
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <svg width={w} height={h} className="block mt-0.5">
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1"
                opacity="0.5"
              />
            </svg>
          );
        })()
      : null;

  return (
    <div className="flex items-center gap-2">
      <div
        className="relative"
        style={{ width: `${svgW}px`, height: `${svgH}px` }}
      >
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          <path
            d={`M 4 ${svgH - 2} A ${radius} ${radius} 0 0 1 ${svgW - 4} ${svgH - 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={`M 4 ${svgH - 2} A ${radius} ${radius} 0 0 1 ${svgW - 4} ${svgH - 2}`}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={circumference - progress}
            style={{
              transition:
                "stroke-dashoffset 1s ease, stroke 0.5s ease",
            }}
          />
        </svg>
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono leading-none tabular-nums"
          style={{
            fontSize: compact ? "0.75rem" : "0.95rem",
            fontWeight: 200,
            color,
            transition: "color 0.5s ease",
          }}
        >
          {score}
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col items-start">
          {label && (
            <span
              className="font-semibold uppercase tracking-widest"
              style={{
                fontSize: "0.48rem",
                color,
                opacity: 0.8,
                transition: "color 0.5s ease",
              }}
            >
              {label}
            </span>
          )}
          {sparkline}
        </div>
      )}
    </div>
  );
}
