"use client";

import { useEffect, useState } from "react";
import type {
  ApiSourceResponse,
  CopernicusPreviewResponse,
} from "../../types/dashboard";

const emptySources: ApiSourceResponse = { generatedAt: "", sources: [] };

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
  const [sources, setSources] = useState<ApiSourceResponse>(emptySources);
  const [preview, setPreview] = useState<CopernicusPreviewResponse | null>(null);

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
        // Fail closed: keep the honest empty state instead of mock sources.
      }
    };

    load();
  }, []);

  return (
    <div className="flex flex-col gap-2 select-none overflow-hidden">
      {/* Data Feeds - compact */}
      <div className="space-y-1">
        {sources?.sources?.slice(0, 3).map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between gap-1 border border-[var(--line-dim)] px-2 py-1 bg-white"
          >
            <span className="text-[12px] font-black truncate">{source.label}</span>
            <span className="stat-pill safe shrink-0 text-[12px]">{source.target?.slice(0, 4) || "OK"}</span>
          </div>
        ))}
      </div>

      {/* Only imagery sources actually exposed by this deployment. */}
      <div className="grid grid-cols-2 gap-1">
        {(preview?.imagerySources ?? []).slice(0, 4).map((source) => (
          <div key={source.id} className="flex min-w-0 flex-col py-1 px-1.5 border border-[var(--line-dim)] bg-[var(--bg)]">
            <span className="truncate text-[12px] font-black opacity-50">{source.id}</span>
            <span className="truncate text-[11px] font-black opacity-25 uppercase">{source.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
