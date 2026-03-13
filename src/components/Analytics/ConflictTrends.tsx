"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import type { ConflictTrendsResponse } from "../../types/dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function ConflictTrends() {
  const [data, setData] = React.useState<ConflictTrendsResponse | null>(null);

  React.useEffect(() => {
    fetch("/api/conflict-trends")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--bg-surface)] select-none">
        <span className="eyebrow">Preparing incident trend view</span>
      </div>
    );
  }

  const provincialData = {
    labels: data?.provincialData?.labels || [],
    datasets: [
      {
        label: "Current",
        data: data?.provincialData?.current || [],
        backgroundColor: "#111111",
        borderColor: "#111111",
        borderWidth: 0,
        barThickness: 8,
      },
      {
        label: "Baseline",
        data: data?.provincialData?.yoy || [],
        backgroundColor: "rgba(17, 17, 17, 0.1)",
        borderColor: "rgba(17, 17, 17, 0.1)",
        borderWidth: 0,
        barThickness: 8,
      },
    ],
  };

  const fatalitiesTrend = {
    labels: data?.fatalities?.labels || [],
    datasets: [
      {
        fill: true,
        label: "Fatalities",
        data: data?.fatalities?.data || [],
        borderColor: "#0f6f88",
        backgroundColor: "rgba(15, 111, 136, 0.05)",
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111111",
        titleFont: { size: 10, weight: 700 as const },
        bodyFont: { size: 10 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        grid: { color: "rgba(17, 17, 17, 0.05)", drawBorder: false },
        ticks: { color: "#858585", font: { size: 9, family: "IBM Plex Mono" } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#858585", font: { size: 9, family: "IBM Plex Mono" } },
      },
    },
  };

  return (
    <section className="grid h-full grid-cols-1 bg-[var(--bg-surface)] select-none lg:grid-cols-2 divide-x divide-[var(--line)]">
      <div className="flex flex-col p-4">
        <div className="mb-4 flex items-start justify-between gap-3 px-1">
          <div>
            <div className="eyebrow">Incident density</div>
            <div className="pt-1 text-[14px] font-bold tracking-[-0.02em] text-[var(--ink)]">
              Spatial concentration
            </div>
          </div>
          <span className="live-badge">T-SIGNAL</span>
        </div>
        <div className="flex-1 min-h-0">
          <Bar options={options} data={provincialData} />
        </div>
      </div>

      <div className="flex flex-col p-4">
        <div className="mb-4 flex items-start justify-between gap-3 px-1">
          <div>
            <div className="eyebrow">Fatality trend</div>
            <div className="pt-1 text-[14px] font-bold tracking-[-0.02em] text-[var(--ink)]">
              Severity variance
            </div>
          </div>
          <span className="live-badge">S-TREND</span>
        </div>
        <div className="flex-1 min-h-0">
          <Line options={options} data={fatalitiesTrend} />
        </div>
      </div>
    </section>
  );
}
