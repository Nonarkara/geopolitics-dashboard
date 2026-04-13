import { NextRequest } from "next/server.js";
import { getErrorMessage } from "../../../lib/errors";
import {
  logPlaybackSideEffectFailure,
  noStoreJson,
  PlaybackApiError,
  playbackErrorResponse,
  resolvePlaybackRequest,
} from "../../../lib/playback-api";
import { marketsRouteDeps } from "../../../lib/playback-route-deps";
import type { AseanGdpDatum, EconomicIndicator, MarketRadarResponse } from "../../../types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const playback = resolvePlaybackRequest(request.nextUrl.searchParams);

    if (playback.mode === "historical") {
      return noStoreJson(
        await marketsRouteDeps.loadHistoricalMarketRadar(playback.timeWindow),
      );
    }

    const capturedAt = new Date();
    let signals: EconomicIndicator[] = [];
    let aseanGdp: AseanGdpDatum[] = [];
    let generatedAt = capturedAt.toISOString();
    let liveSignalsLoaded = false;
    let liveMacroLoaded = false;
    const sources = new Set<string>();

    try {
      const indicators = await marketsRouteDeps.fetchReferenceEconomicIndicators();

      if (indicators.length > 0) {
        signals = indicators;
        liveSignalsLoaded = true;
        sources.add("ExchangeRate API (open.er-api.com)");
        sources.add("Binance BTCUSDT");
        void marketsRouteDeps.persistMarketIndicators(indicators, capturedAt).catch((error) => {
          logPlaybackSideEffectFailure("markets", "persistMarketIndicators", error, {
            mode: "live",
            generatedAt,
          });
        });
      }
    } catch (error) {
      console.error("Reference markets error:", getErrorMessage(error));
    }

    if (signals.length === 0) {
      const storedSignals = await marketsRouteDeps.loadStoredMarketIndicatorSnapshot();

      if (storedSignals?.data.length) {
        signals = storedSignals.data;
        if (!liveSignalsLoaded) {
          generatedAt = storedSignals.generatedAt ?? generatedAt;
        }
        sources.add("Postgres market history");
      }
    }

    try {
      const gdpSnapshot = await marketsRouteDeps.fetchAseanGdpSnapshot();

      if (gdpSnapshot.length > 0) {
        aseanGdp = gdpSnapshot;
        liveMacroLoaded = true;
        sources.add("World Bank WDI");
        void marketsRouteDeps.persistAseanGdpSnapshot(gdpSnapshot, capturedAt).catch((error) => {
          logPlaybackSideEffectFailure("markets", "persistAseanGdpSnapshot", error, {
            mode: "live",
            generatedAt,
          });
        });
      }
    } catch (error) {
      console.error("ASEAN GDP snapshot error:", getErrorMessage(error));
    }

    if (aseanGdp.length === 0) {
      const storedMacro = await marketsRouteDeps.loadLatestStoredAseanGdpSnapshotWithTimestamp();

      if (storedMacro?.data.length) {
        aseanGdp = storedMacro.data;
        if (!liveSignalsLoaded && !liveMacroLoaded) {
          generatedAt = storedMacro.generatedAt ?? generatedAt;
        }
        sources.add("Postgres macro history");
      }
    }

    if (signals.length === 0 && aseanGdp.length === 0) {
      throw new PlaybackApiError(
        "LIVE_DATA_UNAVAILABLE",
        "No live or stored market snapshots are available.",
      );
    }

    const payload: MarketRadarResponse = {
      generatedAt,
      data: signals,
      signals,
      aseanGdp,
      sources: Array.from(sources),
      mode: "live",
    };

    return noStoreJson(payload);
  } catch (error) {
    return playbackErrorResponse(error);
  }
}
