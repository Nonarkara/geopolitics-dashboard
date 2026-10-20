"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  BookOpen,
  Database,
  ExternalLink,
  Radio,
  RefreshCw,
  Satellite,
  Search,
  X,
} from "lucide-react";
import type {
  ApiSourceEntry,
  ApiSourceResponse,
  CopernicusPreviewResponse,
  RegionalOpenIntelResponse,
} from "../../types/dashboard";

interface ResearchSignal {
  external_id?: string;
  signal_type: string;
  source_provider: string;
  source_url?: string;
  title: string;
  summary?: string;
  url?: string;
  published_at: string;
  region?: string;
  severity?: string;
  keywords?: string[];
}

interface SignalResponse {
  signals: ResearchSignal[];
  total: number;
  mode: "archive" | "live-fallback";
}

type ResearchTab = "evidence" | "coverage" | "satellite";

const EMPTY_SOURCES: ApiSourceResponse = { generatedAt: "", sources: [] };
const REGION_OPTIONS = [
  ["", "All regions"],
  ["myanmar-frontier", "Myanmar frontier"],
  ["cambodia-frontier", "Cambodia frontier"],
  ["deep-south", "Deep South"],
  ["malaysia-frontier", "Malaysia frontier"],
  ["general", "General"],
] as const;
const TYPE_OPTIONS = [
  "",
  "incident",
  "news",
  "osint",
  "military",
  "political",
  "diplomatic",
  "humanitarian",
  "thermal",
  "seismic",
  "weather",
  "maritime",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asSignalResponse(value: unknown): SignalResponse {
  if (!isRecord(value) || !Array.isArray(value.signals)) {
    return { signals: [], total: 0, mode: "archive" };
  }
  return {
    signals: value.signals as ResearchSignal[],
    total: typeof value.total === "number" ? value.total : 0,
    mode: "archive",
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function inferRegion(text: string) {
  const normalized = text.toLowerCase();
  if (/myanmar|burma|mae sot|tak\b/.test(normalized)) return "myanmar-frontier";
  if (/cambodia|poipet|aranyaprathet|sa kaeo/.test(normalized)) return "cambodia-frontier";
  if (/malaysia|kelantan|narathiwat|pattani|yala/.test(normalized)) return "malaysia-frontier";
  return "general";
}

function liveEvidenceFromPayloads(payloads: unknown[]): ResearchSignal[] {
  const evidence: ResearchSignal[] = [];

  for (const payload of payloads) {
    if (Array.isArray(payload)) {
      for (const item of payload) {
        if (!isRecord(item)) continue;
        const place = asString(item.place);
        const time = asString(item.time);
        const url = asString(item.url);
        if (!place || !time || !url) continue;
        const magnitude = typeof item.magnitude === "number" ? item.magnitude : null;
        evidence.push({
          external_id: asString(item.id),
          signal_type: "seismic",
          source_provider: "USGS Earthquake Hazards Program",
          source_url: url,
          url,
          title: magnitude === null ? place : `M${magnitude.toFixed(1)} · ${place}`,
          summary: typeof item.depth === "number" ? `Reported depth ${item.depth.toFixed(1)} km.` : undefined,
          published_at: time,
          region: inferRegion(place),
          severity: magnitude !== null && magnitude >= 5 ? "watch" : "stable",
        });
      }
      continue;
    }

    if (!isRecord(payload)) continue;
    if (Array.isArray(payload.news)) {
      for (const item of payload.news) {
        if (!isRecord(item)) continue;
        const title = asString(item.title);
        const publishedAt = asString(item.publishedAt);
        const url = asString(item.sourceUrl);
        if (!title || !publishedAt || !url) continue;
        evidence.push({
          external_id: asString(item.id),
          signal_type: "news",
          source_provider: asString(item.source) ?? asString(item.provider) ?? "Border OSINT",
          source_url: url,
          url,
          title,
          summary: asString(item.summary),
          published_at: publishedAt,
          region: inferRegion(`${title} ${asString(item.summary) ?? ""}`),
          severity: asString(item.severity),
          keywords: asString(item.tag) ? [asString(item.tag)!] : undefined,
        });
      }
    }

    const data = isRecord(payload.data) ? payload.data : null;
    if (data && Array.isArray(data.reports)) {
      for (const item of data.reports) {
        if (!isRecord(item)) continue;
        const title = asString(item.title);
        const publishedAt = asString(item.date);
        const url = asString(item.url);
        if (!title || !publishedAt || !url) continue;
        evidence.push({
          external_id: asString(item.id),
          signal_type: "humanitarian",
          source_provider: asString(item.source) ?? "ReliefWeb",
          source_url: url,
          url,
          title,
          published_at: publishedAt,
          region: inferRegion(title),
        });
      }
    }
  }

  return evidence;
}

function asSources(value: unknown): ApiSourceResponse {
  return isRecord(value) && Array.isArray(value.sources)
    ? (value as unknown as ApiSourceResponse)
    : EMPTY_SOURCES;
}

function formatTime(value?: string | null) {
  if (!value) return "not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function sourceState(source: ApiSourceEntry) {
  return source.health ?? (source.checkedAt ? "live" : "on demand");
}

async function fetchJson(path: string, unavailableMessage: string): Promise<unknown> {
  const response = await fetch(path, { cache: "no-store", signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new Error(unavailableMessage);
  return response.json();
}

async function fetchSignals(
  query: string,
  region: string,
  signalType: string,
): Promise<SignalResponse> {
  const params = new URLSearchParams({ limit: "50" });
  if (query.trim()) params.set("search", query.trim());
  if (region) params.set("region", region);
  if (signalType) params.set("type", signalType);
  try {
    const archived = asSignalResponse(await fetchJson(
      `/api/research/signals?${params.toString()}`,
      "The evidence archive is unavailable.",
    ));
    if (archived.total > 0 || archived.signals.length > 0) return archived;
  } catch {
    // The same live-evidence lane covers an unavailable archive and an empty one.
  }

  const paths = ["/api/border/news", "/api/border/reliefweb", "/api/border/earthquakes"];
  const settled = await Promise.allSettled(
    paths.map((path) => fetchJson(path, `${path} is unavailable.`)),
  );
  let signals = liveEvidenceFromPayloads(
    settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []),
  );
  const search = query.trim().toLowerCase();
  if (search) {
    signals = signals.filter((signal) =>
      `${signal.title} ${signal.summary ?? ""} ${signal.source_provider}`.toLowerCase().includes(search),
    );
  }
  if (region) signals = signals.filter((signal) => signal.region === region);
  if (signalType) signals = signals.filter((signal) => signal.signal_type === signalType);
  signals = signals
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
    .slice(0, 50);
  if (signals.length === 0 && settled.every((result) => result.status === "rejected")) {
    throw new Error("Archive and live evidence feeds are unavailable.");
  }
  return { signals, total: signals.length, mode: "live-fallback" };
}

export default function ResearchWorkbenchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ResearchTab>("evidence");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [signalType, setSignalType] = useState("");
  const [signals, setSignals] = useState<SignalResponse>({ signals: [], total: 0, mode: "archive" });
  const [sources, setSources] = useState<ApiSourceResponse>(EMPTY_SOURCES);
  const [imagery, setImagery] = useState<CopernicusPreviewResponse | null>(null);
  const [openIntel, setOpenIntel] = useState<RegionalOpenIntelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settled, setSettled] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const closeFromEffect = useEffectEvent(onClose);

  const loadWorkbench = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSettled([]);
    setFailed([]);
    const finish = (service: string) => setSettled((previous) => [...previous, service]);
    const reject = (service: string) => (reason: unknown) => {
      setFailed((previous) => [...previous, service]);
      if (service === "sources") setSources(EMPTY_SOURCES);
      if (service === "imagery") setImagery(null);
      if (service === "orbitals") setOpenIntel(null);
      if (service === "evidence") setSignals({ signals: [], total: 0, mode: "archive" });
      throw reason;
    };
    const results = await Promise.allSettled([
      fetchJson("/api/sources", "Source coverage is unavailable.").then((payload) => {
        setSources(asSources(payload));
      }).catch(reject("sources")).finally(() => finish("sources")),
      fetchJson("/api/copernicus/preview", "The imagery catalogue is unavailable.").then(
        (payload) => {
          setImagery(
            isRecord(payload) && Array.isArray(payload.imagerySources)
              ? (payload as unknown as CopernicusPreviewResponse)
              : null,
          );
        },
      ).catch(reject("imagery")).finally(() => finish("imagery")),
      fetchJson("/api/open-intel/regional", "Regional open intelligence is unavailable.").then(
        (payload) => {
          setOpenIntel(
            isRecord(payload) && Array.isArray(payload.orbitals)
              ? (payload as unknown as RegionalOpenIntelResponse)
              : null,
          );
        },
      ).catch(reject("orbitals")).finally(() => finish("orbitals")),
      fetchSignals("", "", "").then(setSignals).catch(reject("evidence")).finally(() => finish("evidence")),
    ]);

    const failures = results.filter((result) => result.status === "rejected").length;
    if (failures) {
      setError(`${failures} of 4 research services are unavailable; verified results remain visible.`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const loadTimer = window.setTimeout(() => void loadWorkbench(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFromEffect();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.clearTimeout(loadTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, loadWorkbench]);

  const groupedSources = useMemo(() => {
    const groups = new Map<string, ApiSourceEntry[]>();
    for (const source of sources.sources) {
      const key = source.kind || "Other";
      groups.set(key, [...(groups.get(key) ?? []), source]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sources.sources]);

  const submitSearch = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSettled((previous) => previous.filter((service) => service !== "evidence"));
    setFailed((previous) => previous.filter((service) => service !== "evidence"));
    try {
      setSignals(await fetchSignals(query, region, signalType));
    } catch (caught) {
      setSignals({ signals: [], total: 0, mode: "archive" });
      setFailed((previous) => [...previous, "evidence"]);
      setError(caught instanceof Error ? caught.message : "Search failed.");
    } finally {
      setSettled((previous) => [...previous, "evidence"]);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-2 sm:p-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="research-title"
        className="research-workbench flex w-full flex-col overflow-hidden border border-white/20 bg-[#090a0e] text-white"
      >
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 px-4">
          <div className="min-w-0">
            <h2 id="research-title" className="text-[18px] font-black">
              Research Workbench
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadWorkbench()}
              disabled={loading}
              aria-label="Refresh research"
              className="research-refresh flex h-11 items-center gap-2 px-2 text-[13px] text-white/70 hover:text-white disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close research workbench"
              className="flex h-10 w-10 items-center justify-center border border-white/15 text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="research-counts" aria-live="polite">
          {[
            ["Evidence", failed.includes("evidence") ? "unavailable" : settled.includes("evidence") ? signals.total.toLocaleString() : "…"],
            ["Sources", failed.includes("sources") ? "unavailable" : settled.includes("sources") ? sources.sources.length.toLocaleString() : "…"],
            ["Layers", failed.includes("imagery") ? "unavailable" : settled.includes("imagery") ? String(imagery?.imagerySources.length ?? "—") : "…"],
            ["Orbitals", failed.includes("orbitals") ? "unavailable" : settled.includes("orbitals") ? String(openIntel?.orbitals.length ?? "—") : "…"],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span><strong>{value}</strong>
            </div>
          ))}
        </div>

        <nav className="research-tabs" aria-label="Research views">
          {([
            ["evidence", "Evidence desk", Database],
            ["coverage", "Source coverage", BookOpen],
            ["satellite", "Satellite desk", Satellite],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`text-[13px] font-bold ${
                tab === id ? "bg-[var(--accent)] text-black" : "text-white/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {error || failed.length > 0 ? (
          <div className="border-b border-[var(--accent)] bg-[#24170a] px-4 py-2 text-[13px] text-[var(--accent)]">
            {failed.length > 0 ? `${failed.join(", ")} unavailable. Refresh to retry.` : error}
          </div>
        ) : null}

        <div className="research-body min-h-0 overflow-auto">
          {tab === "evidence" ? (
            <div>
              <form onSubmit={submitSearch} className="research-filters">
                <div className="research-search">
                <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-white/40" htmlFor="research-query">
                  Full-text query
                </label>
                <div className="mt-2 flex">
                  <input
                    id="research-query"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="place, actor, event…"
                    className="h-11 min-w-0 flex-1 border border-white/15 bg-black px-3 text-[14px] text-white outline-none focus:border-[var(--accent)]"
                  />
                  <button type="submit" className="flex h-11 w-11 items-center justify-center bg-[var(--accent)] text-black" aria-label="Search evidence">
                    <Search size={17} />
                  </button>
                </div>
                </div>
                <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-white/40" htmlFor="research-region">
                  Region
                </label>
                <select id="research-region" value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2 h-11 w-full border border-white/15 bg-black px-3 text-[13px] text-white">
                  {REGION_OPTIONS.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
                </select>
                </div>
                <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-white/40" htmlFor="research-type">
                  Signal type
                </label>
                <select id="research-type" value={signalType} onChange={(event) => setSignalType(event.target.value)} className="mt-2 h-11 w-full border border-white/15 bg-black px-3 text-[13px] text-white">
                  {TYPE_OPTIONS.map((value) => <option key={value || "all"} value={value}>{value || "All types"}</option>)}
                </select>
                </div>
              </form>
                {signals.mode === "live-fallback" ? (
                  <div className="research-notice text-[13px] leading-5 text-[var(--accent)]">
                    Current reports from ReliefWeb, USGS and the border desk. No archival matches are available.
                  </div>
                ) : null}
              <div className="research-results divide-y divide-white/10" aria-busy={!settled.includes("evidence") || loading}>
                {signals.signals.length === 0 ? (
                  <div className="p-4 text-[14px] text-white/65" role="status">{!settled.includes("evidence") ? "Checking evidence sources…" : failed.includes("evidence") || error ? "Evidence unavailable. Refresh to retry." : "No evidence matched this query."}</div>
                ) : signals.signals.map((signal, index) => (
                  <article key={signal.external_id ?? `${signal.source_provider}-${signal.published_at}-${index}`} className="p-4 hover:bg-white/[0.03]">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/65">
                      <span className="border border-white/15 px-1.5 py-0.5 text-[var(--accent)]">{signal.signal_type}</span>
                      <span>{signal.source_provider}</span>
                      <span>{signal.region ?? "unclassified"}</span>
                      <time>{formatTime(signal.published_at)}</time>
                    </div>
                    <h3 className="mt-2 text-[20px] font-bold leading-6 text-white/95">{signal.title}</h3>
                    {signal.summary ? <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-white/48">{signal.summary}</p> : null}
                    {signal.url || signal.source_url ? (
                      <a href={signal.url ?? signal.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--accent)]">
                        Primary source <ExternalLink size={11} />
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "coverage" ? (
            <div className="p-4">
              <div className="mb-4 border border-white/10 bg-black p-4 text-[13px] leading-5 text-white/55">
                Coverage is an inventory, not a claim of completeness. Each endpoint shows its intended target and observed health; duplicated aggregators are retained as corroboration, not counted as independent evidence.
              </div>
              <div className="space-y-5">
                {groupedSources.map(([kind, entries]) => (
                  <section key={kind}>
                    <h3 className="mb-2 text-[12px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">{kind}</h3>
                    <div className="grid gap-px bg-white/10 sm:grid-cols-2 xl:grid-cols-3">
                      {entries.map((source) => (
                        <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="bg-[#0c0d12] p-3 hover:bg-white/[0.05]">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-[13px] font-black text-white/85">{source.label}</span>
                            <span className="border border-white/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">{sourceState(source)}</span>
                          </div>
                          <div className="mt-2 text-[12px] leading-4 text-white/38">{source.target}</div>
                          <div className="mt-2 text-[11px] text-white/25">{formatTime(source.checkedAt)}</div>
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "satellite" ? (
            <div className="grid gap-px bg-white/10 lg:grid-cols-[1fr_360px]">
              <section className="bg-[#090a0e] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Satellite size={16} className="text-[var(--accent)]" />
                  <h3 className="text-[13px] font-black uppercase tracking-[0.18em]">Imagery stack</h3>
                </div>
                <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                  {(imagery?.imagerySources ?? []).map((layer) => (
                    <article key={layer.id} className="bg-[#0c0d12] p-3">
                      <div className="text-[13px] font-black text-white/85">{layer.label}</div>
                      <p className="mt-1 text-[12px] leading-5 text-white/42">{layer.description}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-4 border border-white/10 p-3 text-[12px] leading-5 text-white/45">
                  Imagery date: <strong className="text-white/75">{imagery?.focusDate ?? "unavailable"}</strong>. Daily layers use NASA GIBS with a processing-lag date; static Sentinel-2 cloudless is a baseline, not live surveillance.
                </div>
              </section>
              <aside className="bg-[#0c0d12] p-4">
                <div className="flex items-center gap-2">
                  <Radio size={16} className="text-[var(--accent)]" />
                  <h3 className="text-[13px] font-black uppercase tracking-[0.18em]">Space + maritime context</h3>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-px bg-white/10">
                  <div className="bg-black p-3"><dt className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Orbitals</dt><dd className="mt-1 text-[24px] font-black">{!settled.includes("orbitals") ? "…" : openIntel ? openIntel.orbitals.length : "—"}</dd></div>
                  <div className="bg-black p-3"><dt className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Ports / straits</dt><dd className="mt-1 text-[24px] font-black">{!settled.includes("orbitals") ? "…" : openIntel ? openIntel.maritimePoints.length : "—"}</dd></div>
                </dl>
                <div className="mt-4 text-[12px] leading-5 text-white/45">
                  Status: <strong className="uppercase text-white/75">{!settled.includes("orbitals") ? "checking" : openIntel?.status ?? "unavailable"}</strong><br />
                  Source time: {formatTime(openIntel?.sourceTimestamp)}
                </div>
                <a href={openIntel?.sourceUrl ?? "https://osirisai.live/docs"} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--accent)]">
                  OSIRIS public API docs <ExternalLink size={11} />
                </a>
                <p className="mt-5 border-t border-white/10 pt-4 text-[12px] leading-5 text-white/38">
                  Orbital points are current TLE-derived subpoints, not sensor footprints. Ports and chokepoints are strategic reference geometry; live AIS remains a separate feed and may be empty when no receiver is connected.
                </p>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
