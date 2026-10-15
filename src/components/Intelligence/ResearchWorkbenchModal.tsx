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
    return { signals: [], total: 0 };
  }
  return {
    signals: value.signals as ResearchSignal[],
    total: typeof value.total === "number" ? value.total : 0,
  };
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
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(unavailableMessage);
  return response.json();
}

async function fetchSignals(query: string, region: string, signalType: string) {
  const params = new URLSearchParams({ limit: "50" });
  if (query.trim()) params.set("search", query.trim());
  if (region) params.set("region", region);
  if (signalType) params.set("type", signalType);
  return asSignalResponse(
    await fetchJson(
      `/api/research/signals?${params.toString()}`,
      "The evidence archive is unavailable.",
    ),
  );
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
  const [signals, setSignals] = useState<SignalResponse>({ signals: [], total: 0 });
  const [sources, setSources] = useState<ApiSourceResponse>(EMPTY_SOURCES);
  const [imagery, setImagery] = useState<CopernicusPreviewResponse | null>(null);
  const [openIntel, setOpenIntel] = useState<RegionalOpenIntelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const closeFromEffect = useEffectEvent(onClose);

  const loadWorkbench = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      fetchJson("/api/sources", "Source coverage is unavailable.").then((payload) => {
        setSources(asSources(payload));
      }),
      fetchJson("/api/copernicus/preview", "The imagery catalogue is unavailable.").then(
        (payload) => {
          setImagery(
            isRecord(payload) && Array.isArray(payload.imagerySources)
              ? (payload as unknown as CopernicusPreviewResponse)
              : null,
          );
        },
      ),
      fetchJson("/api/open-intel/regional", "Regional open intelligence is unavailable.").then(
        (payload) => {
          setOpenIntel(
            isRecord(payload) && Array.isArray(payload.orbitals)
              ? (payload as unknown as RegionalOpenIntelResponse)
              : null,
          );
        },
      ),
      fetchSignals("", "", "").then(setSignals),
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
    try {
      setSignals(await fetchSignals(query, region, signalType));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Search failed.");
    } finally {
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
        className="flex h-[94dvh] w-full max-w-[1500px] flex-col overflow-hidden border border-white/20 bg-[#090a0e] text-white"
      >
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 px-4">
          <div className="min-w-0">
            <div className="text-[12px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
              Evidence before inference
            </div>
            <h2 id="research-title" className="truncate text-[18px] font-black uppercase tracking-[0.05em]">
              Research Workbench
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadWorkbench()}
              disabled={loading}
              className="flex h-10 items-center gap-2 border border-white/15 px-3 text-[12px] font-black uppercase tracking-[0.16em] text-white/60 hover:text-white disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
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

        <div className="grid grid-cols-2 border-b border-white/10 bg-black sm:grid-cols-4">
          {[
            ["Archive matches", signals.total.toLocaleString()],
            ["Source endpoints", sources.sources.length.toLocaleString()],
            ["Satellite layers", String(imagery?.imagerySources.length ?? 0)],
            ["Regional orbitals", String(openIntel?.orbitals.length ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-b border-white/10 px-4 py-3 last:border-r-0 sm:border-b-0">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/35">{label}</div>
              <div className="mt-1 text-[22px] font-black tabular-nums">{value}</div>
            </div>
          ))}
        </div>

        <nav className="grid h-11 grid-cols-3 border-b border-white/10" aria-label="Research views">
          {([
            ["evidence", "Evidence archive", Database],
            ["coverage", "Source coverage", BookOpen],
            ["satellite", "Satellite desk", Satellite],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`flex items-center justify-center gap-2 border-r border-white/10 text-[12px] font-black uppercase tracking-[0.16em] last:border-r-0 ${
                tab === id ? "bg-[var(--accent)] text-black" : "text-white/50 hover:text-white"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>

        {error ? (
          <div className="border-b border-[var(--accent)] bg-[#24170a] px-4 py-2 text-[13px] text-[var(--accent)]">
            {error}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto">
          {tab === "evidence" ? (
            <div className="grid min-h-full lg:grid-cols-[320px_1fr]">
              <form onSubmit={submitSearch} className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
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
                <label className="mt-5 block text-[11px] font-black uppercase tracking-[0.18em] text-white/40" htmlFor="research-region">
                  Region
                </label>
                <select id="research-region" value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2 h-11 w-full border border-white/15 bg-black px-3 text-[13px] text-white">
                  {REGION_OPTIONS.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
                </select>
                <label className="mt-5 block text-[11px] font-black uppercase tracking-[0.18em] text-white/40" htmlFor="research-type">
                  Signal type
                </label>
                <select id="research-type" value={signalType} onChange={(event) => setSignalType(event.target.value)} className="mt-2 h-11 w-full border border-white/15 bg-black px-3 text-[13px] text-white">
                  {TYPE_OPTIONS.map((value) => <option key={value || "all"} value={value}>{value || "All types"}</option>)}
                </select>
                <p className="mt-5 text-[13px] leading-5 text-white/40">
                  Results are bounded to 50 rows. Every item retains provider, publication time, region, and source link so the archive can be audited.
                </p>
              </form>
              <div className="divide-y divide-white/10">
                {signals.signals.length === 0 ? (
                  <div className="p-8 text-[14px] text-white/45">No archived evidence matched this query.</div>
                ) : signals.signals.map((signal, index) => (
                  <article key={signal.external_id ?? `${signal.source_provider}-${signal.published_at}-${index}`} className="p-4 hover:bg-white/[0.03]">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/35">
                      <span className="border border-white/15 px-1.5 py-0.5 text-[var(--accent)]">{signal.signal_type}</span>
                      <span>{signal.source_provider}</span>
                      <span>{signal.region ?? "unclassified"}</span>
                      <time>{formatTime(signal.published_at)}</time>
                    </div>
                    <h3 className="mt-2 text-[15px] font-black leading-5 text-white/90">{signal.title}</h3>
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
                  <div className="bg-black p-3"><dt className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Orbitals</dt><dd className="mt-1 text-[24px] font-black">{openIntel?.orbitals.length ?? 0}</dd></div>
                  <div className="bg-black p-3"><dt className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Ports / straits</dt><dd className="mt-1 text-[24px] font-black">{openIntel?.maritimePoints.length ?? 0}</dd></div>
                </dl>
                <div className="mt-4 text-[12px] leading-5 text-white/45">
                  Status: <strong className="uppercase text-white/75">{openIntel?.status ?? "unavailable"}</strong><br />
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
