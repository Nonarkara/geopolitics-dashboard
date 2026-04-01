import { NextResponse } from "next/server";
import { loadBorderCommandBrief } from "../../../../lib/border-command";
import { archiveSignalBatch, type ArchiveSignal } from "../../../../lib/signal-archive";

export const revalidate = 60;

export async function GET() {
  const brief = await loadBorderCommandBrief();

  // Archive the computed intelligence product — posture scores, area assessments,
  // score breakdowns, and action queue. This is the most important computed output
  // of the entire dashboard and must be preserved for longitudinal analysis.
  try {
    const signals: ArchiveSignal[] = [];

    // Archive overall posture as a signal
    signals.push({
      external_id: `brief-posture-${new Date().toISOString().slice(0, 13)}`,
      signal_type: "political",
      source_provider: "border-command-engine",
      title: `Border command posture: ${brief.overallPosture} (score ${brief.overallScore})`,
      summary: brief.headline ?? `${brief.areas.length} areas assessed. Posture: ${brief.overallPosture}.`,
      published_at: brief.generatedAt ?? new Date().toISOString(),
      severity: brief.overallPosture === "priority" ? "alert" : brief.overallPosture === "watch" ? "watch" : "stable",
      score: brief.overallScore / 100,
      payload: {
        type: "brief_posture",
        overallPosture: brief.overallPosture,
        overallScore: brief.overallScore,
        generatedAt: brief.generatedAt,
      },
    });

    // Archive each area assessment with full score breakdown
    for (const area of brief.areas) {
      signals.push({
        external_id: `brief-area-${area.id}-${new Date().toISOString().slice(0, 13)}`,
        signal_type: "political",
        source_provider: "border-command-engine",
        title: `${area.label}: ${area.posture} (score ${area.score})`,
        summary: area.summary,
        published_at: brief.generatedAt ?? new Date().toISOString(),
        region: area.id,
        severity: area.posture === "priority" ? "alert" : area.posture === "watch" ? "watch" : "stable",
        score: area.score / 100,
        keywords: area.watchpoints ?? [],
        payload: {
          type: "area_assessment",
          areaId: area.id,
          posture: area.posture,
          score: area.score,
          incidentCount: area.incidentCount,
          fatalityCount: area.fatalityCount,
          verifiedCameras: area.verifiedCameras,
          scoreBreakdown: area.scoreBreakdown,
          recommendedAction: area.recommendedAction,
          signals: area.signals,
        },
      });
    }

    // Archive top concerns
    for (const concern of (brief.topConcerns ?? []).slice(0, 5)) {
      signals.push({
        external_id: `brief-concern-${concern.id}-${new Date().toISOString().slice(0, 13)}`,
        signal_type: "political",
        source_provider: "border-command-engine",
        title: `Concern: ${concern.label} (${concern.areaLabel})`,
        summary: concern.detail,
        published_at: brief.generatedAt ?? new Date().toISOString(),
        region: concern.areaId,
        severity: "watch",
        payload: {
          type: "top_concern",
          metric: concern.metric,
          areaId: concern.areaId,
        },
      });
    }

    void archiveSignalBatch(signals);
  } catch {
    // Non-critical: don't block the brief response
  }

  return NextResponse.json(brief);
}
