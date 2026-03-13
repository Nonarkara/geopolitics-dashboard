export default function ConvergenceAlerts() {
  const hotspots = [
    {
      id: "01",
      location: "Mae Sot corridor",
      risk: "Priority",
      factors: ["Incident clustering", "Trade pressure", "Thermal activity"],
      level: 92,
    },
    {
      id: "02",
      location: "Tak border zone",
      risk: "Watch",
      factors: ["Transport flow", "Rainfall variation"],
      level: 65,
    },
  ];

  return (
    <div className="space-y-2">
      {hotspots.map((spot) => (
        <div
          key={spot.id}
          className={`border p-3 ${
            spot.risk === "Priority"
              ? "border-[var(--accent)] border-[2px]"
              : "border-[var(--line-dim)]"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                AREA {spot.id}
              </span>
              <span className={`stat-pill ${spot.risk === "Priority" ? "danger" : "info"}`}>
                {spot.risk}
              </span>
            </div>
            <span className="text-[11px] font-black tabular-nums">
              {spot.level}%
            </span>
          </div>

          <h4 className="text-[12px] font-black uppercase tracking-tight mb-2">
            {spot.location}
          </h4>

          <div className="flex flex-wrap gap-1 mb-2">
            {spot.factors.map((factor) => (
              <span
                key={factor}
                className="text-[9px] font-black uppercase tracking-widest opacity-60 px-1.5 py-0.5 bg-[var(--bg)] border border-[var(--line-dim)]"
              >
                {factor}
              </span>
            ))}
          </div>

          <div className="h-[2px] w-full bg-[var(--line-dim)]">
            <div
              className={`h-full ${
                spot.risk === "Priority" ? "bg-[var(--accent)]" : "bg-[var(--tech)]"
              }`}
              style={{ width: `${spot.level}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
