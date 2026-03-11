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
        <div className="absolute right-8 bottom-32 w-[340px] rounded-[32px] bg-[#0c0c0c]/95 p-8 z-[60] border border-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,136,255,0.4)]"></div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{province.name}</h2>
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em] opacity-60">
                        {province.type ?? `Sector Code: ${province.iso ?? 'Regional'}`}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors border border-white/5"
                >
                    <X size={14} className="text-gray-500" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/[0.01] rounded-2xl p-4 border border-white/[0.02]">
                    <label className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-2 opacity-50">Stability Index</label>
                    <div className="text-2xl font-black text-white flex items-baseline gap-1">
                        {stabilityIndex}<span className="text-[10px] text-gray-600 font-bold">/10</span>
                    </div>
                </div>
                <div className="bg-white/[0.01] rounded-2xl p-4 border border-white/[0.02]">
                    <label className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-2 opacity-50">Fatalities</label>
                    <div className={`text-2xl font-black flex items-center gap-1 ${fatalities > 0 ? 'text-[#ff4d00]' : 'text-[#00d5ff]'}`}>
                        {fatalities} <TrendingUp size={12} />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        <span>Conflict Density</span>
                        <span className="text-red-500">{fatalities > 0 ? 'Elevated' : 'Monitored'}</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/[0.03] rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(255,45,85,0.4)]" style={{ width: `${conflictDensity}%` }}></div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        <span>Economic Integration</span>
                        <span className="text-blue-500">{economicTone}</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/[0.03] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(0,136,255,0.4)]" style={{ width: `${economicIntegration}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/[0.03] space-y-3">
                <p className="text-[12px] leading-[1.6] text-[#9ca3af]">{summaryLine}</p>
                <button className="w-full py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] text-white text-[10px] font-bold uppercase tracking-widest border border-white/[0.05] transition-all flex items-center justify-center gap-2 group">
                    <BarChart3 size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                    Operational Analysis
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/[0.03] border border-blue-500/10">
                    <Globe size={10} className="text-blue-500 opacity-60" />
                    <span className="text-[8px] text-blue-400/80 uppercase font-mono tracking-widest leading-none">
                        {province.eventDate ? `Event Date: ${province.eventDate}` : `Sector: ${province.iso ?? province.name}`}
                    </span>
                </div>
            </div>
        </div>
    );
}
