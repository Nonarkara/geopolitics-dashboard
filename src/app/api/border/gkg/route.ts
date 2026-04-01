import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "../../../../lib/db";
import { logFeedHealth } from "../../../../lib/supabase";
import { archiveSignalBatch, type ArchiveSignal } from "../../../../lib/signal-archive";
import type { GkgEntity, GkgResponse } from "../../../../types/dashboard";

export const revalidate = 900; // 15 minutes

interface GkgRow {
  id: number;
  entity_type: string;
  entity_name: string;
  mention_count: number;
  avg_tone: number | null;
  source_count: number;
  first_seen: string;
  last_seen: string;
  sample_sources: string[];
  ref_date: string;
}

const FALLBACK: GkgResponse = {
  generatedAt: new Date().toISOString(),
  entities: [],
};

export async function GET(request: NextRequest) {
  const t0 = Date.now();

  if (!isDatabaseConfigured) {
    return NextResponse.json(FALLBACK);
  }

  const { searchParams } = request.nextUrl;
  const entityType = searchParams.get("type"); // person, organization, theme
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);

  try {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (entityType) {
      conditions.push(`entity_type = $${idx++}`);
      values.push(entityType);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query<GkgRow>(
      `SELECT * FROM gkg_entities ${where}
       ORDER BY ref_date DESC, mention_count DESC
       LIMIT ${limit}`,
      values,
    );

    const entities: GkgEntity[] = result.rows.map((row) => ({
      id: row.id,
      entityType: row.entity_type as GkgEntity["entityType"],
      entityName: row.entity_name,
      mentionCount: row.mention_count,
      avgTone: row.avg_tone,
      sourceCount: row.source_count,
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      sampleSources: row.sample_sources,
      refDate: row.ref_date,
    }));

    // Archive entity mentions to signal_archive
    if (entities.length > 0) {
      const hourKey = new Date().toISOString().slice(0, 13);
      const signals: ArchiveSignal[] = entities.slice(0, 10).map((e): ArchiveSignal => ({
        external_id: `gkg-${e.entityType}-${e.entityName.slice(0, 60).replace(/\W+/g, "-")}-${hourKey}`,
        signal_type: "gkg",
        source_provider: "gdelt-gkg",
        source_url: "https://api.gdeltproject.org/api/v2/gkg/gkg",
        title: `[${e.entityType.toUpperCase()}] ${e.entityName} (${e.mentionCount} mentions)`,
        summary: `Avg tone: ${e.avgTone?.toFixed(2) ?? "N/A"}, from ${e.sourceCount} sources`,
        published_at: e.lastSeen,
        severity: (e.avgTone ?? 0) < -2 ? "alert" : (e.avgTone ?? 0) < -1 ? "watch" : "stable",
        score: Math.min(e.mentionCount / 50, 1),
        keywords: [e.entityType, e.entityName.toLowerCase().replace(/\W+/g, "-")],
        payload: {
          type: "gkg_entity",
          entityType: e.entityType,
          entityName: e.entityName,
          mentionCount: e.mentionCount,
          avgTone: e.avgTone,
          sourceCount: e.sourceCount,
        },
      }));
      void archiveSignalBatch(signals);
    }

    void logFeedHealth({ feed_id: "gkg", status: "ok", response_time_ms: Date.now() - t0, message: null });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      entities,
    });
  } catch {
    void logFeedHealth({ feed_id: "gkg", status: "error", response_time_ms: Date.now() - t0, message: "query failed" });
    return NextResponse.json(FALLBACK);
  }
}
