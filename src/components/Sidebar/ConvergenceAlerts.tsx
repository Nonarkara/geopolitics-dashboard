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
    <div className="space-y-6">
      {hotspots.map((spot) => (
        <div
          key={spot.id}
          className="rounded-[22px] border border-[#d6cebf] bg-[#f7f2ea] p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
                Area {spot.id}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${
                  spot.risk === "Priority"
                    ? "bg-[#ead8ce] text-[#8b5a40]"
                    : "bg-[#dce7ea] text-[#4f6871]"
                }`}
              >
                {spot.risk}
              </span>
            </div>
            <span className="text-[12px] font-semibold tabular-nums text-[#171512]">
              {spot.level}%
            </span>
          </div>

          <h4 className="pt-4 text-[16px] font-semibold tracking-[-0.02em] text-[#171512]">
            {spot.location}
          </h4>

          <div className="pt-3 flex flex-wrap gap-2">
            {spot.factors.map((factor) => (
              <span
                key={factor}
                className="rounded-full bg-[#ece3d8] px-2.5 py-1 text-[10px] text-[#5b554b]"
              >
                {factor}
              </span>
            ))}
          </div>

          <div className="relative mt-4 h-[3px] w-full overflow-hidden rounded-full bg-[#d7d0c3]">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${
                spot.risk === "Priority" ? "bg-[#8b5a40]" : "bg-[#4f6871]"
              }`}
              style={{ width: `${spot.level}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
