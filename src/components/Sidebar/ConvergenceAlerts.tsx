export default function ConvergenceAlerts() {
    const hotspots = [
        { id: '01', location: 'MAE_SOT_SECTOR', risk: 'CRITICAL', factors: ['TACTICAL', 'THERMAL', 'PLUVIAL'], level: 92 },
        { id: '02', location: 'TAK_BORDER_ZONE', risk: 'ELEVATED', factors: ['INFANTRY', 'LOGISTICS'], level: 65 }
    ];

    return (
        <div className="space-y-10">
            {hotspots.map((spot, idx) => (
                <div key={idx} className="group space-y-4">
                    <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-[#7a7a7a]">ALERT_{spot.id}</span>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${spot.risk === 'CRITICAL' ? 'text-[#ff4d00]' : 'text-[#00d5ff]'}`}>
                                {spot.risk}
                            </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#e5e5e5] tabular-nums">{spot.level}%</span>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[14px] font-bold text-[#e5e5e5] tracking-tight">{spot.location}</h4>
                        <div className="flex flex-wrap gap-2">
                            {spot.factors.map((f, i) => (
                                <span key={i} className="text-[9px] font-bold text-[#444] uppercase tracking-widest bg-[#111] px-2 py-1">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Functional Indicator */}
                    <div className="h-[2px] w-full bg-[#111] relative">
                        <div
                            className={`absolute top-0 left-0 h-full transition-all duration-500 ${spot.risk === 'CRITICAL' ? 'bg-[#ff4d00]' : 'bg-[#00d5ff]'}`}
                            style={{ width: `${spot.level}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
