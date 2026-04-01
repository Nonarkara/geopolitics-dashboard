/**
 * Print-Optimized Intelligence Briefing — Server Component
 *
 * Renders a clean, A4-ready intelligence briefing with all data
 * fetched server-side. No client-side JavaScript required.
 * Designed for printing to PDF via browser print dialog.
 */

import { querySignals, queryTrends, detectEscalation } from "../../lib/signal-archive";
import { query, isDatabaseConfigured } from "../../lib/db";
import { generateNarrative } from "../../lib/ai-narrative";
import { DASHBOARD_VERSION } from "../../lib/dashboard-version";

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

function formatBriefingDate() {
  const now = new Date();
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

function severityBadge(severity: string | undefined) {
  switch (severity) {
    case "critical":
      return "font-bold";
    case "alert":
      return "font-bold";
    default:
      return "";
  }
}

export default async function BriefingPage() {
  const { date, time } = formatBriefingDate();

  // Fetch all data in parallel
  const from24h = new Date(Date.now() - 86400000).toISOString();

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
    querySignals({ from: from24h, limit: 10 }),
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

  const escalations = [myanmarEsc, cambodiaEsc, malaysiaEsc].filter(Boolean);

  function postureLabel(esc: typeof myanmarEsc) {
    if (!esc) return "NO DATA";
    if (esc.escalated) return "ELEVATED";
    return "NORMAL";
  }

  function postureClass(esc: typeof myanmarEsc) {
    if (!esc) return "";
    if (esc.escalated) return "font-bold";
    return "";
  }

  return (
    <main className="briefing-page max-w-[800px] mx-auto p-8 bg-white text-black print:p-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .briefing-page { max-width: none; padding: 20mm 15mm; }
          .no-print { display: none !important; }
          section { page-break-inside: avoid; }
          table { page-break-inside: avoid; }
          h2 { page-break-after: avoid; }
          @page { size: A4; margin: 0; }
        }
        .briefing-page {
          font-family: Georgia, 'Times New Roman', serif;
          color: #111;
          line-height: 1.6;
        }
        .briefing-page h1 {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin: 0;
        }
        .briefing-page h2 {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 1px solid #333;
          padding-bottom: 4px;
          margin-top: 28px;
          margin-bottom: 12px;
        }
        .briefing-page p, .briefing-page td, .briefing-page th {
          font-size: 11px;
        }
        .briefing-page table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 10px;
        }
        .briefing-page th {
          background: #f5f5f5;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 9px;
          text-align: left;
          padding: 6px 8px;
          border: 1px solid #ddd;
        }
        .briefing-page td {
          padding: 5px 8px;
          border: 1px solid #ddd;
          font-size: 10px;
        }
        .briefing-page tr:nth-child(even) td {
          background: #fafafa;
        }
        .briefing-page .classification {
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #666;
        }
        .briefing-page footer {
          margin-top: 32px;
          padding-top: 12px;
          border-top: 2px solid #111;
          font-size: 9px;
          color: #666;
        }
        .briefing-page .elevated { color: #b91c1c; font-weight: 700; }
        .briefing-page .normal { color: #166534; }
        .briefing-page .no-data { color: #9ca3af; }
      `,
        }}
      />

      {/* PRINT BUTTON */}
      <div className="no-print mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Preview mode -- use your browser print dialog for PDF output
        </div>
        <button
          onClick={undefined}
          className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          // onClick handled via inline script below since this is a server component
        >
          Print Briefing
        </button>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.querySelector('.no-print button')?.addEventListener('click', function() { window.print(); });`,
        }}
      />

      {/* HEADER */}
      <header className="border-b-2 border-black pb-4 mb-6">
        <h1>Thailand Geopolitical Watch</h1>
        <p className="mt-1" style={{ fontSize: "12px", margin: "4px 0 0" }}>
          Situation Briefing &mdash; {date} {time} ICT
        </p>
        <p className="classification" style={{ marginTop: "8px" }}>
          Classification: UNCLASSIFIED // FOR OFFICIAL USE ONLY
        </p>
      </header>

      {/* 1. COMMAND POSTURE */}
      <section>
        <h2>1. Command Posture</h2>
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
                <td style={{ fontWeight: 600 }}>{label}</td>
                <td>{esc ? `${esc.todaySeverityAvg?.toFixed(1) ?? "--"}/4.0` : "--"}</td>
                <td className={esc?.escalated ? "elevated" : esc ? "normal" : "no-data"}>
                  {postureLabel(esc)}
                </td>
                <td>{esc?.todayCount ?? "--"}</td>
                <td>{esc?.baselineAvg?.toFixed(1) ?? "--"}</td>
                <td className={postureClass(esc)}>
                  {esc ? `${esc.ratio.toFixed(1)}x` : "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 2. AI NARRATIVE */}
      <section>
        <h2>2. Situation Summary</h2>
        <p style={{ lineHeight: 1.8 }}>{narrativeResult.narrative}</p>
        <p
          className="classification"
          style={{ marginTop: "6px", fontSize: "8px" }}
        >
          Generated {new Date(narrativeResult.generatedAt).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })} ICT
          {narrativeResult.signalCount > 0
            ? ` // ${narrativeResult.signalCount} signals analyzed`
            : ""}
        </p>
      </section>

      {/* 3. KEY SIGNALS */}
      <section>
        <h2>3. Key Signals (Last 24h)</h2>
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
                  <td className={severityBadge(s.severity)}>{s.title}</td>
                  <td>{s.severity ?? "--"}</td>
                  <td>{s.source_provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            No signals available. Database may not be configured.
          </p>
        )}
        {signalsResult.total > 10 && (
          <p className="classification" style={{ marginTop: "4px", fontSize: "8px" }}>
            Showing 10 of {signalsResult.total} total signals
          </p>
        )}
      </section>

      {/* 4. ECONOMIC INDICATORS */}
      <section>
        <h2>4. Economic Indicators</h2>
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
          <p style={{ color: "#999", fontStyle: "italic" }}>
            Economic data unavailable. Database may not be configured.
          </p>
        )}
      </section>

      {/* 5. SOURCE FRESHNESS */}
      <section>
        <h2>5. Source Freshness</h2>
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
                    }}
                  >
                    {f.status.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            Freshness data unavailable. Database may not be configured.
          </p>
        )}
      </section>

      {/* FOOTER */}
      <footer>
        <p style={{ fontWeight: 700 }}>
          Generated by Thailand Geopolitical Watch V{DASHBOARD_VERSION}
        </p>
        <p style={{ marginTop: "4px" }}>
          All data provenance-linked. Sources: ACLED, GDELT, FIRMS, UNHCR,
          Open-Meteo, USGS, NABC, IMF
        </p>
        <p className="classification" style={{ marginTop: "8px" }}>
          END OF BRIEFING // UNCLASSIFIED
        </p>
      </footer>
    </main>
  );
}
