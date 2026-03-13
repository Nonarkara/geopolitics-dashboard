"use client";

import { useEffect, useState } from "react";
import {
  fallbackCopernicusPreview,
  fallbackSources,
} from "../../lib/mock-data";
import type {
  ApiSourceResponse,
  CopernicusPreviewResponse,
} from "../../types/dashboard";

function isApiSourceResponse(value: unknown): value is ApiSourceResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "sources" in value &&
    Array.isArray(value.sources)
  );
}

function isCopernicusPreviewResponse(
  value: unknown,
): value is CopernicusPreviewResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "imagerySources" in value &&
    Array.isArray(value.imagerySources)
  );
}

export default function SourceStack() {
  const [sources, setSources] = useState<ApiSourceResponse>(fallbackSources);
  const [preview, setPreview] = useState<CopernicusPreviewResponse>(
    fallbackCopernicusPreview,
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [sourcesResponse, previewResponse] = await Promise.all([
          fetch("/api/sources"),
          fetch("/api/copernicus/preview"),
        ]);
        const [sourcesPayload, previewPayload]: [unknown, unknown] =
          await Promise.all([sourcesResponse.json(), previewResponse.json()]);

        if (isApiSourceResponse(sourcesPayload)) {
          setSources(sourcesPayload);
        }

        if (isCopernicusPreviewResponse(previewPayload)) {
          setPreview(previewPayload);
        }
      } catch {
        setSources(fallbackSources);
        setPreview(fallbackCopernicusPreview);
      }
    };

    load();
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-3">
        <div className="eyebrow opacity-60">Data Connectivity</div>
        {sources.sources.slice(0, 3).map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-3"
          >
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[var(--ink)]">{source.label}</div>
              <div className="truncate text-[9px] font-mono text-[var(--dim)]">{source.url}</div>
            </div>
            <span className="shrink-0 rounded bg-[var(--line)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[var(--muted)]">
              {source.target}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        <div className="eyebrow opacity-60">Satellite Layers</div>
        {preview.imagerySources.slice(0, 2).map((source) => (
          <div
            key={source.id}
            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3"
          >
            <div className="text-[11px] font-bold text-[var(--ink)]">{source.label}</div>
            <p className="pt-1 text-[11px] leading-relaxed text-[var(--muted)]">
              {source.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
