export const runtime = 'edge';

import { NextResponse } from "next/server";
import { fallbackTicker } from "../../../../lib/mock-data";
import {
  buildBorderTicker,
  loadBorderIncidents,
  loadBorderOsint,
} from "../../../../lib/border-osint";
import { loadThailandEconomics } from "../../../../lib/thailand-monitor";
import { archiveSignalBatch, type ArchiveSignal } from "../../../../lib/signal-archive";

export async function GET() {
  try {
    const [incidents, indicators, osint] = await Promise.all([
      loadBorderIncidents(),
      loadThailandEconomics(),
      loadBorderOsint(),
    ]);

    const ticker = buildBorderTicker(incidents, indicators, osint);

    // Archive ticker snapshot — aggregated summary metrics show the dashboard's
    // operational picture at a point in time, valuable for trend reconstruction.
    try {
      const hourKey = new Date().toISOString().slice(0, 13);
      const signals: ArchiveSignal[] = [{
        external_id: `ticker-snapshot-${hourKey}`,
        signal_type: "market",
        source_provider: "border-ticker-engine",
        title: `Ticker snapshot: ${ticker.items.length} indicators`,
        summary: ticker.items.map(i => `${i.label}: ${i.value} (${i.delta})`).join(" | "),
        published_at: ticker.generatedAt ?? new Date().toISOString(),
        severity: "stable",
        keywords: ticker.items.map(i => i.label.toLowerCase().replace(/\W+/g, "-")),
        payload: {
          type: "ticker_snapshot",
          items: ticker.items,
          generatedAt: ticker.generatedAt,
        },
      }];
      void archiveSignalBatch(signals);
    } catch {
      // Non-critical
    }

    return NextResponse.json(ticker);
  } catch {
    return NextResponse.json(fallbackTicker, { status: 200 });
  }
}
