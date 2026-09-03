"use client";

import { useMemo, useState } from "react";

// Sources: World Bank (2024), UN (2024), CIA Factbook (2024), ITU (2024), UNDP HDR (2024)
interface CountryStats {
  code: string;
  name: string;
  gdpPerCapita: number;     // USD, 2024
  gdpTotal: number;          // USD billions, 2024
  population: number;        // persons, 2024
  area: number;              // km²
  gdpGrowth: number;         // % YoY, 2024 est
  urbanPct: number;          // % population urban
  lifeExpectancy: number;    // years
  internetPct: number;       // % internet users
  hdi: number;               // Human Development Index (0-1), 2024
}

const ASEAN_COUNTRIES: CountryStats[] = [
  { code: "TH", name: "Thailand",    gdpPerCapita: 7233,  gdpTotal: 548.9,  population: 71801279,  area: 513120,  gdpGrowth: 2.5,  urbanPct: 53.8, lifeExpectancy: 79.3, internetPct: 88.0, hdi: 0.800 },
  { code: "MY", name: "Malaysia",    gdpPerCapita: 11798, gdpTotal: 415.6,  population: 34160669,  area: 330803,  gdpGrowth: 4.4,  urbanPct: 78.4, lifeExpectancy: 76.3, internetPct: 97.4, hdi: 0.807 },
  { code: "SG", name: "Singapore",   gdpPerCapita: 72794, gdpTotal: 501.4,  population: 5917600,   area: 728,     gdpGrowth: 2.1,  urbanPct: 100.0, lifeExpectancy: 83.5, internetPct: 96.0, hdi: 0.949 },
  { code: "ID", name: "Indonesia",   gdpPerCapita: 4788,  gdpTotal: 1371.2, population: 275501339, area: 1919440, gdpGrowth: 5.0,  urbanPct: 58.6, lifeExpectancy: 72.0, internetPct: 78.2, hdi: 0.713 },
  { code: "VN", name: "Vietnam",     gdpPerCapita: 3641,  gdpTotal: 431.0,  population: 98186856,  area: 331210,  gdpGrowth: 6.0,  urbanPct: 40.8, lifeExpectancy: 75.4, internetPct: 79.1, hdi: 0.726 },
  { code: "LA", name: "Laos",        gdpPerCapita: 2467,  gdpTotal: 15.5,   population: 7529475,   area: 236800,  gdpGrowth: 3.7,  urbanPct: 38.7, lifeExpectancy: 68.5, internetPct: 65.0, hdi: 0.620 },
  { code: "MM", name: "Myanmar",     gdpPerCapita: 1648,  gdpTotal: 66.7,   population: 54181000,  area: 676578,  gdpGrowth: 1.0,  urbanPct: 32.2, lifeExpectancy: 66.5, internetPct: 44.0, hdi: 0.608 },
  { code: "KH", name: "Cambodia",    gdpPerCapita: 2255,  gdpTotal: 42.3,   population: 17236062,  area: 181035,  gdpGrowth: 5.8,  urbanPct: 25.2, lifeExpectancy: 70.1, internetPct: 78.8, hdi: 0.600 },
  { code: "PH", name: "Philippines", gdpPerCapita: 3527,  gdpTotal: 470.1,  population: 120060841, area: 343295,  gdpGrowth: 5.6,  urbanPct: 48.1, lifeExpectancy: 70.5, internetPct: 73.1, hdi: 0.710 },
  { code: "BN", name: "Brunei",      gdpPerCapita: 35848, gdpTotal: 15.1,   population: 449002,    area: 5765,    gdpGrowth: 2.0,  urbanPct: 78.3, lifeExpectancy: 74.7, internetPct: 98.1, hdi: 0.823 },
];

type MetricKey =
  | "gdpPerCapita"
  | "gdpTotal"
  | "population"
  | "gdpGrowth"
  | "urbanPct"
  | "lifeExpectancy"
  | "internetPct"
  | "hdi";

interface Metric {
  key: MetricKey;
  label: string;
  unit: string;
  format: (v: number) => string;
  source: string;
}

