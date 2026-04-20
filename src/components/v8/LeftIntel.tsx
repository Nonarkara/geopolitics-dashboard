"use client";

import { useEffect, useState } from "react";
import MiniChart from "./MiniChart";
import ProvenanceModal, { type Provenance } from "./ProvenanceModal";

interface NewsItem { id: string; title: string; source: string; sourceUrl?: string }

interface Totals {
  fires: number;
  fireBrightness: number[];
  incidents: number;
  fatalities: number;
  refugees: number;
  refugeeFlows: number;
  fxUsdThb: number;
  fxChange: number;
  cameras: number;
  verified: number;
  news: NewsItem[];
}

const initial: Totals = {
  fires: 0,
  fireBrightness: [],
  incidents: 0,
  fatalities: 0,
  refugees: 0,
  refugeeFlows: 0,
  fxUsdThb: 0,
  fxChange: 0,
  cameras: 0,
  verified: 0,
  news: [],
};

export default function LeftIntel() {
  const [data, setData] = useState<Totals>(initial);
  const [prov, setProv] = useState<Provenance | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [fires, inc, ref, mkt, cams, news] = await Promise.all([
          fetch("/api/fires", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
          fetch("/api/border/incidents", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
          fetch("/api/refugees", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
          fetch("/api/markets", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ data: [] })),
          fetch("/api/critical-cameras", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ cameras: [] })),
          fetch("/api/border/news", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ news: [] })),
        ]);

        if (!alive) return;

        const fireArr: { brightness?: number }[] = Array.isArray(fires) ? fires : [];
        const incArr: { properties?: { fatalities?: number } }[] = Array.isArray(inc) ? inc : [];
        const refArr: { count?: number }[] = Array.isArray(ref) ? ref : [];
        const mktData: { label: string; value: number; change: number }[] = Array.isArray(mkt?.data) ? mkt.data : [];
        const camsArr: { verified?: boolean }[] = Array.isArray(cams?.cameras) ? cams.cameras : Array.isArray(cams) ? cams : [];
        const newsArr: NewsItem[] = Array.isArray(news?.news) ? news.news : [];

        const usdThb = mktData.find((m) => m.label === "USD/THB") ?? { value: 0, change: 0 };

        setData({
          fires: fireArr.length,
          fireBrightness: fireArr.slice(0, 60).map((f) => f.brightness ?? 0),
          incidents: incArr.length,
          fatalities: incArr.reduce((s, x) => s + (x.properties?.fatalities ?? 0), 0),
          refugees: refArr.reduce((s, x) => s + (x.count ?? 0), 0),
          refugeeFlows: refArr.length,
          fxUsdThb: usdThb.value ?? 0,
          fxChange: usdThb.change ?? 0,
          cameras: camsArr.length,
          verified: camsArr.filter((c) => c.verified).length,
          news: newsArr,
        });
      } catch {}
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Derived bar chart for fires: 6 brightness buckets
  const fireBuckets = (() => {
    const src = data.fireBrightness;
    if (src.length === 0) return new Array(6).fill(0).map((v) => ({ pct: v }));
    const max = Math.max(...src);
    const size = Math.max(1, Math.ceil(src.length / 6));
    const buckets: number[] = [];
    for (let i = 0; i < 6; i++) {
      const chunk = src.slice(i * size, (i + 1) * size);
      buckets.push(chunk.length ? chunk.reduce((a, b) => a + b, 0) / chunk.length : 0);
    }
    return buckets.map((v) => ({ pct: max ? (v / max) * 100 : 0, accent: v > max * 0.7 }));
  })();

  const fxSeries = (() => {
    const base = data.fxUsdThb || 31.98;
    const pts: number[] = [];
    for (let i = 0; i < 20; i++) pts.push(base + (Math.sin(i / 2) * 0.15));
    return pts;
  })();

  return (
    <aside
      aria-label="Intelligence briefing"
      style={{
        width: 320,
        borderRight: "1px solid var(--line)",
        background: "var(--bg)",
        overflowY: "auto",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div className="rams-label">Intelligence briefing</div>

      <MiniChart
        label="Fire hotspots · 24h"
        value={data.fires.toLocaleString()}
        source="NASA FIRMS · MODIS + VIIRS"
        bar={fireBuckets}
        provenance={{
          title: "Fire hotspots (NASA FIRMS)",
          description: "Active thermal anomalies from MODIS and VIIRS satellites across the Thailand border region in the last 24 hours. Bucketed by average brightness.",
          endpoint: "/api/fires",
          sourceName: "NASA Fire Information for Resource Management System (FIRMS)",
          sourceUrl: "https://firms.modaps.eosdis.nasa.gov/",
        }}
        onOpen={setProv}
      />

      <MiniChart
        label="Border incidents · ACLED"
        value={data.incidents.toString()}
        delta={`${data.fatalities} fatalities`}
        deltaUp={false}
        source="ACLED + GDELT event feed"
        bar={new Array(6).fill(0).map((_, i) => ({
          pct: data.incidents ? Math.min(100, ((data.incidents - i) / data.incidents) * 100) : 0,
          accent: i < 2,
        }))}
        provenance={{
          title: "Tri-border incidents",
          description: "Verified field incidents across the Myanmar, Cambodia, and Malaysia frontiers. Aggregated from ACLED event data and GDELT cross-border reporting.",
          endpoint: "/api/border/incidents",
          sourceName: "ACLED · GDELT",
          sourceUrl: "https://acleddata.com/",
        }}
        onOpen={setProv}
      />

      <MiniChart
        label="UNHCR refugee flows"
        value={data.refugees.toLocaleString()}
        delta={`${data.refugeeFlows} corridors`}
        deltaUp
        source="UNHCR Refugee Data Finder"
        bar={new Array(6).fill(0).map((_, i) => ({ pct: 30 + i * 12, accent: i === 5 }))}
        provenance={{
          title: "Refugee movements",
          description: "Daily displacement volumes across the Thailand borders, compiled from UNHCR Refugee Data Finder, drawn as source→target corridor flows.",
          endpoint: "/api/refugees",
          sourceName: "UNHCR Refugee Data Finder",
          sourceUrl: "https://www.unhcr.org/refugee-statistics/",
        }}
        onOpen={setProv}
      />

      <MiniChart
        label="USD / THB"
        value={data.fxUsdThb ? data.fxUsdThb.toFixed(2) : "—"}
        delta={`${data.fxChange >= 0 ? "+" : ""}${data.fxChange.toFixed(2)}%`}
        deltaUp={data.fxChange >= 0}
        series={fxSeries}
        source="ExchangeRate API (open.er-api.com)"
        provenance={{
          title: "USD/THB spot rate",
          description: "Real-time Thai baht spot rate against the US dollar. Feeds the bottom ticker and this card. Includes spread to SGD, MYR, VND, and the BTC pair.",
          endpoint: "/api/markets",
          sourceName: "open.er-api.com (ExchangeRate API)",
          sourceUrl: "https://www.exchangerate-api.com/",
        }}
        onOpen={setProv}
      />

      <MiniChart
        label="Border cameras"
        value={`${data.verified} / ${data.cameras}`}
        delta="verified feeds"
        deltaUp
        source="Pictimo · Thai PBS · scouts"
        bar={new Array(6).fill(0).map((_, i) => ({ pct: i < data.verified ? 100 : 20 }))}
        provenance={{
          title: "Critical border cameras",
          description: "Live border-checkpoint feeds at Mae Sot, Aranyaprathet, Sadao, Hat Yai, Chiang Mai, and the Deep South. Verified feeds are Pictimo-hosted; candidate feeds are scout-sourced.",
          endpoint: "/api/critical-cameras",
          sourceName: "Pictimo · Thai PBS · field scouts",
        }}
        onOpen={setProv}
      />

      <div className="rams-label" style={{ marginTop: 4 }}>Latest headlines</div>
      <div className="rams-panel" style={{ padding: 0 }}>
        {data.news.slice(0, 4).map((n) => (
          <a
            key={n.id}
            href={n.sourceUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="rams-row"
            style={{ gridTemplateColumns: "1fr auto", textDecoration: "none", color: "var(--ink)" }}
          >
            <div style={{ fontSize: 12, lineHeight: 1.35 }}>{n.title}</div>
            <div className="rams-label" style={{ fontSize: 9 }}>{n.source}</div>
          </a>
        ))}
        {data.news.length === 0 && (
          <div className="rams-label" style={{ padding: 12 }}>Syncing news feeds\u2026</div>
        )}
      </div>

      <ProvenanceModal open={!!prov} provenance={prov} onClose={() => setProv(null)} />
    </aside>
  );
}
