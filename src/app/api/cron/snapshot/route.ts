/**
 * V8 snapshot ingestion — one cron call captures every live data source
 * into append-only Supabase tables for long-term trend analysis.
 *
 * Triggered by:
 *   1. Cloudflare Worker cron (every 15 minutes — see wrangler.jsonc)
 *   2. Manual GET with header `x-cron-secret: <CRON_SECRET>` for ad-hoc capture
 *
 * Writes 7 snapshot tables. Each run creates exactly one v8_ingest_runs row.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "../../../../lib/supabase-server";

const ASEAN_CURRENCIES = [
  "THB", "MYR", "SGD", "IDR", "VND",
  "LAK", "MMK", "KHR", "PHP", "BND"
];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const rowsWritten: Record<string, number> = {};
  const errors: string[] = [];
  const trigger = req.headers.get("cf-worker") ? "cron" : "manual";

  // Optional secret check for manual calls (Cloudflare cron bypasses via absent secret)
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && trigger === "manual") {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const supa = getServiceSupabase();
  if (!supa) {
    return NextResponse.json(
      { error: "Supabase service role not configured (SUPABASE_SERVICE_ROLE_KEY missing)" },
      { status: 500 },
    );
  }

  // Resolve absolute base URL for calling our own API routes server-side
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(req.url).origin;
  const capturedAt = new Date().toISOString();

  // ── NEWS ────────────────────────────────────────────────────
  try {
    const news = await fetchJson<{ news?: Array<Record<string, unknown>> }>(
      `${base}/api/border/news`,
      { news: [] },
    );
    const items = Array.isArray(news?.news) ? news.news : [];
    if (items.length) {
      const rows = items.map((n) => {
        const item = n as Record<string, unknown>;
        return {
          captured_at: capturedAt,
          news_id: String(item.id ?? ""),
          title: String(item.title ?? ""),
          summary: (item.summary as string) ?? null,
          source: (item.source as string) ?? null,
          source_url: (item.sourceUrl as string) ?? null,
          tag: (item.tag as string) ?? null,
          published_at: (item.publishedAt as string) ?? null,
          raw: item,
        };
      }).filter((r) => r.news_id);
      const { error, count } = await supa
        .from("v8_news_snapshots")
        .upsert(rows, { onConflict: "news_id,captured_at", count: "exact" });
      if (error) errors.push(`news: ${error.message}`);
      else rowsWritten.news = count ?? rows.length;
    }
  } catch (e) {
    errors.push(`news: ${(e as Error).message}`);
  }

  // ── INCIDENTS ──────────────────────────────────────────────
  try {
    const incidents = await fetchJson<Array<Record<string, unknown>>>(
      `${base}/api/border/incidents`,
      [],
    );
    if (Array.isArray(incidents) && incidents.length) {
      const rows = incidents.map((inc) => {
        const geom = inc.geometry as { coordinates?: [number, number] } | undefined;
        const p = (inc.properties ?? {}) as Record<string, unknown>;
        const [lng, lat] = geom?.coordinates ?? [null, null];
        return {
          captured_at: capturedAt,
          incident_id: String(inc.id ?? ""),
          title: (p.title as string) ?? null,
          event_type: (p.type as string) ?? null,
          location: (p.location as string) ?? null,
          fatalities: (p.fatalities as number) ?? 0,
          longitude: lng,
          latitude: lat,
          event_date: (p.eventDate as string) ?? null,
          notes: (p.notes as string) ?? null,
          raw: inc,
        };
      }).filter((r) => r.incident_id);
      const { error, count } = await supa
        .from("v8_incident_snapshots")
        .upsert(rows, { onConflict: "incident_id,captured_at", count: "exact" });
      if (error) errors.push(`incidents: ${error.message}`);
      else rowsWritten.incidents = count ?? rows.length;
    }
  } catch (e) {
    errors.push(`incidents: ${(e as Error).message}`);
  }

  // ── FIRES (rollup only — full fire array is 9k+ rows, too much per cycle) ──
  try {
    const fires = await fetchJson<Array<{ latitude: number; longitude: number; brightness: number }>>(
      `${base}/api/fires`,
      [],
    );
    if (Array.isArray(fires)) {
      const inThai = fires.filter(
        (f) => f.latitude >= 4 && f.latitude <= 23 && f.longitude >= 92 && f.longitude <= 108,
      );
      const myanmar = inThai.filter((f) => f.longitude <= 99.5 && f.latitude >= 12);
      const cambodia = inThai.filter((f) => f.longitude >= 101.5 && f.latitude >= 12);
      const malaysia = inThai.filter((f) => f.latitude <= 8);
      const brightnesses = inThai.map((f) => f.brightness).filter((b) => typeof b === "number");
      const maxB = brightnesses.length ? Math.max(...brightnesses) : null;
      const avgB = brightnesses.length
        ? brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length
        : null;
      const { error } = await supa.from("v8_fire_rollups").insert({
        captured_at: capturedAt,
        total_count: fires.length,
        in_thailand_bbox: inThai.length,
        myanmar_border: myanmar.length,
        cambodia_border: cambodia.length,
        malaysia_border: malaysia.length,
        max_brightness: maxB,
        avg_brightness: avgB,
        sample: inThai.slice(0, 20),
      });
      if (error) errors.push(`fires: ${error.message}`);
      else rowsWritten.fires = 1;
    }
  } catch (e) {
    errors.push(`fires: ${(e as Error).message}`);
  }

  // ── FX / MARKETS ───────────────────────────────────────────
  try {
    const markets = await fetchJson<{ data?: Array<Record<string, unknown>> }>(
      `${base}/api/markets`,
      { data: [] },
    );
    const data = Array.isArray(markets?.data) ? markets.data : [];
    if (data.length) {
      const rows = data.map((q) => ({
        captured_at: capturedAt,
        label: String(q.label ?? ""),
        value: (q.value as number) ?? null,
        change: (q.change as number) ?? null,
        up: (q.up as boolean) ?? null,
        category: (q.category as string) ?? null,
        source: (q.source as string) ?? null,
      })).filter((r) => r.label);
      const { error, count } = await supa
        .from("v8_fx_snapshots")
        .insert(rows, { count: "exact" });
      if (error) errors.push(`fx: ${error.message}`);
      else rowsWritten.fx = count ?? rows.length;
    }
  } catch (e) {
    errors.push(`fx: ${(e as Error).message}`);
  }

  // ── ASEAN CURRENCIES (24h deltas) ─────────────────────────
  try {
    const markets = await fetchJson<{ data?: Array<Record<string, unknown>> }>(
      `${base}/api/markets`,
      { data: [] },
    );
    const data = Array.isArray(markets?.data) ? markets.data : [];
    const currencyData = data
      .filter((m) => ASEAN_CURRENCIES.includes(String(m.label ?? "")))
      .map((m) => {
        const label = String(m.label ?? "");
        const rate = (m.value as number) ?? null;
        return {
          captured_at: capturedAt,
          currency_pair: `USD/${label}`,
          rate: rate,
          change_percent: (m.change as number) ?? null,
          source: (m.source as string) ?? "/api/markets",
          raw: m,
        };
      })
      .filter((r) => r.currency_pair && r.rate);

    if (currencyData.length) {
      const { error, count } = await supa
        .from("v8_asean_currencies_daily")
        .upsert(currencyData, { onConflict: "currency_pair,captured_at", count: "exact" });
      if (error) errors.push(`currencies_daily: ${error.message}`);
      else rowsWritten.currencies_daily = count ?? currencyData.length;
    }
  } catch (e) {
    errors.push(`currencies_daily: ${(e as Error).message}`);
  }

  // ── COMMODITY PRICES (daily snapshot) ───────────────────────
  try {
    const markets = await fetchJson<{ data?: Array<Record<string, unknown>> }>(
      `${base}/api/markets`,
      { data: [] },
    );
    const data = Array.isArray(markets?.data) ? markets.data : [];
    const commodityData = data
      .filter(
        (m) =>
          String(m.category ?? "").toLowerCase() === "commodities" ||
          String(m.label ?? "").includes("Oil") ||
          String(m.label ?? "").includes("Brent")
      )
      .map((m) => ({
        captured_at: capturedAt,
        commodity_name: String(m.label ?? ""),
        unit: (m.unit as string) ?? null,
        price: (m.value as number) ?? null,
        change_percent: (m.change as number) ?? null,
        source: (m.source as string) ?? "/api/markets",
        raw: m,
      }))
      .filter((r) => r.commodity_name && r.price);

    if (commodityData.length) {
      const { error, count } = await supa
        .from("v8_commodity_prices_daily")
        .insert(commodityData, { count: "exact" });
      if (error) errors.push(`commodities_daily: ${error.message}`);
      else rowsWritten.commodities_daily = count ?? commodityData.length;
    }
  } catch (e) {
    errors.push(`commodities_daily: ${(e as Error).message}`);
  }

  // ── REFUGEES ───────────────────────────────────────────────
  try {
    const refugees = await fetchJson<Array<Record<string, unknown>>>(
      `${base}/api/refugees`,
      [],
    );
    if (Array.isArray(refugees) && refugees.length) {
      const rows = refugees.map((r) => {
        const s = r.source as [number, number] | undefined;
        const t = r.target as [number, number] | undefined;
        return {
          captured_at: capturedAt,
          source_lng: s?.[0] ?? null,
          source_lat: s?.[1] ?? null,
          target_lng: t?.[0] ?? null,
          target_lat: t?.[1] ?? null,
          count: (r.count as number) ?? null,
          label: (r.label as string) ?? null,
        };
      });
      const { error, count } = await supa
        .from("v8_refugee_snapshots")
        .insert(rows, { count: "exact" });
      if (error) errors.push(`refugees: ${error.message}`);
      else rowsWritten.refugees = count ?? rows.length;
    }
  } catch (e) {
    errors.push(`refugees: ${(e as Error).message}`);
  }

  // ── POSTURE / BRIEF ────────────────────────────────────────
  try {
    const brief = await fetchJson<Record<string, unknown>>(
      `${base}/api/border-command/brief`,
      {},
    );
    if (brief && typeof brief === "object") {
      const { error: err1 } = await supa.from("v8_posture_snapshots").insert({
        captured_at: capturedAt,
        overall_posture: (brief.overallPosture as string) ?? null,
        overall_score: (brief.overallScore as number) ?? null,
        headline: (brief.headline as string) ?? null,
        summary: (brief.summary as string) ?? null,
        raw: brief,
      });
      if (err1) errors.push(`posture: ${err1.message}`);
      else rowsWritten.posture = 1;

      const areas = Array.isArray(brief.areas) ? (brief.areas as Array<Record<string, unknown>>) : [];
      if (areas.length) {
        const rows = areas.map((a) => ({
          captured_at: capturedAt,
          area_id: String(a.id ?? ""),
          label: (a.label as string) ?? null,
          posture: (a.posture as string) ?? null,
          score: (a.score as number) ?? null,
          incident_count: (a.incidentCount as number) ?? null,
          fatality_count: (a.fatalityCount as number) ?? null,
          verified_cameras: (a.verifiedCameras as number) ?? null,
          candidate_cameras: (a.candidateCameras as number) ?? null,
          summary: (a.summary as string) ?? null,
          raw: a,
        })).filter((r) => r.area_id);
        const { error: err2, count } = await supa
          .from("v8_area_snapshots")
          .insert(rows, { count: "exact" });
        if (err2) errors.push(`areas: ${err2.message}`);
        else rowsWritten.areas = count ?? rows.length;
      }
    }
  } catch (e) {
    errors.push(`posture: ${(e as Error).message}`);
  }

  // ── CAMERAS ────────────────────────────────────────────────
  try {
    const cameras = await fetchJson<{ cameras?: Array<Record<string, unknown>> }>(
      `${base}/api/critical-cameras`,
      { cameras: [] },
    );
    const items = Array.isArray(cameras?.cameras)
      ? cameras.cameras
      : Array.isArray(cameras)
        ? (cameras as unknown as Array<Record<string, unknown>>)
        : [];
    if (items.length) {
      const rows = items.map((c) => ({
        captured_at: capturedAt,
        camera_id: String(c.id ?? c.code ?? ""),
        label: (c.label as string) ?? (c.name as string) ?? null,
        location: (c.location as string) ?? null,
        status: (c.status as string) ?? null,
        verified: (c.verified as boolean) ?? null,
        image_url: (c.imageUrl as string) ?? (c.image as string) ?? null,
        raw: c,
      })).filter((r) => r.camera_id);
      if (rows.length) {
        const { error, count } = await supa
          .from("v8_camera_snapshots")
          .insert(rows, { count: "exact" });
        if (error) errors.push(`cameras: ${error.message}`);
        else rowsWritten.cameras = count ?? rows.length;
      }
    }
  } catch (e) {
    errors.push(`cameras: ${(e as Error).message}`);
  }

  const durationMs = Date.now() - startedAt;

  // ── INGEST RUN LOG ─────────────────────────────────────────
  try {
    await supa.from("v8_ingest_runs").insert({
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      success: errors.length === 0,
      rows_written: rowsWritten,
      errors: errors.length ? errors : null,
      trigger,
    });
  } catch {
    // Don't fail the endpoint if run-log write fails
  }

  return NextResponse.json({
    ok: errors.length === 0,
    capturedAt,
    trigger,
    durationMs,
    rowsWritten,
    errors,
  });
}
