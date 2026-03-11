import { BarChart3, Globe, TrendingUp, X } from 'lucide-react';
import type { ProvinceSelection } from "../../types/dashboard";

interface ProvinceDashboardProps {
    province: ProvinceSelection | null;
    onClose: () => void;
}

export default function ProvinceDashboard({ province, onClose }: ProvinceDashboardProps) {
    if (!province) return null;

    const fatalities = province.fatalities ?? 0;
    const stabilityIndex = Math.max(2.5, Number((9.6 - fatalities * 0.6).toFixed(1)));
    const conflictDensity = Math.min(92, 18 + fatalities * 14);
    const economicIntegration = province.iso ? 68 : Math.max(28, 78 - fatalities * 8);
    const economicTone = economicIntegration >= 60 ? 'Optimal' : economicIntegration >= 40 ? 'Watch' : 'Strained';
    const summaryLine = province.notes ?? `${province.name} selected from the regional border layer.`;

    return (
        <div className="absolute right-8 bottom-28 z-[60] w-[340px] border border-[#cfc7b7] bg-[#ece6db]/95 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#121212]"></div>
                        <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#121212]">{province.name}</h2>
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#7a7468]">
                        {province.type ?? `Sector Code: ${province.iso ?? 'Regional'}`}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-full border border-[#cfc7b7] p-2 transition-colors hover:bg-[#f4efe7]"
                >
                    <X size={14} className="text-[#5f5b52]" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border border-[#cfc7b7] bg-[#f4efe7] p-4">
                    <label className="mb-2 block text-[9px] font-medium uppercase tracking-[0.18em] text-[#7a7468]">Stability Index</label>
                    <div className="flex items-baseline gap-1 text-[28px] font-semibold tracking-[-0.04em] text-[#121212]">
                        {stabilityIndex}<span className="text-[10px] font-medium text-[#7a7468]">/10</span>
                    </div>
                </div>
                <div className="border border-[#cfc7b7] bg-[#f4efe7] p-4">
                    <label className="mb-2 block text-[9px] font-medium uppercase tracking-[0.18em] text-[#7a7468]">Fatalities</label>
                    <div className={`flex items-center gap-1 text-[28px] font-semibold tracking-[-0.04em] ${fatalities > 0 ? 'text-[#8d3e23]' : 'text-[#4f6a73]'}`}>
                        {fatalities} <TrendingUp size={12} />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-[#7a7468]">
                        <span>Conflict Density</span>
                        <span className="text-[#8d3e23]">{fatalities > 0 ? 'Elevated' : 'Monitored'}</span>
                    </div>
                    <div className="h-[2px] w-full overflow-hidden bg-[#d7d0c3]">
                        <div className="h-full bg-[#8d3e23]" style={{ width: `${conflictDensity}%` }}></div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-[#7a7468]">
                        <span>Economic Integration</span>
                        <span className="text-[#4f6a73]">{economicTone}</span>
                    </div>
                    <div className="h-[2px] w-full overflow-hidden bg-[#d7d0c3]">
                        <div className="h-full bg-[#4f6a73]" style={{ width: `${economicIntegration}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-3 border-t border-[#cfc7b7] pt-5">
                <p className="text-[13px] leading-[1.7] text-[#4f4a42]">{summaryLine}</p>
                <button className="group flex w-full items-center justify-center gap-2 border border-[#121212] py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#121212] transition-all hover:bg-[#121212] hover:text-[#ece6db]">
                    <BarChart3 size={14} className="transition-opacity" />
                    Operational Analysis
                </button>
                <div className="flex items-center gap-2 border border-[#cfc7b7] bg-[#f4efe7] px-4 py-2">
                    <Globe size={10} className="text-[#5f5b52]" />
                    <span className="text-[9px] uppercase tracking-[0.16em] text-[#6d675d]">
                        {province.eventDate ? `Event Date: ${province.eventDate}` : `Sector: ${province.iso ?? province.name}`}
                    </span>
                </div>
            </div>
        </div>
    );
}
