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
import type { ConflictTrendsResponse } from '@/types/dashboard';

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
        <div className="h-full w-full bg-[#0c0c0c] flex items-center justify-center gap-6 select-none animate-pulse">
            <div className="w-1 h-1 rounded-full bg-[#00d5ff]"></div>
            <span className="text-[9px] font-black text-[#444] uppercase tracking-[0.3em]">PROCESSING_CONFLICT_FREQUENCY_DELTA</span>
        </div>
    );

    const provincialData = {
        labels: data.provincialData.labels,
        datasets: [
            {
                label: 'CYCLE_ACTIVE',
                data: data.provincialData.current,
                backgroundColor: '#00d5ff',
                borderColor: '#00d5ff',
                borderWidth: 0,
                barThickness: 12,
            },
            {
                label: 'BASELINE_YOY',
                data: data.provincialData.yoy,
                backgroundColor: '#1a1a1a',
                borderColor: '#1a1a1a',
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
                borderColor: '#ff4d00',
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
                backgroundColor: '#000',
                titleFont: { size: 10, weight: 700 },
                bodyFont: { size: 10 },
                padding: 12,
                cornerRadius: 0,
                displayColors: false,
            },
        },
        scales: {
            y: {
                grid: { color: '#1a1a1a', drawBorder: false },
                ticks: { color: '#444', font: { size: 8, family: 'monospace' } },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#444', font: { size: 8, family: 'monospace' } },
            },
        },
    };

    return (
        <div className="grid grid-cols-2 h-full bg-[#0a0a0a] border-none select-none">
            <div className="p-10 flex flex-col border-r border-[#1a1a1a]">
                <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em]">01_SPATIAL_FREQUENCY</h4>
                        <div className="text-[14px] font-bold text-[#e5e5e5] tracking-tight">Incidents by Sector</div>
                    </div>
                </div>
                <div className="flex-1">
                    <Bar options={options} data={provincialData} />
                </div>
            </div>

            <div className="p-10 flex flex-col">
                <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em]">02_LETHALITY_METRICS</h4>
                        <div className="text-[14px] font-bold text-[#e5e5e5] tracking-tight">Fatality Analysis</div>
                    </div>
                </div>
                <div className="flex-1">
                    <Line options={options} data={fatalitiesTrend} />
                </div>
            </div>
        </div>
    );
}
