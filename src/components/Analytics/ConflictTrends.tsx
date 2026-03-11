"use client";

import React from 'react';
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
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
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
    Filler
);

export default function ConflictTrends() {
    const [data, setData] = React.useState<ConflictTrendsResponse | null>(null);

    React.useEffect(() => {
        fetch('/api/conflict-trends')
            .then(res => res.json())
            .then(setData);
    }, []);

    if (!data) return (
        <div className="flex h-full w-full items-center justify-center gap-6 bg-[#f4efe7] select-none">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">
                Processing conflict frequency delta
            </span>
        </div>
    );

    const provincialData = {
        labels: data.provincialData.labels,
        datasets: [
            {
                label: 'CYCLE_ACTIVE',
                data: data.provincialData.current,
                backgroundColor: '#1f1f1d',
                borderColor: '#1f1f1d',
                borderWidth: 0,
                barThickness: 12,
            },
            {
                label: 'BASELINE_YOY',
                data: data.provincialData.yoy,
                backgroundColor: '#b9afa0',
                borderColor: '#b9afa0',
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
                label: 'LETHALITY_INDEX',
                data: data.fatalities.data,
                borderColor: '#8d3e23',
                tension: 0,
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
                backgroundColor: '#1f1f1d',
                titleFont: { size: 10, weight: 700 },
                bodyFont: { size: 10 },
                padding: 12,
                cornerRadius: 0,
                displayColors: false,
            },
        },
        scales: {
            y: {
                grid: { color: '#d8d0c3', drawBorder: false },
                ticks: { color: '#6a6458', font: { size: 8, family: 'monospace' } },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6a6458', font: { size: 8, family: 'monospace' } },
            },
        },
    };

    return (
        <div className="grid h-full grid-cols-1 bg-[#f4efe7] select-none lg:grid-cols-2">
            <div className="flex flex-col border-b border-[#cfc7b7] p-8 lg:border-b-0 lg:border-r">
                <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-medium text-[#787267] uppercase tracking-[0.2em]">01 Spatial Frequency</h4>
                        <div className="text-[18px] font-semibold text-[#121212] tracking-[-0.03em]">Incidents by sector</div>
                    </div>
                </div>
                <div className="flex-1">
                    <Bar options={options} data={provincialData} />
                </div>
            </div>

            <div className="flex flex-col p-8">
                <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-medium text-[#787267] uppercase tracking-[0.2em]">02 Lethality Metrics</h4>
                        <div className="text-[18px] font-semibold text-[#121212] tracking-[-0.03em]">Fatality analysis</div>
                    </div>
                </div>
                <div className="flex-1">
                    <Line options={options} data={fatalitiesTrend} />
                </div>
            </div>
        </div>
    );
}
