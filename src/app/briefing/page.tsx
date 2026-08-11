/**
 * Print-Optimized Intelligence Briefing — Server Component
 *
 * Renders a clean, A4-ready intelligence briefing with all data
 * fetched server-side. No client-side JavaScript required.
 * Designed for printing to PDF via browser print dialog.
 */

import { querySignals, detectEscalation } from "../../lib/signal-archive";
import { query, isDatabaseConfigured } from "../../lib/db";
import { generateNarrative } from "../../lib/ai-narrative";

interface MarketRow {
  label: string;
  value: number;
  unit: string | null;
  category: string | null;
  source: string | null;
  previous_value: number | null;
}

interface FreshnessRow {
  table_name: string;
  row_count: number;
  latest_entry: string;
  staleness_hours: number;
  status: string;
}

function formatBriefingDate(now: Date) {
  return {
    date: now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    time: now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    }),
  };
}

function severityBorderColor(severity: string | undefined) {
  switch (severity) {
    case "critical":
    case "alert":
      return "#b91c1c";
    case "elevated":
      return "#b91c1c";
    case "watch":
      return "#d97706";
    case "stable":
    case "normal":
      return "#166534";
    default:
      return "transparent";
  }
}

export default async function BriefingPage() {
  const renderedAt = new Date();
  const { date, time } = formatBriefingDate(renderedAt);

  // Fetch all data in parallel
  const from24h = new Date(renderedAt.getTime() - 86400000).toISOString();

  const [
    narrativeResult,
    signalsResult,
    myanmarEsc,
    cambodiaEsc,
    malaysiaEsc,
    marketData,
    freshnessData,
  ] = await Promise.all([
    generateNarrative().catch(() => ({
      narrative: "Narrative generation unavailable. Refer to signal data below.",
      generatedAt: new Date().toISOString(),
      signalCount: 0,
    })),
    querySignals({ from: from24h, limit: 10 }).catch(() => ({
      signals: [],
      total: 0,
    })),
    detectEscalation("myanmar-frontier"),
    detectEscalation("cambodia-frontier"),
    detectEscalation("malaysia-frontier"),
    isDatabaseConfigured
      ? query<MarketRow>(`
          WITH ranked AS (
            SELECT indicator as label, value, unit, category, source,
              LAG(value) OVER (PARTITION BY indicator ORDER BY ref_date, created_at) as previous_value,
              ROW_NUMBER() OVER (PARTITION BY indicator ORDER BY ref_date DESC, created_at DESC) as rn
            FROM market_data
          )
          SELECT label, value, unit, category, source, previous_value
          FROM ranked WHERE rn = 1
          ORDER BY category NULLS LAST, label LIMIT 10
        `).catch(() => ({ rows: [] as MarketRow[] }))
      : Promise.resolve({ rows: [] as MarketRow[] }),
    isDatabaseConfigured
      ? query<FreshnessRow>(`SELECT * FROM fn_data_freshness()`).catch(() => ({
          rows: [] as FreshnessRow[],
        }))
      : Promise.resolve({ rows: [] as FreshnessRow[] }),
  ]);

  function postureLabel(esc: typeof myanmarEsc) {
    if (!esc) return "NO DATA";
    if (esc.escalated) return "ELEVATED";
    return "NORMAL";
  }

  function postureSeverity(esc: typeof myanmarEsc): string | undefined {
    if (!esc) return undefined;
    if (esc.escalated) return "elevated";
    return "normal";
  }

  // Compute footer stats
  const signalCount = signalsResult.total ?? 0;
  const sourceCount = freshnessData.rows.length;
  const viewRefreshTime = renderedAt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });

  return (
    <main className="briefing-page max-w-[800px] mx-auto bg-white text-black print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: A4 portrait; margin: 15mm 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
          header { background: #0a0a0a !important; color: white !important; }
          th { background: #1a1a1a !important; color: white !important; }
          .briefing-page { max-width: none; }
          .no-print { display: none !important; }
          .print-hidden { display: none !important; }
          section { page-break-inside: avoid; }
          table { page-break-inside: avoid; }
          h2 { page-break-after: avoid; }
        }
        .briefing-page {
          font-family: "Source Sans 3", "Helvetica Neue", sans-serif;
          color: #111;
          line-height: 1.6;
        }
        .briefing-page table {
          width: 100%;
          border-collapse: collapse;
          font-family: "JetBrains Mono", "SF Mono", "Consolas", monospace;
          font-size: 10px;
        }
        .briefing-page th {
          background: #1a1a1a;
          color: white;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 9px;
          font-family: "JetBrains Mono", "SF Mono", "Consolas", monospace;
          text-align: left;
          padding: 6px 12px;
          border: 1px solid #333;
        }
        .briefing-page td {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          font-size: 10px;
        }
        .briefing-page tr:nth-child(odd) td {
          background: #f9fafb;
        }
        .briefing-page tr:nth-child(even) td {
          background: #ffffff;
        }
        .briefing-page .elevated { color: #b91c1c; font-weight: 700; }
        .briefing-page .normal { color: #166534; }
        .briefing-page .no-data { color: #9ca3af; }
      `,
        }}
      />

      {/* PRINT BUTTON */}
      <button className="fixed top-4 right-4 bg-black text-white px-4 py-2 text-[13px] font-mono uppercase tracking-wider hover:bg-gray-800 print:hidden shadow-lg z-50">
        Print / Save PDF
      </button>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.querySelector('button.fixed')?.addEventListener('click', function() { window.print(); });`,
        }}
      />

      {/* HEADER */}
      <header className="bg-[#0a0a0a] text-white px-8 py-6 border-b-4 border-[#f59e0b]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-mono uppercase tracking-[0.3em] text-white/50 mb-1">
              Thailand Geopolitical Watch
            </div>
            <h1 className="text-[30px] font-black uppercase tracking-tight">
              Situation Briefing
            </h1>
          </div>
          <div className="text-right">
            <div className="text-[15px] font-mono tabular-nums text-white/80">
              {date} {time} ICT
            </div>
            <div className="text-[13px] font-mono uppercase tracking-[0.2em] text-white/40 mt-1">
              V6.3.0 // Auto-generated
            </div>
          </div>
        </div>
        <div className="mt-3 text-[13px] font-mono uppercase tracking-[0.25em] text-[#f59e0b]">
          Unclassified // For Official Use Only
        </div>
      </header>

      <div className="px-8 py-6">
        {/* 1. COMMAND POSTURE */}
        <section>
          <h2 className="text-[15px] font-black uppercase tracking-[0.1em] mb-3 pb-2 border-b-2 border-black flex items-center gap-2">
            <span className="text-[13px] font-mono text-gray-400">01</span>
            Command Posture
          </h2>
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Score</th>
                <th>Posture</th>
                <th>Signals (24h)</th>
                <th>Baseline (7d avg)</th>
                <th>Ratio</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  { label: "Myanmar Frontier", esc: myanmarEsc },
                  { label: "Cambodia Frontier", esc: cambodiaEsc },
                  { label: "Malaysia Frontier", esc: malaysiaEsc },
                ] as const
              ).map(({ label, esc }) => (
                <tr key={label}>
                  <td
                    style={{
                      fontWeight: 600,
                      borderLeft: `3px solid ${severityBorderColor(postureSeverity(esc))}`,
                    }}
                  >
                    {label}
                  </td>
                  <td>{esc ? `${esc.todaySeverityAvg?.toFixed(1) ?? "--"}/4.0` : "--"}</td>
                  <td className={esc?.escalated ? "elevated" : esc ? "normal" : "no-data"}>
                    {postureLabel(esc)}
                  </td>
                  <td>{esc?.todayCount ?? "--"}</td>
                  <td>{esc?.baselineAvg?.toFixed(1) ?? "--"}</td>
                  <td style={{ fontWeight: esc?.escalated ? 700 : 400 }}>
                    {esc ? `${esc.ratio.toFixed(1)}x` : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 2. AI NARRATIVE */}
        <section className="mt-8">
          <h2 className="text-[15px] font-black uppercase tracking-[0.1em] mb-3 pb-2 border-b-2 border-black flex items-center gap-2">
            <span className="text-[13px] font-mono text-gray-400">02</span>
            Situation Summary
          </h2>
          <p className="text-[14px] leading-[1.8]">{narrativeResult.narrative}</p>
          <p className="mt-1.5 text-[12px] font-mono uppercase tracking-[0.12em] text-gray-400">
            Generated {new Date(narrativeResult.generatedAt).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })} ICT
            {narrativeResult.signalCount > 0
              ? ` // ${narrativeResult.signalCount} signals analyzed`
              : ""}
          </p>
        </section>

        {/* 3. KEY SIGNALS */}
        <section className="mt-8">
          <h2 className="text-[15px] font-black uppercase tracking-[0.1em] mb-3 pb-2 border-b-2 border-black flex items-center gap-2">
            <span className="text-[13px] font-mono text-gray-400">03</span>
            Key Signals (Last 24h)
          </h2>
          {signalsResult.signals.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Region</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {signalsResult.signals.slice(0, 10).map((s, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(s.published_at).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Bangkok",
                      })}
                    </td>
                    <td>{s.region ?? "--"}</td>
                    <td>{s.signal_type}</td>
                    <td
                      style={{
                        fontWeight: s.severity === "critical" || s.severity === "alert" ? 700 : 400,
                        borderLeft: `3px solid ${severityBorderColor(s.severity)}`,
                      }}
                    >
                      {s.title}
                    </td>
                    <td>{s.severity ?? "--"}</td>
                    <td>{s.source_provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[13px] text-gray-400 italic">
              No signals available. Database may not be configured.
            </p>
          )}
          {signalsResult.total > 10 && (
            <p className="mt-1 text-[12px] font-mono uppercase tracking-[0.12em] text-gray-400">
              Showing 10 of {signalsResult.total} total signals
            </p>
          )}
        </section>

        {/* 4. ECONOMIC INDICATORS */}
        <section className="mt-8">
          <h2 className="text-[15px] font-black uppercase tracking-[0.1em] mb-3 pb-2 border-b-2 border-black flex items-center gap-2">
            <span className="text-[13px] font-mono text-gray-400">04</span>
            Economic Indicators
          </h2>
          {marketData.rows.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Indicator</th>
                  <th>Value</th>
                  <th>Change</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {marketData.rows.map((m, i) => {
                  const change =
                    m.previous_value !== null
                      ? (m.value - m.previous_value).toFixed(2)
                      : null;
                  const changeSign =
                    change && parseFloat(change) > 0
                      ? "+"
                      : "";
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{m.label}</td>
                      <td>
                        {m.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        {m.unit ? ` ${m.unit}` : ""}
                      </td>
                      <td
                        style={{
                          color:
                            change && parseFloat(change) > 0
                              ? "#b91c1c"
                              : change && parseFloat(change) < 0
                                ? "#166534"
                                : "#666",
                        }}
                      >
                        {change ? `${changeSign}${change}` : "--"}
                      </td>
                      <td>{m.source ?? "--"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-[13px] text-gray-400 italic">
              Economic data unavailable. Database may not be configured.
            </p>
          )}
        </section>

        {/* 5. SOURCE FRESHNESS */}
        <section className="mt-8">
          <h2 className="text-[15px] font-black uppercase tracking-[0.1em] mb-3 pb-2 border-b-2 border-black flex items-center gap-2">
            <span className="text-[13px] font-mono text-gray-400">05</span>
            Source Freshness
          </h2>
          {freshnessData.rows.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Records</th>
                  <th>Last Update</th>
                  <th>Staleness</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {freshnessData.rows.map((f, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{f.table_name}</td>
                    <td>{f.row_count.toLocaleString()}</td>
                    <td>
                      {f.latest_entry
                        ? new Date(f.latest_entry).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Bangkok",
                          })
                        : "--"}
                    </td>
                    <td>{f.staleness_hours.toFixed(1)}h</td>
                    <td
                      style={{
                        color:
                          f.status === "fresh"
                            ? "#166534"
                            : f.status === "stale"
                              ? "#b91c1c"
                              : "#92400e",
                        fontWeight: 600,
                        borderLeft: `3px solid ${
                          f.status === "fresh"
                            ? "#166534"
                            : f.status === "stale"
                              ? "#b91c1c"
                              : "#d97706"
                        }`,
                      }}
                    >
                      {f.status.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[13px] text-gray-400 italic">
              Freshness data unavailable. Database may not be configured.
            </p>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-12 pt-6 border-t-2 border-black">
          <div className="text-[13px] font-mono uppercase tracking-[0.2em] text-gray-500 mb-2">
            Distribution
          </div>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            This briefing is generated automatically by the Thailand Geopolitical Watch V6.3.0 intelligence platform.
            All data points are provenance-linked to their original sources. Signal archive contains {signalCount} records
            across {sourceCount} providers. Materialized views refreshed at {viewRefreshTime}.
          </p>
          <div className="mt-4 text-center text-[12px] font-mono uppercase tracking-[0.3em] text-gray-400">
            — End of Briefing —
          </div>
        </footer>
      </div>
    </main>
  );
}
