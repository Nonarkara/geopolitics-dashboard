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
      <div className="flex h-full w-full items-center justify-center bg-[#f7f2ea] select-none">
        <span className="eyebrow">Preparing incident trend view</span>
      </div>
    );
  }

  const totalCurrent = data.provincialData.current.reduce(
    (sum, value) => sum + value,
    0,
  );
  const totalBaseline = data.provincialData.yoy.reduce(
    (sum, value) => sum + value,
    0,
  );
  const latestFatalityValue =
    data.fatalities.data[data.fatalities.data.length - 1] ?? 0;

  const provincialData = {
    labels: data.provincialData.labels,
    datasets: [
      {
        label: "Current",
        data: data.provincialData.current,
        backgroundColor: "#171512",
        borderColor: "#171512",
        borderWidth: 0,
        barThickness: 12,
      },
      {
        label: "Baseline",
        data: data.provincialData.yoy,
        backgroundColor: "#c9bca9",
        borderColor: "#c9bca9",
        borderWidth: 0,
        barThickness: 12,
      },
    ],
  };

  const fatalitiesTrend = {
    labels: data.fatalities.labels,
    datasets: [
      {
        fill: false,
        label: "Fatalities",
        data: data.fatalities.data,
        borderColor: "#8b5a40",
        tension: 0.25,
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
        backgroundColor: "#171512",
        titleFont: { size: 10, weight: 700 as const },
        bodyFont: { size: 10 },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        grid: { color: "#ddd5c8", drawBorder: false },
        ticks: { color: "#6a6458", font: { size: 9, family: "IBM Plex Sans" } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#6a6458", font: { size: 9, family: "IBM Plex Sans" } },
      },
    },
  };

  return (
    <section className="grid h-full grid-cols-1 bg-[#f7f2ea] select-none lg:grid-cols-2">
      <div className="flex flex-col border-b border-[#d6cebf] p-6 lg:border-b-0 lg:border-r">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Incidents by area</div>
            <div className="pt-2 text-[20px] font-semibold tracking-[-0.03em] text-[#171512]">
              Spatial concentration
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
              Current / baseline
            </div>
            <div className="pt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#171512]">
              {totalCurrent} / {totalBaseline}
            </div>
          </div>
        </div>
        <p className="pb-4 text-[12px] leading-5 text-[#5c564c]">
          Use this view to compare current clustering against a simple baseline,
          so local spikes stand out without overwhelming the map.
        </p>
        <div className="flex-1">
          <Bar options={options} data={provincialData} />
        </div>
      </div>

      <div className="flex flex-col p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Fatality trend</div>
            <div className="pt-2 text-[20px] font-semibold tracking-[-0.03em] text-[#171512]">
              Severity over time
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
              Latest reading
            </div>
            <div className="pt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#171512]">
              {latestFatalityValue}
            </div>
          </div>
        </div>
        <p className="pb-4 text-[12px] leading-5 text-[#5c564c]">
          This line should be read after the map. It helps confirm whether a
          visible cluster is merely active or genuinely worsening.
        </p>
        <div className="flex-1">
          <Line options={options} data={fatalitiesTrend} />
        </div>
      </div>
    </section>
  );
}
