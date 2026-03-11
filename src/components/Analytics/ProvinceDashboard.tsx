import { Globe, TrendingUp, X } from "lucide-react";
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
  const economicTone =
    economicIntegration >= 60 ? "Stable" : economicIntegration >= 40 ? "Watch" : "Strained";
  const summaryLine =
    province.notes ?? `${province.name} selected from the regional border layer.`;
  const attentionLevel =
    fatalities >= 2 ? "Immediate review" : fatalities >= 1 ? "Close watch" : "Routine monitoring";
  const guidance = [
    "Read this place against the imagery layer before turning on additional overlays.",
    "Use market and briefing cards to see whether the signal is isolated or systemic.",
    province.eventDate
      ? `Latest recorded event: ${province.eventDate}.`
      : `Use ${province.name} as a geographic anchor for adjacent signals.`,
  ];

  return (
    <div className="absolute bottom-28 right-8 z-[60] w-[360px] rounded-[28px] border border-[#d6cebf] bg-[#efe7dc]/96 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-1">
          <div className="eyebrow">Selected place</div>
          <h2 className="text-[26px] font-semibold tracking-[-0.04em] text-[#171512]">
            {province.name}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#736c61]">
            {province.type ?? `Sector code: ${province.iso ?? "Regional"}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-[#d6cebf] bg-white/60 p-2 transition-colors hover:bg-white"
        >
          <X size={14} className="text-[#5f5b52]" />
        </button>
      </div>

      <p className="text-[14px] leading-6 text-[#4f4a42]">{summaryLine}</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-[20px] border border-[#d6cebf] bg-[#f7f2ea] p-4">
          <label className="block text-[9px] uppercase tracking-[0.18em] text-[#7a7468]">
            Stability index
          </label>
          <div className="flex items-baseline gap-1 pt-2 text-[30px] font-semibold tracking-[-0.04em] text-[#171512]">
            {stabilityIndex}
            <span className="text-[10px] text-[#7a7468]">/10</span>
          </div>
        </div>
        <div className="rounded-[20px] border border-[#d6cebf] bg-[#f7f2ea] p-4">
          <label className="block text-[9px] uppercase tracking-[0.18em] text-[#7a7468]">
            Fatalities
          </label>
          <div
            className={`flex items-center gap-1 pt-2 text-[30px] font-semibold tracking-[-0.04em] ${
              fatalities > 0 ? "text-[#8b5a40]" : "text-[#4f6871]"
            }`}
          >
            {fatalities}
            <TrendingUp size={12} />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[22px] border border-[#d6cebf] bg-[#f7f2ea] p-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
          <span>Immediate read</span>
          <span className={fatalities > 0 ? "text-[#8b5a40]" : "text-[#4f6871]"}>
            {attentionLevel}
          </span>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
              <span>Conflict density</span>
              <span>{fatalities > 0 ? "Elevated" : "Monitored"}</span>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#d7d0c3]">
              <div className="h-full bg-[#8b5a40]" style={{ width: `${conflictDensity}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
              <span>Economic integration</span>
              <span className="text-[#4f6871]">{economicTone}</span>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#d7d0c3]">
              <div className="h-full bg-[#4f6871]" style={{ width: `${economicIntegration}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-[#d6cebf] pt-5">
        <div className="eyebrow">What to watch next</div>
        <div className="mt-3 space-y-3">
          {guidance.map((item) => (
            <div
              key={item}
              className="rounded-[18px] border border-[#d6cebf] bg-white/60 p-3 text-[12px] leading-5 text-[#4f4a42]"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-[#d6cebf] bg-[#f7f2ea] px-4 py-3">
          <Globe size={12} className="text-[#5f5b52]" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#6d675d]">
            {province.eventDate
              ? `Event date: ${province.eventDate}`
              : `Sector: ${province.iso ?? province.name}`}
          </span>
        </div>
      </div>
    </div>
  );
}
