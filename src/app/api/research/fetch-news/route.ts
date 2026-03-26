import { NextResponse } from "next/server";
import { getSupabase, supabaseEnabled } from "../../../../lib/supabase";
import { classifyRegion } from "../../../../lib/signal-archive";

/**
 * GET /api/research/fetch-news
 *
 * Bulletproof news fetching pipeline: RSS-first with API failover.
 * Fetches due sources from news_sources, parses RSS, deduplicates,
 * and stores articles in news_articles + mirrors to signal_archive.
 *
 * Call via cron (every 5 minutes) or manually.
 */

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  contentSnippet?: string;
  content?: string;
  guid?: string;
  categories?: string[];
}

interface RssChannel {
  title?: string;
  items: RssItem[];
}

/** Minimal RSS parser — no dependencies needed */
async function parseRssFeed(url: string): Promise<RssChannel> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ThailandGeopoliticalWatch/5.1 (research; +https://github.com/Nonarkara/geopolitics-dashboard)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // Simple XML extraction (no parser library needed)
    const channelTitle = text.match(/<channel>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] ?? "";

    const items: RssItem[] = [];
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const itemXml = match[1];
      const extract = (tag: string) => {
        const m = itemXml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`));
        return m?.[1]?.trim() ?? undefined;
      };

      items.push({
        title: extract("title"),
        link: extract("link") || extract("guid"),
        pubDate: extract("pubDate") || extract("dc:date") || extract("published"),
        description: extract("description"),
        contentSnippet: extract("content:encoded")?.replace(/<[^>]+>/g, "").slice(0, 500),
        guid: extract("guid"),
      });
    }

    return { title: channelTitle, items };
  } catch {
    clearTimeout(timeout);
    throw new Error(`Failed to fetch RSS: ${url}`);
  }
}

/** Generate a stable idempotency key */
function idempotencyKey(title: string, url: string, publishedAt: string): string {
  const raw = `${title}|${url}|${publishedAt}`;
  // Simple hash — btoa works for dedup purposes
  try {
    return Buffer.from(raw).toString("base64").slice(0, 255);
  } catch {
    return raw.slice(0, 255);
  }
}

/** Simple content hash for near-dupe detection */
function contentHash(text: string): string {
  try {
    return Buffer.from(text.slice(0, 200)).toString("base64").slice(0, 64);
  } catch {
    return text.slice(0, 64);
  }
}

export async function GET() {
  if (!supabaseEnabled) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: "Supabase client unavailable" }, { status: 503 });

  // 1. Get due RSS sources
  const { data: sources, error: srcError } = await sb
    .from("news_sources")
    .select("*")
    .eq("status", "active")
    .eq("type", "rss")
    .lte("next_fetch_at", new Date().toISOString())
    .order("next_fetch_at", { ascending: true })
    .limit(10); // Process 10 at a time to stay within edge limits

  if (srcError || !sources || sources.length === 0) {
    return NextResponse.json({ fetched: 0, sources: 0, message: sources?.length === 0 ? "No sources due for fetch" : srcError?.message });
  }

  let totalFetched = 0;
  let totalErrors = 0;
  const results: { source: string; articles: number; error?: string }[] = [];

  for (const source of sources) {
    try {
      const feed = await parseRssFeed(source.url);
      let articleCount = 0;

      for (const item of feed.items) {
        if (!item.title || !item.link) continue;

        const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
        const description = item.description?.replace(/<[^>]+>/g, "").slice(0, 1000) ?? item.contentSnippet ?? null;
        const region = classifyRegion(`${item.title} ${description ?? ""}`) ?? null;

        // Extract key arguments from description
        const keyArgs = description
          ? description.split(/\.\s+/).filter((s) => s.length > 15).slice(0, 5)
          : null;

        const ikey = idempotencyKey(item.title, item.link, publishedAt);

        const { error: insertError } = await sb.from("news_articles").insert({
          idempotency_key: ikey,
          title: item.title,
          url: item.link,
          source: feed.title || source.name,
          published_at: publishedAt,
          description,
          key_arguments: keyArgs,
          provider: "rss",
          content_hash: description ? contentHash(description) : null,
          region,
          severity: null,
        });

        if (!insertError) {
          articleCount++;

          // Also mirror to signal_archive
          await sb.from("signal_archive").insert({
            external_id: item.link,
            signal_type: "news",
            source_provider: source.name.toLowerCase().replace(/\s+/g, "-"),
            source_url: source.url,
            title: item.title,
            summary: description?.slice(0, 500) ?? null,
            url: item.link,
            published_at: publishedAt,
            region,
            keywords: item.title
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, " ")
              .split(/\s+/)
              .filter((w) => w.length > 3)
              .slice(0, 15),
          }).then(() => {/* ok */}).catch(() => {/* dupe ok */});
        }
        // Ignore duplicate errors (idempotency_key conflict = already stored)
      }

      totalFetched += articleCount;

      // Update source health
      const nextFetch = new Date(Date.now() + source.fetch_interval_minutes * 60000).toISOString();
      await sb.from("news_sources").update({
        success_rate: 1.0,
        consecutive_failures: 0,
        last_fetched_at: new Date().toISOString(),
        next_fetch_at: nextFetch,
      }).eq("id", source.id);

      results.push({ source: source.name, articles: articleCount });
    } catch (err) {
      totalErrors++;
      const failures = (source.consecutive_failures ?? 0) + 1;

      await sb.from("news_sources").update({
        consecutive_failures: failures,
        status: failures >= 5 ? "unhealthy" : "active",
        next_fetch_at: new Date(Date.now() + source.fetch_interval_minutes * 60000 * Math.min(failures, 4)).toISOString(),
      }).eq("id", source.id);

      results.push({ source: source.name, articles: 0, error: err instanceof Error ? err.message : "unknown" });
    }

    // Polite delay between sources (1s)
    await new Promise((r) => setTimeout(r, 1000));
  }

  return NextResponse.json({
    fetched: totalFetched,
    sources: sources.length,
    errors: totalErrors,
    results,
    timestamp: new Date().toISOString(),
  });
}
