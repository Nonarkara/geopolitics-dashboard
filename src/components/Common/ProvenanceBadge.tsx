"use client";

import { ExternalLink } from "lucide-react";
import { useNow } from "../../hooks/useNow";

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
    <div className="flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.1em] text-[var(--dim)]">
      {provider && provider !== source && (
        <span className="inline-flex items-center px-1 py-px bg-black/5 text-[11px] font-black tracking-[0.16em]">
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
          <ExternalLink size={10} className="opacity-50" />
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

/**
 * Age of the PAYLOAD this client is holding, measured from the `generatedAt`
 * the server stamped on it, against the browser clock.
 *
 * This is deliberately NOT the same quantity as the per-dataset staleness that
 * `src/lib/runtime-status.ts` declares (`staleAfterMinutes`) and `/api/status`
 * reports: that measures how old the newest row in a Postgres table is. A
 * response built one second ago can be built entirely from rows three days
 * old, so a green dot here and a `stale` dataset in `/api/status` are both
 * true at once. The titles below therefore say which quantity is being
 * measured — reading this dot as a claim about upstream data freshness is the
 * mistake it used to invite by labelling itself "Live".
 */
export function FreshnessDot({
  lastUpdated,
  staleAfterMs = 300_000,
  offlineAfterMs = 600_000,
}: {
  /** Server-stamped build time of the payload (`generatedAt`). */
  lastUpdated: string | null;
  staleAfterMs?: number;
  offlineAfterMs?: number;
}) {
  const now = useNow(30_000);

  if (!lastUpdated) {
    return (
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-white/20"
        title="No payload received yet"
      />
    );
  }

  if (now === null) {
    return (
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-white/20"
        title="Syncing freshness state"
      />
    );
  }

  const ageMs = now - new Date(lastUpdated).getTime();
  const seconds = Math.round(ageMs / 1000);
  const minutes = Math.round(ageMs / 60_000);

  if (ageMs < staleAfterMs) {
    return (
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"
        title={`Payload built ${seconds}s ago — source freshness is reported separately in /api/status`}
      />
    );
  }

  if (ageMs < offlineAfterMs) {
    return (
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"
        title={`Payload built ${minutes}m ago — past the ${Math.round(staleAfterMs / 60_000)}m refresh window`}
      />
    );
  }

  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-red-400"
      title={`No new payload for ${minutes}m — refresh has stopped`}
    />
  );
}
