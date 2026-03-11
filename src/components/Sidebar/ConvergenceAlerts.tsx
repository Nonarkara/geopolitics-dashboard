export default function ConvergenceAlerts() {
    const hotspots = [
        { id: '01', location: 'MAE_SOT_SECTOR', risk: 'CRITICAL', factors: ['TACTICAL', 'THERMAL', 'PLUVIAL'], level: 92 },
        { id: '02', location: 'TAK_BORDER_ZONE', risk: 'ELEVATED', factors: ['INFANTRY', 'LOGISTICS'], level: 65 }
    ];

    return (
        <div className="space-y-8">
            {hotspots.map((spot, idx) => (
                <div key={idx} className="space-y-4 border-b border-[#d7d0c3] pb-6 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#7a7468]">Alert {spot.id}</span>
                            <span className={`text-[10px] font-medium uppercase tracking-[0.2em] ${spot.risk === 'CRITICAL' ? 'text-[#8d3e23]' : 'text-[#4f6a73]'}`}>
                                {spot.risk}
                            </span>
                        </div>
                        <span className="text-[12px] font-semibold text-[#121212] tabular-nums">{spot.level}%</span>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[15px] font-semibold tracking-[-0.02em] text-[#121212]">{spot.location.replaceAll('_', ' ')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {spot.factors.map((f, i) => (
                                <span key={i} className="bg-[#dbd3c6] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-[#4b473f]">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[2px] w-full bg-[#d7d0c3]">
                        <div
                            className={`absolute top-0 left-0 h-full transition-all duration-500 ${spot.risk === 'CRITICAL' ? 'bg-[#8d3e23]' : 'bg-[#4f6a73]'}`}
                            style={{ width: `${spot.level}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