const METRICS: Metric[] = [
  {
    key: "gdpPerCapita",
    label: "GDP per capita",
    unit: "USD, 2024",
    format: (v) => `$${v.toLocaleString()}`,
    source: "World Bank 2024",
  },
  {
    key: "gdpTotal",
    label: "GDP total",
    unit: "USD bn, 2024",
    format: (v) => `$${v.toFixed(1)} bn`,
    source: "World Bank 2024",
  },
  {
    key: "gdpGrowth",
    label: "GDP growth",
    unit: "% YoY, 2024",
    format: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`,
    source: "IMF WEO 2024",
  },
  {
    key: "population",
    label: "Population",
    unit: "persons, 2024",
    format: (v) => `${(v / 1_000_000).toFixed(1)}M`,
    source: "UN 2024",
  },
  {
    key: "urbanPct",
    label: "Urban population",
    unit: "% of total",
    format: (v) => `${v.toFixed(1)}%`,
    source: "UN WUP 2024",
  },
  {
    key: "lifeExpectancy",
    label: "Life expectancy",
    unit: "years at birth",
    format: (v) => `${v.toFixed(1)} y`,
    source: "UN 2024",
  },
  {
    key: "internetPct",
    label: "Internet users",
    unit: "% of population",
    format: (v) => `${v.toFixed(1)}%`,
    source: "ITU 2024",
  },
  {
    key: "hdi",
    label: "Human Development",
    unit: "HDI score 0-1",
    format: (v) => v.toFixed(3),
    source: "UNDP HDR 2024",
  },
];

export default function EconomicsSection({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const [metricKey, setMetricKey] = useState<MetricKey>("gdpPerCapita");

  const metric = useMemo(
    () => METRICS.find((m) => m.key === metricKey) ?? METRICS[0],
    [metricKey],
  );

  // Sort descending by current metric for comparison
  const sortedCountries = useMemo(() => {
    return [...ASEAN_COUNTRIES].sort((a, b) => b[metric.key] - a[metric.key]);
  }, [metric.key]);

  const maxValue = useMemo(
    () => Math.max(...sortedCountries.map((c) => c[metric.key])),
    [sortedCountries, metric.key],
  );

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
        <div className="rams-label">ECONOMICS</div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-muted)" }}>
          {expanded ? "-" : "+"}
        </div>
      </button>

      {expanded && (
        <div>
          {/* Metric selector */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
            <div
              className="rams-label"
              style={{ fontSize: 9, marginBottom: 6, color: "var(--ink-muted)" }}
            >
              INDICATOR
            </div>
            <select
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value as MetricKey)}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.04em",
                background: "var(--bg)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: 0,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}  ({m.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Data table with mini-bars */}
          <div style={{ padding: "10px 12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
              }}
            >
              <div className="rams-label" style={{ fontSize: 9 }}>
                {metric.label.toUpperCase()}
              </div>
              <div
                className="rams-label"
                style={{ fontSize: 8, color: "var(--ink-muted)" }}
              >
                {metric.unit}
              </div>
            </div>

            {sortedCountries.map((country, idx) => {
              const value = country[metric.key];
              const pct = (value / maxValue) * 100;
              return (
                <div
                  key={country.code}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px 1fr auto",
                    alignItems: "center",
                    gap: 8,
                    paddingBottom: 6,
                    marginBottom: 6,
                    borderBottom:
                      idx < sortedCountries.length - 1
                        ? "1px solid var(--line-faint)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--ink-dim)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {country.code}
                  </span>
                  <div
                    style={{
                      height: 6,
                      background: "var(--line-faint)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(0, pct)}%`,
                        height: "100%",
                        background: "var(--accent)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    className="rams-value"
                    style={{ fontSize: 11, whiteSpace: "nowrap" }}
                  >
                    {metric.format(value)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Source attribution */}
          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--line)",
              fontSize: 9,
              color: "var(--ink-muted)",
              letterSpacing: "0.04em",
            }}
          >
            Source: {metric.source}
          </div>
        </div>
      )}
    </div>
  );
}
