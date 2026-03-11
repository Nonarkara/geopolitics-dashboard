"use client";

import { useEffect, useState } from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import ConvergenceAlerts from './ConvergenceAlerts';
import type { IncidentFeature } from "../../types/dashboard";

interface Incident {
    id: number | string;
    type: string;
    location: string;
    time: string;
    severity: string;
    notes: string;
}

export default function Sidebar() {
    const [incidents, setIncidents] = useState<Incident[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/incidents');
                const payload: unknown = await res.json();
                if (!Array.isArray(payload)) {
                    setIncidents([]);
                    return;
                }

                const items = (payload as IncidentFeature[]).map((d) => ({
                    id: d.id,
                    type: d.properties.type,
                    location: d.properties.location || 'Tactical Sector',
                    time: d.properties.eventDate || '--',
                    severity: d.properties.fatalities > 0 ? 'high' : 'medium',
                    notes: d.properties.notes
                }));
                setIncidents(items);
            } catch {
                setIncidents([]);
            }
        };
        load();
    }, []);

    return (
        <aside className="w-[360px] h-screen bg-[#0a0a0a] flex flex-col z-50 select-none">
            {/* Functional Header */}
            <div className="p-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-[14px] font-bold tracking-tight text-[#e5e5e5]">SENTINEL_X</h1>
                        <p className="text-[10px] text-[#7a7a7a] font-medium tracking-wide uppercase">Strategic Intelligence Module</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#ff4d00]" title="Operational Status: Active"></div>
                </div>

                <div className="h-[2px] w-12 bg-[#ff4d00]"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 space-y-16">
                {/* Section: Convergence */}
                <section className="space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-[#e5e5e5] uppercase tracking-[0.2em]">01_CONVERGENCE</h3>
                        <div className="h-[1px] w-full bg-[#1da1f2]/20"></div>
                    </div>
                    <ConvergenceAlerts />
                </section>

                {/* Section: Satellite Suite */}
                <section className="space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-[#e5e5e5] uppercase tracking-[0.2em]">02_SATELLITE_SUITE</h3>
                        <div className="h-[1px] w-full bg-[#1da1f2]/20"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] group hover:bg-[#111] transition-colors border-l-2 border-[#ff4d00]">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-[#e5e5e5] uppercase tracking-wider">COPERNICUS_SENTINEL</span>
                                <p className="text-[8px] text-[#555] font-medium uppercase">Level 2A / 10M Multitemporal</p>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]"></div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] group hover:bg-[#111] transition-colors border-l-2 border-[#00d5ff]">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-[#e5e5e5] uppercase tracking-wider">JAXA_GSMAP_PRECIP</span>
                                <p className="text-[8px] text-[#555] font-medium uppercase">Near Real-Time Global Mapping</p>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00d5ff]"></div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] group hover:bg-[#111] transition-colors border-l-2 border-[#1a1a1a]">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-[#e5e5e5] uppercase tracking-wider">MAPBOX_HIGH_RES</span>
                                <p className="text-[8px] text-[#555] font-medium uppercase">Sub-Meter Tactical Layer</p>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></div>
                        </div>
                    </div>
                </section>

                {/* Section: Tactical Feed */}
                <section className="space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-[#e5e5e5] uppercase tracking-[0.2em]">03_TACTICAL_LOG</h3>
                        <div className="h-[1px] w-full bg-[#1da1f2]/20"></div>
                    </div>

                    <div className="space-y-10">
                        {incidents.slice(0, 4).map((incident, idx) => (
                            <div key={incident.id} className="group space-y-4">
                                <div className="flex items-start gap-4">
                                    <span className="text-[10px] font-mono text-[#7a7a7a] tabular-nums">0{idx + 1}</span>
                                    <div className="space-y-4 flex-1">
                                        <div className="flex justify-between items-baseline">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${incident.severity === 'high' ? 'text-[#ff4d00]' : 'text-[#00d5ff]'}`}>
                                                {incident.type}
                                            </span>
                                            <span className="text-[9px] font-mono text-[#444]">{incident.time}</span>
                                        </div>
                                        <p className="text-[12px] leading-[1.6] text-[#999] group-hover:text-[#e5e5e5] transition-colors">
                                            {incident.notes.length > 90 ? `${incident.notes.substring(0, 90)}...` : incident.notes}
                                        </p>
                                        <div className="flex items-center gap-3 text-[9px] font-medium text-[#555] uppercase tracking-wider">
                                            <MapPin size={10} className="text-[#00d5ff]" />
                                            <span>{incident.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section: Strategic Summary */}
                <section className="space-y-6 pb-20">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-[#e5e5e5] uppercase tracking-[0.2em]">03_SUMMARY</h3>
                        <div className="h-[1px] w-full bg-[#1da1f2]/20"></div>
                    </div>
                    <p className="text-[12px] leading-[1.8] text-[#7a7a7a] font-light">
                        Cross-border commercial stability acts as a primary buffer against escalatory tactical shift. South-East transition zones remains under high fidelity observation.
                    </p>
                </section>
            </div>

            {/* Functional Footer Action */}
            <div className="p-10 bg-[#0c0c0c]">
                <button className="w-full h-12 bg-[#1a1a1a] hover:bg-[#222] text-[#e5e5e5] text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-between px-6 group active:scale-[0.98]">
                    DATA_EXPORT
                    <ArrowUpRight size={14} className="text-[#00d5ff] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </aside>
    );
}
