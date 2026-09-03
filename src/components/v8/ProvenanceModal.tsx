"use client";

import { useEffect, useState } from "react";

export interface Provenance {
  title: string;
  description: string;
  endpoint: string;
  sourceName: string;
  sourceUrl?: string;
}

export default function ProvenanceModal({
  open,
  provenance,
  onClose,
}: {
  open: boolean;
  provenance: Provenance | null;
  onClose: () => void;
}) {
  const [sample, setSample] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string>("");

  useEffect(() => {
    if (!open || !provenance) {
      setSample("");
      return;
    }
    let alive = true;
    setLoading(true);
    const load = async () => {
      try {
        const r = await fetch(provenance.endpoint, { cache: "no-store" });
        const text = await r.text();
        let pretty = text;
        try {
          const obj = JSON.parse(text);
          pretty = JSON.stringify(
            Array.isArray(obj) ? obj.slice(0, 3) : obj,
            null,
            2,
          );
        } catch {}
        if (alive) {
          setSample(pretty.slice(0, 4000));
          setFetchedAt(new Date().toISOString());
        }
      } catch (err) {
        if (alive) setSample(`Fetch failed: ${err}`);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [open, provenance]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !provenance) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(760px, 100%)",
          maxHeight: "82vh",
          background: "var(--bg-panel)",
          border: "1px solid var(--line-bright)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="rams-panel-head"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div className="rams-label">Provenance · {provenance.title}</div>
          <button className="rams-btn" onClick={onClose} aria-label="Close">Close · Esc</button>
        </div>

        <div style={{ padding: 16, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <section>
            <div className="rams-label" style={{ marginBottom: 6 }}>Description</div>
            <div style={{ color: "var(--ink-dim)", fontSize: 13, lineHeight: 1.5 }}>
              {provenance.description}
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px" }}>
            <div className="rams-label">API endpoint</div>
            <div className="rams-value" style={{ fontSize: 12 }}>
              <a href={provenance.endpoint} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                {provenance.endpoint}
              </a>
            </div>
            <div className="rams-label">Source</div>
            <div className="rams-value" style={{ fontSize: 12 }}>
              {provenance.sourceUrl ? (
                <a href={provenance.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                  {provenance.sourceName}
                </a>
              ) : (
                provenance.sourceName
              )}
            </div>
            <div className="rams-label">Last fetched</div>
            <div className="rams-value" style={{ fontSize: 12 }}>
              {fetchedAt || (loading ? "loading\u2026" : "--")}
            </div>
          </section>

          <section>
            <div className="rams-label" style={{ marginBottom: 6 }}>Response sample (truncated)</div>
            <pre
              style={{
                background: "var(--bg)",
                border: "1px solid var(--line)",
                padding: 12,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                lineHeight: 1.5,
                color: "var(--ink-dim)",
                overflow: "auto",
                maxHeight: 360,
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {loading ? "Loading\u2026" : sample || "No response data"}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
