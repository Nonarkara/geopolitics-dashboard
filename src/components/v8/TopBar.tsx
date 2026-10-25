"use client";

import { useEffect, useState } from "react";
import SeAsiaClocks from "./SeAsiaClocks";
import SponsorStrip from "./SponsorStrip";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  tag?: string;
}

export default function TopBar() {
  const [headline, setHeadline] = useState<NewsItem | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/border/news", { cache: "no-store" });
        const j = await r.json();
        const items: NewsItem[] = Array.isArray(j?.news) ? j.news : [];
        if (alive && items.length) setHeadline(items[0]);
      } catch {}
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // White header palette — logos' white backgrounds blend seamlessly
  const HEADER_BG = "#ffffff";
  const INK = "#0a0a0a";
  const INK_MUTED = "#525252";
  const LINE = "#e5e5e5";
  const ACCENT = "#0891b2";

  return (
    <header
      style={{
        height: 96,
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        background: HEADER_BG,
        borderBottom: `1px solid ${LINE}`,
        alignItems: "stretch",
      }}
    >
      {/* Left — identity */}
      <div
        style={{
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          borderRight: `1px solid ${LINE}`,
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              background: ACCENT,
              borderRadius: 0,
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: INK,
            }}
          >
            Thailand Geopolitical Watch
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: INK_MUTED,
            }}
          >
            V8
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: INK_MUTED,
          }}
        >
          Myanmar &nbsp;·&nbsp; Cambodia &nbsp;·&nbsp; Malaysia
        </div>
        <SponsorStrip />
      </div>

      {/* Center — priority headline */}
      <div
        style={{
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          borderRight: `1px solid ${LINE}`,
          minWidth: 0,
          background: HEADER_BG,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: ACCENT,
              padding: "2px 6px",
              border: `1px solid ${ACCENT}`,
            }}
          >
            Priority
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: INK_MUTED,
            }}
          >
            Lead narrative
          </span>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: INK,
            lineHeight: 1.2,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {headline?.title ?? "Synchronizing incoming intelligence stream..."}
        </div>
        {headline?.source && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: INK_MUTED,
            }}
          >
            Source: {headline.source}
          </div>
        )}
      </div>

      {/* Right — SE Asia clocks */}
      <div style={{ background: HEADER_BG }}>
        <SeAsiaClocks />
      </div>
    </header>
  );
}
