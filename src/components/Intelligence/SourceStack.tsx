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
    <section className="grid h-full grid-rows-[1fr_auto] bg-[#ece6db]">
      <div className="p-6">
        <div className="border-b border-[#cfc7b7] pb-4">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">
            API Structure
          </div>
          <div className="pt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#121212]">
            Reference stack
          </div>
        </div>
        <div className="space-y-3 pt-4">
          {sources.sources.slice(0, 6).map((source) => (
            <div
              key={source.id}
              className="grid grid-cols-[92px_1fr] gap-4 border-b border-[#ddd5c7] pb-3 text-[12px] last:border-b-0"
            >
              <div className="font-medium uppercase tracking-[0.16em] text-[#787267]">
                {source.target}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-[#181818]">{source.label}</div>
                <div className="truncate pt-1 text-[#5c584f]">{source.url}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#cfc7b7] px-6 py-4">
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">
          Imagery Preview / {preview.focusDate}
        </div>
        <div className="grid gap-3 pt-3 md:grid-cols-3">
          {preview.imagerySources.map((source) => (
            <div key={source.id} className="border border-[#cfc7b7] bg-[#f4efe7] p-3">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#121212]">
                {source.label}
              </div>
              <p className="pt-2 text-[12px] leading-5 text-[#555046]">
                {source.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
