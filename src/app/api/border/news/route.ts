import { NextResponse } from "next/server";
import { fallbackNews } from "../../../../lib/mock-data";
import {
  buildBorderNews,
  loadBorderIncidents,
  loadBorderOsint,
} from "../../../../lib/border-osint";
import { loadThailandEconomics } from "../../../../lib/thailand-monitor";
import { logFeedHealth, upsertNewsItem } from "../../../../lib/supabase";

export async function GET() {
  const t0 = Date.now();
  try {
    const [incidents, indicators, osint] = await Promise.all([
      loadBorderIncidents(),
      loadThailandEconomics(),
      loadBorderOsint(),
    ]);

    const news = buildBorderNews(incidents, indicators, osint);

    // Persist news items to Supabase (non-blocking)
    if (Array.isArray(news)) {
      for (const item of news.slice(0, 20)) {
        if (item.title && item.url) {
          void upsertNewsItem({
            source: item.source ?? "border-osint",
            title: item.title,
            summary: item.summary ?? null,
            url: item.url,
            published_at: item.publishedAt ?? new Date().toISOString(),
            severity: item.severity ?? null,
            tags: item.tags ?? [],
            payload: null,
          });
        }
      }
    }

    void logFeedHealth({ feed_id: "border-news", status: "ok", response_time_ms: Date.now() - t0, message: null });
    return NextResponse.json(news);
  } catch {
    void logFeedHealth({ feed_id: "border-news", status: "error", response_time_ms: Date.now() - t0, message: "build failed" });
    return NextResponse.json(fallbackNews, { status: 200 });
  }
}
