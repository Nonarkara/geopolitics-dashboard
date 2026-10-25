import {
  buildBorderNews,
  buildBorderTicker,
  loadBorderIncidents,
  loadBorderOsint,
} from "./border-osint";
import {
  loadHistoricalBorderNews,
  loadHistoricalBorderTicker,
  loadHistoricalMarketRadar,
} from "./border-history";
import {
  loadLatestStoredAseanGdpSnapshotWithTimestamp,
  loadStoredMarketIndicatorSnapshot,
  persistAseanGdpSnapshot,
  persistMarketIndicators,
} from "./history-store";
import { archiveSignalBatch } from "./signal-archive";
import { logFeedHealth, upsertNewsItem } from "./supabase";
import { loadThailandEconomics } from "./thailand-monitor";
import { isDatabaseConfigured, query } from "./db";
import {
  fetchAseanGdpSnapshot,
  fetchReferenceEconomicIndicators,
} from "./reference-data";

export const borderNewsRouteDeps = {
  loadHistoricalBorderNews,
  loadBorderIncidents,
  loadThailandEconomics,
  loadBorderOsint,
  buildBorderNews,
  upsertNewsItem,
  archiveSignalBatch,
  logFeedHealth,
};

export const borderTickerRouteDeps = {
  loadHistoricalBorderTicker,
  loadBorderIncidents,
  loadThailandEconomics,
  loadBorderOsint,
  buildBorderTicker,
  archiveSignalBatch,
};

export const marketsRouteDeps = {
  loadHistoricalMarketRadar,
  fetchReferenceEconomicIndicators,
  fetchAseanGdpSnapshot,
  persistMarketIndicators,
  persistAseanGdpSnapshot,
  loadStoredMarketIndicatorSnapshot,
  loadLatestStoredAseanGdpSnapshotWithTimestamp,
};

export const sparklineRouteDeps = {
  query,
  isDatabaseConfigured: () => isDatabaseConfigured,
};
