"use client";

import { ExternalLink } from "lucide-react";

interface ProvenanceBadgeProps {
  source: string;
  sourceUrl?: string;
  publishedAt?: string;
  provider?: string;
  compact?: boolean;
}

function formatProvenance(iso: string, compact?: boolean) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  if (compact) {
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ProvenanceBadge({
  source,
  sourceUrl,
  publishedAt,
  provider,
  compact,
}: ProvenanceBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-[7px] font-mono uppercase tracking-[0.1em] text-[var(--dim)]">
      {provider && provider !== source && (
        <span className="inline-flex items-center px-1 py-px bg-black/5 text-[6px] font-black tracking-[0.16em]">
          {provider}
        </span>
      )}
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 hover:text-[var(--ink)] transition-colors"
          title={`Source: ${source}`}
        >
          {source}
          <ExternalLink size={7} className="opacity-50" />
        </a>
      ) : (
        <span>{source}</span>
      )}
      {publishedAt && (
        <>
          <span className="opacity-25">·</span>
          <time dateTime={publishedAt} className="tabular-nums opacity-60">
            {formatProvenance(publishedAt, compact)}
          </time>
        </>
      )}
    </div>
  );
}

export function FreshnessDot({
  lastUpdated,
  staleAfterMs = 300_000,
  offlineAfterMs = 600_000,
}: {
  lastUpdated: string | null;
  staleAfterMs?: number;
  offlineAfterMs?: number;
}) {
  if (!lastUpdated) {
    return (
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/20" title="No data" />
    );
  }

  const ageMs = Date.now() - new Date(lastUpdated).getTime();

  if (ageMs < staleAfterMs) {
    return (
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"
        title={`Live — ${Math.round(ageMs / 1000)}s ago`}
      />
    );
  }

  if (ageMs < offlineAfterMs) {
    const minutes = Math.round(ageMs / 60_000);
    return (
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"
        title={`Stale — ${minutes}m ago`}
      />
    );
  }

  const minutes = Math.round(ageMs / 60_000);
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-red-400"
      title={`Offline — ${minutes}m ago`}
    />
  );
}
