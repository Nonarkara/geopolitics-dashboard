"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type {
  IntelligenceItem,
  IntelligencePackageResponse,
  PackageStatus,
} from "../../../types/dashboard";

function isIntelligencePackageResponse(
  value: unknown,
): value is IntelligencePackageResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "packages" in value &&
    Array.isArray(value.packages)
  );
}

function statusClass(status: PackageStatus) {
  if (status === "live") {
    return "bg-[rgba(34,197,94,0.14)] text-[#22c55e]";
  }

  if (status === "stale") {
    return "bg-[rgba(245,158,11,0.14)] text-[#f59e0b]";
  }

  return "bg-[rgba(239,68,68,0.14)] text-[#ef4444]";
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function summarizeItem(item: IntelligenceItem) {
  return item.summary.length > 120
    ? `${item.summary.slice(0, 117)}...`
    : item.summary;
}

export default function SignalDossier() {
  const [payload, setPayload] = useState<IntelligencePackageResponse | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/intelligence/packages");
      const nextPayload: unknown = await response.json();

      if (isIntelligencePackageResponse(nextPayload)) {
        setPayload(nextPayload);
      }
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void load();
    }, 0);
    const interval = setInterval(() => {
      void load();
    }, 2 * 60 * 1000);

    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [load]);

  return (
    <section
      data-testid="signal-dossier-zone"
      className="flex h-full flex-col overflow-hidden bg-[var(--bg-raised)] p-3"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
        <div>
          <div className="eyebrow">Signals dossier</div>
          <div className="pt-1 text-[15px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            Package evidence and provenance
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--dim)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--cool)]"
          aria-label="Refresh signal dossier"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto pt-3 xl:grid-cols-2">
        {payload?.packages.slice(0, 4).map((pkg) => (
          <article
            key={pkg.id}
            className="rounded-2xl border border-[var(--line)] bg-[rgba(6,10,18,0.42)] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
                  {pkg.title}
                </div>
                <p className="pt-1 text-[11px] leading-5 text-[var(--muted)]">
                  {pkg.headline}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.16em] ${statusClass(
                  pkg.status,
                )}`}
              >
                {pkg.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-3">
              {pkg.sourceLabels.slice(0, 3).map((sourceLabel) => (
                <span
                  key={sourceLabel}
                  className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--dim)]"
                >
                  {sourceLabel}
                </span>
              ))}
            </div>

            <div className="space-y-3 pt-3">
              {pkg.items.slice(0, 2).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-[var(--line)] bg-[rgba(248,246,240,0.02)] p-3 transition-colors hover:border-[var(--line-bright)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.16em] ${statusClass(
                        item.severity === "stable" ? "stale" : "live",
                      )}`}
                    >
                      {item.tags[0] ?? item.kind}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-[var(--dim)]">
                      {formatTimestamp(item.publishedAt)}
                    </span>
                  </div>
                  <div className="pt-2 text-[12px] font-semibold text-[var(--ink)]">
                    {item.title}
                  </div>
                  <p className="pt-1 text-[11px] leading-5 text-[var(--muted)]">
                    {summarizeItem(item)}
                  </p>
                  <div className="pt-2 text-[9px] font-mono uppercase tracking-[0.14em] text-[var(--dim)]">
                    {item.source}
                  </div>
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
