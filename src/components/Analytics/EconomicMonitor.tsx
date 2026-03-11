"use client";

import React from 'react';
import { fallbackEconomicIndicators } from '@/lib/mock-data';
import type { EconomicIndicator } from '@/types/dashboard';

const isEconomicIndicatorArray = (value: unknown): value is EconomicIndicator[] =>
    Array.isArray(value);

export default function EconomicMonitor() {
    const [indicators, setIndicators] = React.useState<EconomicIndicator[]>([]);

    React.useEffect(() => {
        const fetchEconomics = async () => {
            try {
                const res = await fetch('/api/economics');
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
        <div className="h-24 w-full bg-[#0c0c0c] flex items-center px-12 gap-6 animate-pulse">
            <div className="w-1 h-1 rounded-full bg-[#ff4d00]"></div>
            <span className="text-[9px] font-black text-[#444] uppercase tracking-[0.3em]">SYNCHRONIZING_MARKET_PROTOCOLS</span>
        </div>
    );

    return (
        <div className="grid grid-cols-4 h-full bg-[#0a0a0a] border-none select-none">
            {indicators.slice(0, 4).map((item, idx) => (
                <div key={idx} className="group relative p-10 flex flex-col justify-between hover:bg-[#111] transition-all cursor-crosshair border-r border-[#1a1a1a] last:border-r-0">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-[#444] tabular-nums">0{idx + 1}</span>
                        <div className={`text-[10px] font-bold ${item.up ? 'text-[#00d5ff]' : 'text-[#ff4d00]'}`}>
                            {item.up ? '↑' : '↓'} {item.change}
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <div className="text-[20px] font-bold text-[#e5e5e5] tracking-tighter uppercase leading-none">
                            {item.value}
                        </div>
                        <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.1em] block">
                            {item.label.replace(/\s+/g, '_')}
                        </label>
                    </div>

                    {/* Functional Status Indicator */}
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={`w-1 h-1 rounded-full ${item.up ? 'bg-[#00d5ff]' : 'bg-[#ff4d00]'}`}></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
