"use client";

import LiveFeedsRail from "./LiveFeedsRail";
import SignalDossier from "./SignalDossier";
import ContextRail from "./ContextRail";

export default function BottomIntelRail() {
  return (
    <section
      data-testid="phuket-bottom-rail"
      className="grid h-[260px] shrink-0 gap-px border-t border-[var(--line)] bg-[var(--line)] xl:grid-cols-[1.2fr_1.35fr_0.95fr]"
    >
      <LiveFeedsRail />
      <SignalDossier />
      <ContextRail />
    </section>
  );
}
