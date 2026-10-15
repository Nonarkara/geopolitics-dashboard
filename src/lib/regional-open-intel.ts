import { getTimeoutSignal } from "./http";
import type {
  OrbitalObject,
  RegionalOpenIntelResponse,
  StrategicMaritimePoint,
} from "../types/dashboard";

const OSIRIS_API = "https://osirisai.live/api";
const SOURCE_URL = "https://osirisai.live/docs";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REGION = { west: 85, east: 115, south: 0, north: 30 } as const;

let cache: { expiresAt: number; payload: RegionalOpenIntelResponse } | null = null;
let inFlight: Promise<RegionalOpenIntelResponse> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || /^(undefined|null|n\/a)$/i.test(text)) return null;
  return text;
}

function inRegionalFrame(lat: number, lng: number) {
  return (
    lat >= REGION.south &&
    lat <= REGION.north &&
    lng >= REGION.west &&
    lng <= REGION.east
  );
}

async function fetchJson(path: "/satellites" | "/maritime") {
  const response = await fetch(`${OSIRIS_API}${path}`, {
    headers: { accept: "application/json" },
    signal: getTimeoutSignal(20_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${path.slice(1)} upstream returned HTTP ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

function normalizeOrbitals(payload: unknown): OrbitalObject[] {
  if (!isRecord(payload) || !Array.isArray(payload.satellites)) {
    return [];
  }

  return payload.satellites
    .flatMap((value): OrbitalObject[] => {
      if (!isRecord(value)) return [];
      const lat = finiteNumber(value.lat);
      const lng = finiteNumber(value.lng);
      const altitudeKm = finiteNumber(value.alt);
      const noradId = textOrNull(value.noradId);
      const name = textOrNull(value.name);

      if (
        lat === null ||
        lng === null ||
        altitudeKm === null ||
        !name ||
        !inRegionalFrame(lat, lng)
      ) {
        return [];
      }

      return [{
        id: noradId ?? `${name}-${lat.toFixed(3)}-${lng.toFixed(3)}`,
        name,
        lat,
        lng,
        altitudeKm,
        category: textOrNull(value.category) ?? "other",
        mission: textOrNull(value.mission),
      }];
    })
    .sort((a, b) => a.altitudeKm - b.altitudeKm)
    .slice(0, 500);
}

function normalizeMaritime(payload: unknown): StrategicMaritimePoint[] {
  if (!isRecord(payload)) {
    return [];
  }

  const normalize = (
    values: unknown,
    kind: StrategicMaritimePoint["kind"],
  ): StrategicMaritimePoint[] => {
    if (!Array.isArray(values)) return [];

    return values.flatMap((value): StrategicMaritimePoint[] => {
      if (!isRecord(value)) return [];
      const lat = finiteNumber(value.lat);
      const lng = finiteNumber(value.lng);
      const name = textOrNull(value.name);

      if (lat === null || lng === null || !name || !inRegionalFrame(lat, lng)) {
        return [];
      }

      return [{
        id: `${kind}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name,
        kind,
        country: textOrNull(value.country),
        lat,
        lng,
        status: textOrNull(value.congestion) ?? textOrNull(value.status),
        detail:
          textOrNull(value.volume) ??
          textOrNull(value.dwell_time) ??
          textOrNull(value.description),
      }];
    });
  };

  return [
    ...normalize(payload.ports, "port"),
    ...normalize(payload.chokepoints, "chokepoint"),
  ].slice(0, 100);
}

async function loadFresh(): Promise<RegionalOpenIntelResponse> {
  const results = await Promise.allSettled([
    fetchJson("/satellites"),
    fetchJson("/maritime"),
  ]);
  const warnings: string[] = [];
  let sourceTimestamp: string | null = null;

  const satellitePayload = results[0].status === "fulfilled" ? results[0].value : null;
  const maritimePayload = results[1].status === "fulfilled" ? results[1].value : null;

  if (results[0].status === "rejected") warnings.push("Orbital feed unavailable.");
  if (results[1].status === "rejected") warnings.push("Maritime reference feed unavailable.");

  for (const value of [satellitePayload, maritimePayload]) {
    if (isRecord(value) && typeof value.timestamp === "string") {
      sourceTimestamp = value.timestamp;
      break;
    }
  }

  const orbitals = normalizeOrbitals(satellitePayload);
  const maritimePoints = normalizeMaritime(maritimePayload);
  const successfulFeeds = results.filter((result) => result.status === "fulfilled").length;

  return {
    generatedAt: new Date().toISOString(),
    source: "OSIRIS public API",
    sourceUrl: SOURCE_URL,
    sourceTimestamp,
    status:
      successfulFeeds === 2 ? "live" : successfulFeeds === 1 ? "partial" : "unavailable",
    orbitals,
    maritimePoints,
    warnings,
  };
}

export async function loadRegionalOpenIntel(): Promise<RegionalOpenIntelResponse> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.payload;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = loadFresh()
    .then((payload) => {
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload };
      return payload;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
