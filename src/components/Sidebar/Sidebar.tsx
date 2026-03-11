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
        <aside className="flex h-screen w-[320px] flex-col bg-[#e7e0d4] text-[#121212] select-none">
            <div className="border-b border-[#cfc7b7] p-8 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-[24px] font-semibold tracking-[-0.04em] text-[#121212]">Sentinel X</h1>
                        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#787267]">Strategic intelligence module</p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-[#121212]" title="Operational Status: Active"></div>
                </div>

                <div className="text-[12px] leading-6 text-[#444039]">
                    A quieter operating frame for the border dashboard: field reports, imagery layers, and market signals arranged as one system.
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-12">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">01 Convergence</h3>
                        <div className="h-px w-full bg-[#cfc7b7]"></div>
                    </div>
                    <ConvergenceAlerts />
                </section>

                <section className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">02 Satellite Suite</h3>
                        <div className="h-px w-full bg-[#cfc7b7]"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between border-l-2 border-[#121212] bg-[#f4efe7] p-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#121212]">True Color Composite</span>
                                <p className="text-[9px] text-[#6d675d] font-medium uppercase tracking-[0.12em]">VIIRS / MODIS daily review</p>
                            </div>
                            <div className="h-1.5 w-1.5 rounded-full bg-[#121212]"></div>
                        </div>

                        <div className="flex items-center justify-between border-l-2 border-[#8d8372] bg-[#f4efe7] p-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#121212]">Rainfall Overlay</span>
                                <p className="text-[9px] text-[#6d675d] font-medium uppercase tracking-[0.12em]">IMERG / JAXA precipitation</p>
                            </div>
                            <div className="h-1.5 w-1.5 rounded-full bg-[#8d8372]"></div>
                        </div>

                        <div className="flex items-center justify-between border-l-2 border-[#b8b0a3] bg-[#f4efe7] p-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#121212]">Satellite Basemap</span>
                                <p className="text-[9px] text-[#6d675d] font-medium uppercase tracking-[0.12em]">Mapbox detailed context</p>
                            </div>
                            <div className="h-1.5 w-1.5 rounded-full bg-[#b8b0a3]"></div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">03 Tactical Log</h3>
                        <div className="h-px w-full bg-[#cfc7b7]"></div>
                    </div>

                    <div className="space-y-7">
                        {incidents.slice(0, 4).map((incident, idx) => (
                            <div key={incident.id} className="space-y-4 border-b border-[#d7d0c3] pb-5 last:border-b-0">
                                <div className="flex items-start gap-4">
                                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#7a7468]">0{idx + 1}</span>
                                    <div className="space-y-4 flex-1">
                                        <div className="flex justify-between items-baseline">
                                            <span className={`text-[10px] font-medium uppercase tracking-[0.18em] ${incident.severity === 'high' ? 'text-[#8d3e23]' : 'text-[#4f6a73]'}`}>
                                                {incident.type}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-[0.16em] text-[#7a7468]">{incident.time}</span>
                                        </div>
                                        <p className="text-[13px] leading-[1.7] text-[#4f4a42]">
                                            {incident.notes.length > 90 ? `${incident.notes.substring(0, 90)}...` : incident.notes}
                                        </p>
                                        <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#7a7468]">
                                            <MapPin size={10} className="text-[#121212]" />
                                            <span>{incident.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4 pb-8">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">04 Summary</h3>
                        <div className="h-px w-full bg-[#cfc7b7]"></div>
                    </div>
                    <p className="text-[13px] leading-[1.8] text-[#4f4a42]">
                        Cross-border commercial stability acts as a primary buffer against escalatory tactical shift. South-East transition zones remains under high fidelity observation.
                    </p>
                </section>
            </div>

            <div className="border-t border-[#cfc7b7] p-8">
                <button className="group flex h-12 w-full items-center justify-between border border-[#121212] px-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[#121212] transition-all hover:bg-[#121212] hover:text-[#ece6db]">
                    Data Export
                    <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
            </div>
        </aside>
    );
}
