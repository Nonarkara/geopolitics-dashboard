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
    <section className="grid h-full grid-rows-[1fr_auto] bg-[#efe7dc]">
      <div className="p-6">
        <div className="border-b border-[#d6cebf] pb-4">
          <div className="eyebrow">Sources</div>
          <div className="pt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#171512]">
            Data behind the screen
          </div>
        </div>
        <div className="space-y-3 pt-4">
          {sources.sources.slice(0, 6).map((source) => (
            <div
              key={source.id}
              className="grid grid-cols-[88px_1fr] gap-4 rounded-[18px] border border-[#ddd5c7] bg-white/65 p-3 text-[12px]"
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

      <div className="border-t border-[#d6cebf] px-6 py-4">
        <div className="eyebrow">
          Imagery layers / {preview.focusDate}
        </div>
        <div className="grid gap-3 pt-3">
          {preview.imagerySources.map((source) => (
            <div
              key={source.id}
              className="rounded-[18px] border border-[#d6cebf] bg-[#f7f2ea] p-3"
            >
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#121212]">
                {source.label}
              </div>
              <p className="pt-2 text-[12px] leading-5 text-[#555046]">
                {source.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[18px] border border-[#d6cebf] bg-white/60 p-3 text-[12px] leading-5 text-[#555046]">
          Combining ground incidents, market movement, and daily imagery makes
          the dashboard harder to misread from a single signal alone.
        </div>
      </div>
    </section>
  );
}
