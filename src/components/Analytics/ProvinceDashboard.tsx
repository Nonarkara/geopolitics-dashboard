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
    <div className="absolute bottom-28 right-8 z-[60] w-[340px] rounded-xl border border-[var(--line-bright)] bg-[var(--bg)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between">
        <div className="space-y-1">
          <div className="eyebrow">Selected place</div>
          <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[var(--ink)]">
            {province.name}
          </h2>
          <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-[var(--dim)]">
            {province.type ?? `Sector: ${province.iso ?? "Regional"}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-[var(--line-bright)] bg-[var(--bg-raised)] p-2 transition-colors hover:bg-[var(--bg-surface)]"
        >
          <X size={12} className="text-[var(--muted)]" />
        </button>
      </div>

      <p className="text-[12px] leading-5 text-[var(--muted)]">{summaryLine}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-3">
          <label className="block text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--dim)]">
            Stability
          </label>
          <div className="flex items-baseline gap-1 pt-1 text-[24px] font-bold font-mono tabular-nums text-[var(--ink)]">
            {stabilityIndex}
            <span className="text-[9px] text-[var(--dim)]">/10</span>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-3">
          <label className="block text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--dim)]">
            Fatalities
          </label>
          <div
            className={`flex items-center gap-1 pt-1 text-[24px] font-bold font-mono tabular-nums ${
              fatalities > 0 ? "text-[#f59e0b]" : "text-[var(--cool)]"
            }`}
          >
            {fatalities}
            <TrendingUp size={12} />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-3">
        <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--dim)]">
          <span>Immediate read</span>
          <span className={fatalities > 0 ? "text-[#f59e0b]" : "text-[var(--cool)]"}>
            {attentionLevel}
          </span>
        </div>
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.16em] text-[var(--dim)]">
              <span>Conflict density</span>
              <span>{fatalities > 0 ? "Elevated" : "Monitored"}</span>
            </div>
            <div className="mt-1.5 h-[2px] w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
              <div className="h-full bg-[#f59e0b]" style={{ width: `${conflictDensity}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.16em] text-[var(--dim)]">
              <span>Economic integration</span>
              <span className="text-[var(--cool)]">{economicTone}</span>
            </div>
            <div className="mt-1.5 h-[2px] w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
              <div className="h-full bg-[var(--cool)]" style={{ width: `${economicIntegration}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="eyebrow">What to watch</div>
        {guidance.map((item) => (
          <div
            key={item}
            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-2 text-[10px] leading-4 text-[var(--muted)]"
          >
            {item}
          </div>
        ))}

        <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2">
          <Globe size={10} className="text-[var(--cool)]" />
          <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-[var(--dim)]">
            {province.eventDate
              ? `Event: ${province.eventDate}`
              : `Sector: ${province.iso ?? province.name}`}
          </span>
        </div>
      </div>
    </div>
  );
}
