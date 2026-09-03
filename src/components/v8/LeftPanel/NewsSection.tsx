"use client";

import { useEffect, useMemo, useState } from "react";
import { classifyBorder, BORDER_COLORS, type BorderId } from "../../../lib/news-classifier";

interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  source: string;
  sourceUrl?: string;
  tag?: string;
  publishedAt?: string;
}

interface ClassifiedNews extends NewsItem {
  border: BorderId;
}

export default function NewsSection({
  expanded,
  onToggle,
  onFocusBorder,
}: {
  expanded: boolean;
  onToggle: () => void;
  onFocusBorder?: (id: "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier") => void;
}) {
  const [news, setNews] = useState<ClassifiedNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/border/news", { cache: "no-store" });
        const j = await r.json();
        const items: NewsItem[] = Array.isArray(j?.news) ? j.news : [];
        if (alive) {
          setNews(items.map((n) => ({ ...n, border: classifyBorder(n) })));
        }
      } catch {}
      setLoading(false);
    };
    load();
    const id = setInterval(load, 120_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Distribution counts per border
  const distribution = useMemo(() => {
    const d: Record<BorderId, number> = {
      "myanmar-frontier": 0,
      "cambodia-frontier": 0,
      "malaysia-frontier": 0,
      "unknown": 0,
    };
    news.forEach((n) => d[n.border]++);
    return d;
  }, [news]);

  const totalClassified =
    distribution["myanmar-frontier"] +
    distribution["cambodia-frontier"] +
    distribution["malaysia-frontier"];
  const maxCount = Math.max(
    distribution["myanmar-frontier"],
    distribution["cambodia-frontier"],
    distribution["malaysia-frontier"],
    1,
  );

  const handleClick = (n: ClassifiedNews, e: React.MouseEvent) => {
    // Only focus if it's a known border
    if (n.border !== "unknown" && onFocusBorder) {
      onFocusBorder(n.border as "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier");
    }
    // sourceUrl opens in new tab via the anchor href (default behavior)
    if (!n.sourceUrl) {
      e.preventDefault();
    }
  };

  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "12px",
          background: "transparent",
          border: "none",
          borderBottom: expanded ? "1px solid var(--line)" : "none",
          color: "var(--ink)",
          cursor: "pointer",
          transition: "background 0.12s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="rams-label">NEWS · {news.length}</div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-muted)" }}>
          {expanded ? "-" : "+"}
        </div>
      </button>

      {expanded && (
        <div>
          {/* Border distribution mini-chart */}
          {totalClassified > 0 && (
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
              <div className="rams-label" style={{ fontSize: 9, marginBottom: 8, color: "var(--ink-muted)" }}>
                BY BORDER
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(["myanmar-frontier", "cambodia-frontier", "malaysia-frontier"] as BorderId[]).map((b) => {
                  const count = distribution[b];
                  const pct = (count / maxCount) * 100;
                  const color = BORDER_COLORS[b];
                  return (
                    <button
                      key={b}
                      onClick={() =>
                        onFocusBorder?.(b as "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier")
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: onFocusBorder ? "pointer" : "default",
                        color: "var(--ink)",
                        textAlign: "left",
                      }}
                      title={`Focus ${color.label} border on map`}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: color.accent,
                          width: 20,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {color.label}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          background: "var(--line-faint)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: color.accent,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <div
                        className="rams-value"
                        style={{ fontSize: 11, minWidth: 22, textAlign: "right" }}
                      >
                        {count}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* News list */}
          {loading ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>Loading...</div>
          ) : news.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>No news items</div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {news.slice(0, 20).map((n) => {
                const color = BORDER_COLORS[n.border];
                return (
                  <a
                    key={n.id}
                    href={n.sourceUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => handleClick(n, e)}
                    style={{
                      display: "block",
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--line)",
                      borderLeft: `3px solid ${color.accent}`,
                      textDecoration: "none",
                      color: "var(--ink)",
                      fontSize: 12,
                      lineHeight: 1.4,
                      transition: "background 0.08s ease",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = color.bg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: color.accent,
                          letterSpacing: "0.08em",
                          padding: "1px 4px",
                          border: `1px solid ${color.accent}`,
                          borderRadius: 2,
                        }}
                      >
                        {color.label}
                      </span>
                      {n.tag && (
                        <span
                          className="rams-label"
                          style={{ fontSize: 8, color: "var(--ink-muted)" }}
                        >
                          {n.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{n.title}</div>
                    <div
                      className="rams-label"
                      style={{ fontSize: 9, color: "var(--ink-muted)" }}
                    >
                      {n.source}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
