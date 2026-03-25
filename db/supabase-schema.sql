-- Supabase supplementary tables for V5.0.0
-- These tables store incoming news, feed health telemetry, and data snapshots.
-- The main PostgreSQL database remains the primary analytical store.

-- ── News Items ───────────────────────────────────────────────
-- Persists headlines and intelligence items from all news feeds.
-- Enables Supabase Realtime subscriptions for instant updates.
CREATE TABLE IF NOT EXISTS news_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source      TEXT NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT,
  url         TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  severity    TEXT,
  tags        TEXT[] DEFAULT '{}',
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_items_published ON news_items (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_source    ON news_items (source);

-- ── Feed Health ──────────────────────────────────────────────
-- Tracks the health of each upstream data feed for the refresh indicator.
CREATE TABLE IF NOT EXISTS feed_health (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id         TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('ok', 'error', 'timeout')),
  checked_at      TIMESTAMPTZ DEFAULT now(),
  response_time_ms INTEGER,
  message         TEXT
);

CREATE INDEX IF NOT EXISTS idx_feed_health_feed   ON feed_health (feed_id, checked_at DESC);

-- ── Data Snapshots ───────────────────────────────────────────
-- Stores periodic snapshots of fetched data for historical comparison.
CREATE TABLE IF NOT EXISTS data_snapshots (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id       TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  captured_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_feed ON data_snapshots (feed_id, captured_at DESC);

-- Enable Realtime on news_items for live subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE news_items;
