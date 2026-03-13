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
  const signalLevel = fatalities >= 2 ? "critical" : fatalities >= 1 ? "warning" : "normal";
  const guidance = [
    "Read this place against the imagery layer before turning on additional overlays.",
    "Use market and briefing cards to see whether the signal is isolated or systemic.",
    province.eventDate
      ? `Latest recorded event: ${province.eventDate}.`
      : `Use ${province.name} as a geographic anchor for adjacent signals.`,
  ];

  return (
    <div className={`absolute bottom-28 right-8 z-[60] w-[360px] border bg-white/96 p-6 backdrop-blur-xl module-card`} data-priority={signalLevel}>
      <div className="mb-5 flex items-start justify-between">
        <div className="space-y-1">
          <div className="eyebrow">Selected place</div>
          <h2 className="text-[22px] font-black tracking-tight uppercase">
            {province.name}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-30">
            {province.type ?? `Sector code: ${province.iso ?? "Regional"}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="border border-[var(--line)] bg-white p-2 transition-colors hover:bg-black hover:text-white"
        >
          <X size={12} />
        </button>
      </div>

      <p className="text-[12px] leading-5 text-[var(--muted)]">{summaryLine}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="border border-[var(--line)] p-3 bg-[var(--bg)]">
          <label className="block text-[7px] font-black uppercase tracking-widest opacity-40">
            Stability index
          </label>
          <div className="flex items-baseline gap-1 pt-1.5 text-[24px] font-black tracking-tight">
            {stabilityIndex}
            <span className="text-[9px] opacity-30">/10</span>
          </div>
        </div>
        <div className={`border p-3 ${fatalities > 0 ? "border-[var(--accent)] bg-[rgba(255,59,48,0.03)]" : "border-[var(--line)] bg-[var(--bg)]"}`}>
          <label className="block text-[7px] font-black uppercase tracking-widest opacity-40">
            Fatalities
          </label>
          <div className={`flex items-center gap-1 pt-1.5 text-[24px] font-black tracking-tight ${
            fatalities > 0 ? "text-[var(--accent)]" : ""
          }`}>
            {fatalities}
            <TrendingUp size={10} />
          </div>
        </div>
      </div>

      <div className="mt-4 border border-[var(--line)] p-3">
        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
          <span>Immediate read</span>
          <span className={`stat-pill ${fatalities > 0 ? "danger" : "info"}`}>
            {attentionLevel}
          </span>
        </div>
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
              <span>Conflict density</span>
              <span>{fatalities > 0 ? "Elevated" : "Monitored"}</span>
            </div>
            <div className="mt-1 h-[2px] w-full bg-[var(--line-dim)]">
              <div className="h-full bg-[var(--accent)]" style={{ width: `${conflictDensity}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
              <span>Economic integration</span>
              <span>{economicTone}</span>
            </div>
            <div className="mt-1 h-[2px] w-full bg-[var(--line-dim)]">
              <div className="h-full bg-[var(--tech)]" style={{ width: `${economicIntegration}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--line)] pt-4">
        <div className="eyebrow mb-2">What to watch next</div>
        <div className="space-y-2">
          {guidance.map((item) => (
            <div
              key={item}
              className="border border-[var(--line-dim)] p-2.5 text-[10px] leading-4 text-[var(--muted)] bg-[var(--bg)]"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 border border-[var(--line)] px-3 py-2 bg-[var(--bg)]">
          <Globe size={10} className="opacity-30" />
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
            {province.eventDate
              ? `Event date: ${province.eventDate}`
              : `Sector: ${province.iso ?? province.name}`}
          </span>
        </div>
      </div>
    </div>
  );
}
