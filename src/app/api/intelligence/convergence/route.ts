export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import {
  getConvergenceCorridor,
  loadCorridorConvergence,
} from "../../../../lib/convergence";
import { archiveSignalBatch, type ArchiveSignal } from "../../../../lib/signal-archive";
import type { ConvergenceAlert } from "../../../../types/dashboard";

export async function GET(request: NextRequest) {
  const corridorId =
    request.nextUrl.searchParams.get("corridor") ?? "phuket-andaman";

  if (!getConvergenceCorridor(corridorId)) {
    return NextResponse.json(
      {
        error: "Unsupported corridor",
        supportedCorridors: ["phuket-andaman"],
      },
      { status: 400 },
    );
  }

  const result = await loadCorridorConvergence(corridorId);

  // Archive convergence alerts — pattern correlations are a computed intelligence
  // product that must be preserved for longitudinal conflict trend analysis.
  try {
    const signals: ArchiveSignal[] = [];
    const now = new Date().toISOString();

    if (result && typeof result === "object" && "alerts" in result && Array.isArray((result as { alerts: unknown[] }).alerts)) {
      const alerts = (result as { alerts: ConvergenceAlert[] }).alerts;
      for (const alert of alerts) {
        signals.push({
          external_id: `convergence-${corridorId}-${alert.id}-${now.slice(0, 13)}`,
          signal_type: "osint",
          source_provider: "convergence-engine",
          title: `Convergence: ${alert.families.join(", ")} (score ${alert.score})`,
          summary: alert.summary,
          published_at: now,
          severity: alert.score >= 0.7 ? "alert" : alert.score >= 0.4 ? "watch" : "stable",
          score: alert.score,
          keywords: alert.families,
          payload: {
            type: "convergence_alert",
            corridorId,
            alertId: alert.id,
            posture: alert.posture,
            score: alert.score,
            families: alert.families,
            evidenceCount: alert.evidence.length,
            dataGaps: alert.dataGaps,
            windowHours: alert.windowHours,
          },
        });
      }
    }

    if (signals.length > 0) {
      void archiveSignalBatch(signals);
    }
  } catch {
    // Non-critical
  }

  return NextResponse.json(result);
}
