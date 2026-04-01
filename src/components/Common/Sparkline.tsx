"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
}

/**
 * Tiny SVG sparkline — a 30-point trend line for any metric card.
 * Pure SVG, no dependencies. Normalizes data to fit the viewBox.
 */
export default function Sparkline({
  data,
  width = 60,
  height = 16,
  color = "currentColor",
  fillOpacity = 0.1,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padY = 1; // pixel padding top/bottom

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padY - ((value - min) / range) * (height - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Closed path for fill area
  const fillPath = `M0,${height} ${data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padY - ((value - min) / range) * (height - padY * 2);
      return `L${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ")} L${width},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <path d={fillPath} fill={color} opacity={fillOpacity} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
