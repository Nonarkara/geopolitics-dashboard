-- ============================================================
-- V8 Long-Term Recording Schema
-- Captures every data signal the dashboard renders into
-- append-only snapshot tables for trend analysis.
--
-- Apply via Supabase SQL Editor:
--   https://supabase.com/dashboard/project/<YOUR_PROJECT>/sql/new
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

-- ── NEWS ITEMS (dedup by source id, keep all versions over time) ──
CREATE TABLE IF NOT EXISTS v8_news_snapshots (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    news_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    source TEXT,
    source_url TEXT,
    tag TEXT,
    published_at TIMESTAMPTZ,
    raw JSONB,
    UNIQUE (news_id, captured_at)
);
CREATE INDEX IF NOT EXISTS v8_news_captured_idx ON v8_news_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS v8_news_newsid_idx ON v8_news_snapshots(news_id);

-- ── INCIDENTS (snapshot every capture window; dedup per capture_at) ──
CREATE TABLE IF NOT EXISTS v8_incident_snapshots (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    incident_id TEXT NOT NULL,
    title TEXT,
    event_type TEXT,
    location TEXT,
    fatalities INTEGER DEFAULT 0,
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    event_date TIMESTAMPTZ,
    notes TEXT,
    raw JSONB,
    UNIQUE (incident_id, captured_at)
);
CREATE INDEX IF NOT EXISTS v8_incident_captured_idx ON v8_incident_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS v8_incident_eventdate_idx ON v8_incident_snapshots(event_date DESC);
CREATE INDEX IF NOT EXISTS v8_incident_id_idx ON v8_incident_snapshots(incident_id);

-- ── FIRE COUNTS (rollup — one row per capture with total + by-region counts) ──
CREATE TABLE IF NOT EXISTS v8_fire_rollups (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_count INTEGER NOT NULL,
    in_thailand_bbox INTEGER,
    myanmar_border INTEGER,
    cambodia_border INTEGER,
    malaysia_border INTEGER,
    max_brightness DOUBLE PRECISION,
    avg_brightness DOUBLE PRECISION,
    sample JSONB
);
CREATE INDEX IF NOT EXISTS v8_fire_captured_idx ON v8_fire_rollups(captured_at DESC);

-- ── FX / MARKETS (one row per label per capture) ──
CREATE TABLE IF NOT EXISTS v8_fx_snapshots (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    label TEXT NOT NULL,
    value DOUBLE PRECISION,
    change DOUBLE PRECISION,
    up BOOLEAN,
    category TEXT,
    source TEXT
);
CREATE INDEX IF NOT EXISTS v8_fx_captured_idx ON v8_fx_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS v8_fx_label_idx ON v8_fx_snapshots(label, captured_at DESC);

-- ── REFUGEE CORRIDOR FLOWS (one row per corridor per capture) ──
CREATE TABLE IF NOT EXISTS v8_refugee_snapshots (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_lng DOUBLE PRECISION,
    source_lat DOUBLE PRECISION,
    target_lng DOUBLE PRECISION,
    target_lat DOUBLE PRECISION,
    count INTEGER,
    label TEXT
);
CREATE INDEX IF NOT EXISTS v8_refugee_captured_idx ON v8_refugee_snapshots(captured_at DESC);

-- ── BORDER POSTURE BRIEF (entire brief captured as JSON + per-area row) ──
CREATE TABLE IF NOT EXISTS v8_posture_snapshots (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    overall_posture TEXT,
    overall_score INTEGER,
    headline TEXT,
    summary TEXT,
    raw JSONB
);
CREATE INDEX IF NOT EXISTS v8_posture_captured_idx ON v8_posture_snapshots(captured_at DESC);

CREATE TABLE IF NOT EXISTS v8_area_snapshots (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area_id TEXT NOT NULL,
    label TEXT,
    posture TEXT,
    score INTEGER,
    incident_count INTEGER,
    fatality_count INTEGER,
    verified_cameras INTEGER,
    candidate_cameras INTEGER,
    summary TEXT,
    raw JSONB
);
CREATE INDEX IF NOT EXISTS v8_area_captured_idx ON v8_area_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS v8_area_id_idx ON v8_area_snapshots(area_id, captured_at DESC);

-- ── CAMERA FEEDS STATUS (one row per camera per capture) ──
CREATE TABLE IF NOT EXISTS v8_camera_snapshots (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    camera_id TEXT NOT NULL,
    label TEXT,
    location TEXT,
    status TEXT,
    verified BOOLEAN,
    image_url TEXT,
    raw JSONB
);
CREATE INDEX IF NOT EXISTS v8_camera_captured_idx ON v8_camera_snapshots(captured_at DESC);

-- ── INGESTION RUN LOG (one row per cron invocation) ──
CREATE TABLE IF NOT EXISTS v8_ingest_runs (
    pk BIGSERIAL PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    success BOOLEAN,
    rows_written JSONB,
    errors JSONB,
    trigger TEXT
);
CREATE INDEX IF NOT EXISTS v8_ingest_started_idx ON v8_ingest_runs(started_at DESC);

-- ── GENERIC RAW CAPTURE (future-proofing — drop any payload here) ──
CREATE TABLE IF NOT EXISTS v8_raw_captures (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_key TEXT NOT NULL,
    endpoint TEXT,
    payload JSONB
);
CREATE INDEX IF NOT EXISTS v8_raw_source_idx ON v8_raw_captures(source_key, captured_at DESC);

-- ── RLS: allow anon reads (so the dashboard can read history), service-role writes only ──
ALTER TABLE v8_news_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_incident_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_fire_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_fx_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_refugee_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_posture_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_area_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_camera_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_ingest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_raw_captures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Read policies (anonymous + authenticated can read)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_news_snapshots' AND policyname = 'v8_news_read') THEN
    CREATE POLICY v8_news_read ON v8_news_snapshots FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_incident_snapshots' AND policyname = 'v8_incident_read') THEN
    CREATE POLICY v8_incident_read ON v8_incident_snapshots FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_fire_rollups' AND policyname = 'v8_fire_read') THEN
    CREATE POLICY v8_fire_read ON v8_fire_rollups FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_fx_snapshots' AND policyname = 'v8_fx_read') THEN
    CREATE POLICY v8_fx_read ON v8_fx_snapshots FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_refugee_snapshots' AND policyname = 'v8_refugee_read') THEN
    CREATE POLICY v8_refugee_read ON v8_refugee_snapshots FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_posture_snapshots' AND policyname = 'v8_posture_read') THEN
    CREATE POLICY v8_posture_read ON v8_posture_snapshots FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_area_snapshots' AND policyname = 'v8_area_read') THEN
    CREATE POLICY v8_area_read ON v8_area_snapshots FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_camera_snapshots' AND policyname = 'v8_camera_read') THEN
    CREATE POLICY v8_camera_read ON v8_camera_snapshots FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_ingest_runs' AND policyname = 'v8_ingest_read') THEN
    CREATE POLICY v8_ingest_read ON v8_ingest_runs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_raw_captures' AND policyname = 'v8_raw_read') THEN
    CREATE POLICY v8_raw_read ON v8_raw_captures FOR SELECT USING (true);
  END IF;
END $$;

-- Note: writes are via service_role key (bypasses RLS by design)
-- so no INSERT policies are needed for public.
