"use client";

import React from 'react';
import { fallbackEconomicIndicators } from "../../lib/mock-data";
import type { EconomicIndicator } from "../../types/dashboard";

const isEconomicIndicatorArray = (value: unknown): value is EconomicIndicator[] =>
    Array.isArray(value);

export default function EconomicMonitor() {
    const [indicators, setIndicators] = React.useState<EconomicIndicator[]>([]);

    React.useEffect(() => {
        const fetchEconomics = async () => {
            try {
                const res = await fetch('/api/markets');
                const payload: unknown = await res.json();

                if (isEconomicIndicatorArray(payload)) {
                    setIndicators(payload);
                    return;
                }

                if (
                    payload &&
                    typeof payload === 'object' &&
                    'data' in payload &&
                    isEconomicIndicatorArray(payload.data)
                ) {
                    setIndicators(payload.data);
                    return;
                }

                setIndicators(fallbackEconomicIndicators);
            } catch {
                setIndicators(fallbackEconomicIndicators);
            }
        };
        fetchEconomics();
    }, []);

    if (indicators.length === 0) return (
        <div className="flex h-full items-center px-6">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">
                Synchronizing market signals
            </span>
        </div>
    );

    return (
        <div className="grid h-full grid-cols-2 bg-[#f4efe7] select-none lg:grid-cols-4">
            {indicators.slice(0, 4).map((item, idx) => (
                <div key={idx} className="group flex flex-col justify-between border-r border-[#cfc7b7] px-6 py-5 last:border-r-0">
                    <div className="flex items-start justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#787267]">
                            {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className={`text-[10px] font-medium uppercase tracking-[0.16em] ${item.up ? 'text-[#8d3e23]' : 'text-[#2f5666]'}`}>
                            {item.up ? 'Up' : 'Down'} {item.change}
                        </div>
                    </div>

                    <div className="space-y-2 pt-6">
                        <label className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#787267]">
                            {item.label}
                        </label>
                        <div className="text-[24px] font-semibold leading-none tracking-[-0.04em] text-[#151515]">
                            {item.value}
                        </div>
                    </div>

                    <div className="pt-4 text-[11px] uppercase tracking-[0.16em] text-[#5f5b52]">
                        {item.category ?? item.source ?? 'Reference'}
                    </div>
                </div>
            ))}
        </div>
    );
}
