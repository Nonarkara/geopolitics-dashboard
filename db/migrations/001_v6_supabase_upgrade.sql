-- ═══════════════════════════════════════════════════════════════════════════
-- V6.0 SUPABASE UPGRADE — Research-Grade Conflict Analysis Database
-- ═══════════════════════════════════════════════════════════════════════════
--
-- This migration transforms the geopolitics dashboard database into a
-- production-grade Supabase deployment optimized for long-term conflict
-- monitoring and longitudinal research.
--
-- Changes:
--   1. Custom ENUM types for constrained values
--   2. Full-text search via tsvector + GIN index on signal_archive
--   3. Materialized views for dashboard analytics
--   4. Database functions for escalation detection and trend analysis
--   5. Row-Level Security (RLS) policies for Supabase API access
--   6. Auto-update triggers for computed columns
--   7. Data retention and lifecycle management
--   8. Improved indexes for analytical query patterns
--
-- Run: psql $DATABASE_URL -f db/migrations/001_v6_supabase_upgrade.sql
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Extensions ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- trigram similarity for fuzzy search


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ENUM TYPES — Constrained vocabularies for data integrity
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE signal_type_enum AS ENUM (
    'news', 'incident', 'humanitarian', 'market', 'weather',
    'thermal', 'movement', 'osint', 'seismic', 'traffic',
    'disaster', 'commodity', 'political', 'diplomatic', 'military'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE severity_enum AS ENUM ('stable', 'watch', 'alert', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE feed_status_enum AS ENUM ('ok', 'error', 'timeout', 'degraded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE movement_type_enum AS ENUM (
    'refugee', 'asylum', 'returnee', 'idp', 'tourism',
    'trade', 'labor', 'transit', 'evacuation'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. FULL-TEXT SEARCH — tsvector column + auto-update trigger
-- ═══════════════════════════════════════════════════════════════════════════

-- Add tsvector column to signal_archive for full-text search
ALTER TABLE signal_archive
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing rows
UPDATE signal_archive
SET search_vector = to_tsvector('english',
  COALESCE(title, '') || ' ' ||
  COALESCE(summary, '') || ' ' ||
  COALESCE(region, '') || ' ' ||
  COALESCE(array_to_string(country_focus, ' '), '') || ' ' ||
  COALESCE(array_to_string(keywords, ' '), '')
)
WHERE search_vector IS NULL;

-- GIN index for fast full-text queries
CREATE INDEX IF NOT EXISTS signal_archive_search_idx
  ON signal_archive USING GIN (search_vector);

-- Trigram index on title for fuzzy/partial matching
CREATE INDEX IF NOT EXISTS signal_archive_title_trgm_idx
  ON signal_archive USING GIN (title gin_trgm_ops);

-- Auto-update trigger: keeps search_vector in sync on INSERT/UPDATE
CREATE OR REPLACE FUNCTION fn_signal_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.summary, '') || ' ' ||
    COALESCE(NEW.region, '') || ' ' ||
    COALESCE(array_to_string(NEW.country_focus, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.keywords, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_signal_search_vector ON signal_archive;
CREATE TRIGGER trg_signal_search_vector
  BEFORE INSERT OR UPDATE OF title, summary, region, country_focus, keywords
  ON signal_archive
  FOR EACH ROW
  EXECUTE FUNCTION fn_signal_search_vector_update();


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ADDITIONAL INDEXES — Optimized for analytical query patterns
-- ═══════════════════════════════════════════════════════════════════════════

-- Composite index for country-focused time-range queries
CREATE INDEX IF NOT EXISTS signal_archive_country_time_idx
  ON signal_archive USING GIN (country_focus) WHERE country_focus != '{}';

-- Covering index for the most common dashboard query pattern
CREATE INDEX IF NOT EXISTS signal_archive_region_type_date_idx
  ON signal_archive (region, signal_type, published_at DESC)
  WHERE region IS NOT NULL;

-- Events: composite for filtered map queries
CREATE INDEX IF NOT EXISTS events_type_date_idx
  ON events (event_type, event_date DESC);

-- Events: fatalities for severity filtering
CREATE INDEX IF NOT EXISTS events_fatalities_idx
  ON events (fatalities DESC) WHERE fatalities > 0;

-- Market data: indicator + date for time series
CREATE INDEX IF NOT EXISTS market_indicator_date_idx
  ON market_data (indicator, ref_date DESC);

-- Fire events: date + brightness for high-confidence hotspots
CREATE INDEX IF NOT EXISTS fire_events_date_brightness_idx
  ON fire_events (acq_date DESC, brightness DESC);

-- Signal daily summary: region + date for trend charts
CREATE INDEX IF NOT EXISTS signal_daily_summary_region_date_idx
  ON signal_daily_summary (region, summary_date DESC);

-- Air quality: location + time for longitudinal tracking
CREATE INDEX IF NOT EXISTS air_quality_location_time_idx
  ON air_quality_snapshots (location, observed_at DESC);

-- Visitor movements: deduplication and querying
CREATE UNIQUE INDEX IF NOT EXISTS visitor_movements_dedup_idx
  ON visitor_movements (crossing_point, movement_type, ref_date, source_provider);


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. MATERIALIZED VIEWS — Pre-computed analytics for dashboard performance
-- ═══════════════════════════════════════════════════════════════════════════

-- 4a. Monthly conflict summary by region — powers trend charts
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_conflict_monthly AS
SELECT
  date_trunc('month', published_at)::date AS month,
  COALESCE(region, 'general')            AS region,
  signal_type,
  COUNT(*)                                AS signal_count,
  COALESCE(SUM(fatalities), 0)            AS fatality_total,
  AVG(score)                              AS avg_score,
  AVG(CASE severity
    WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
    WHEN 'watch' THEN 2 WHEN 'stable' THEN 1
    ELSE NULL
  END)                                    AS avg_severity_numeric,
  COUNT(DISTINCT source_provider)         AS source_count,
  array_agg(DISTINCT source_provider)     AS sources
FROM signal_archive
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2, 3
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_conflict_monthly_uq
  ON mv_conflict_monthly (month, region, signal_type);

-- 4b. Rolling escalation baselines — 7-day and 30-day per region
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_escalation_baseline AS
SELECT
  COALESCE(region, 'general') AS region,
  -- 7-day baseline
  COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days')
    / 7.0                                              AS avg_daily_7d,
  AVG(CASE severity
    WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
    WHEN 'watch' THEN 2 WHEN 'stable' THEN 1
    ELSE NULL
  END) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days')
                                                        AS avg_severity_7d,
  COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days')
                                                        AS total_7d,
  COALESCE(SUM(fatalities) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days'), 0)
                                                        AS fatalities_7d,
  -- 30-day baseline
  COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '30 days')
    / 30.0                                              AS avg_daily_30d,
  AVG(CASE severity
    WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
    WHEN 'watch' THEN 2 WHEN 'stable' THEN 1
    ELSE NULL
  END) FILTER (WHERE published_at >= NOW() - INTERVAL '30 days')
                                                        AS avg_severity_30d,
  COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '30 days')
                                                        AS total_30d,
  COALESCE(SUM(fatalities) FILTER (WHERE published_at >= NOW() - INTERVAL '30 days'), 0)
                                                        AS fatalities_30d,
  -- 90-day baseline (quarterly context)
  COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '90 days')
    / 90.0                                              AS avg_daily_90d,
  NOW()                                                  AS computed_at
FROM signal_archive
WHERE published_at >= NOW() - INTERVAL '90 days'
GROUP BY 1
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_escalation_baseline_uq
  ON mv_escalation_baseline (region);

-- 4c. Country risk profile — latest composite risk score per country
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_country_risk_profile AS
WITH country_signals AS (
  SELECT
    unnest(country_focus) AS country_code,
    signal_type,
    severity,
    score,
    fatalities,
    published_at
  FROM signal_archive
  WHERE published_at >= NOW() - INTERVAL '30 days'
    AND country_focus != '{}'
),
risk_calc AS (
  SELECT
    country_code,
    COUNT(*)                                   AS signal_count_30d,
    COALESCE(SUM(fatalities), 0)               AS fatalities_30d,
    AVG(CASE severity
      WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
      WHEN 'watch' THEN 2 WHEN 'stable' THEN 1
      ELSE NULL
    END)                                       AS avg_severity,
    COUNT(*) FILTER (WHERE severity IN ('alert', 'critical'))
                                               AS high_severity_count,
    COUNT(DISTINCT signal_type)                AS signal_diversity,
    AVG(score)                                 AS avg_score,
    MAX(published_at)                          AS latest_signal_at
  FROM country_signals
  GROUP BY country_code
)
SELECT
  country_code,
  signal_count_30d,
  fatalities_30d,
  ROUND(avg_severity::numeric, 2)             AS avg_severity,
  high_severity_count,
  signal_diversity,
  ROUND(avg_score::numeric, 2)                AS avg_score,
  -- Composite risk index: weighted combination
  ROUND((
    COALESCE(avg_severity, 1) * 0.3 +
    LEAST(signal_count_30d / 50.0, 3) * 0.2 +
    LEAST(fatalities_30d / 10.0, 3) * 0.3 +
    LEAST(high_severity_count / 10.0, 3) * 0.2
  )::numeric, 2)                               AS composite_risk_index,
  latest_signal_at,
  NOW()                                        AS computed_at
FROM risk_calc
ORDER BY composite_risk_index DESC
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_country_risk_uq
  ON mv_country_risk_profile (country_code);

-- 4d. Source reliability tracker — how often each source delivers
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_source_reliability AS
SELECT
  source_provider,
  COUNT(*)                                                AS total_signals,
  COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days')
                                                          AS signals_7d,
  COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '30 days')
                                                          AS signals_30d,
  MIN(published_at)                                       AS first_seen,
  MAX(published_at)                                       AS last_seen,
  COUNT(DISTINCT signal_type)                             AS signal_type_coverage,
  COUNT(DISTINCT region) FILTER (WHERE region IS NOT NULL)
                                                          AS region_coverage,
  ROUND(AVG(score)::numeric, 2)                           AS avg_score,
  NOW()                                                    AS computed_at
FROM signal_archive
GROUP BY source_provider
ORDER BY signals_30d DESC
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_source_reliability_uq
  ON mv_source_reliability (source_provider);


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. DATABASE FUNCTIONS — Move complex analytics server-side
-- ═══════════════════════════════════════════════════════════════════════════

-- 5a. Full-text search across signal archive
CREATE OR REPLACE FUNCTION fn_search_signals(
  search_query TEXT,
  p_region TEXT DEFAULT NULL,
  p_signal_type TEXT DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  external_id TEXT,
  signal_type TEXT,
  source_provider TEXT,
  title TEXT,
  summary TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  region TEXT,
  country_focus TEXT[],
  severity TEXT,
  score REAL,
  fatalities INTEGER,
  keywords TEXT[],
  rank REAL,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH matches AS (
    SELECT
      sa.id, sa.external_id, sa.signal_type, sa.source_provider,
      sa.title, sa.summary, sa.url, sa.published_at, sa.region,
      sa.country_focus, sa.severity, sa.score, sa.fatalities, sa.keywords,
      ts_rank_cd(sa.search_vector, websearch_to_tsquery('english', search_query)) AS rank
    FROM signal_archive sa
    WHERE sa.search_vector @@ websearch_to_tsquery('english', search_query)
      AND (p_region IS NULL OR sa.region = p_region)
      AND (p_signal_type IS NULL OR sa.signal_type = p_signal_type)
      AND (p_from IS NULL OR sa.published_at >= p_from)
      AND (p_to IS NULL OR sa.published_at <= p_to)
  )
  SELECT m.*, COUNT(*) OVER() AS total_count
  FROM matches m
  ORDER BY m.rank DESC, m.published_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5b. Escalation detection — compare today vs rolling baseline
CREATE OR REPLACE FUNCTION fn_detect_escalation(
  p_region TEXT,
  p_threshold_ratio REAL DEFAULT 2.0,
  p_severity_delta REAL DEFAULT 0.5
)
RETURNS TABLE (
  region TEXT,
  today_count BIGINT,
  baseline_avg_7d NUMERIC,
  ratio NUMERIC,
  today_severity_avg NUMERIC,
  baseline_severity_avg NUMERIC,
  severity_delta NUMERIC,
  escalated BOOLEAN,
  reason TEXT,
  top_signals JSONB
) AS $$
DECLARE
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
  v_week_ago TIMESTAMPTZ := v_today_start - INTERVAL '7 days';
BEGIN
  RETURN QUERY
  WITH today_stats AS (
    SELECT
      COUNT(*) AS cnt,
      AVG(CASE s.severity
        WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
        WHEN 'watch' THEN 2 WHEN 'stable' THEN 1 ELSE NULL
      END) AS avg_sev
    FROM signal_archive s
    WHERE s.region = p_region AND s.published_at >= v_today_start
  ),
  baseline_stats AS (
    SELECT
      COUNT(*) / 7.0 AS avg_daily,
      AVG(CASE s.severity
        WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
        WHEN 'watch' THEN 2 WHEN 'stable' THEN 1 ELSE NULL
      END) AS avg_sev
    FROM signal_archive s
    WHERE s.region = p_region
      AND s.published_at >= v_week_ago
      AND s.published_at < v_today_start
  ),
  top AS (
    SELECT jsonb_agg(jsonb_build_object(
      'title', s.title,
      'source_provider', s.source_provider,
      'severity', s.severity,
      'published_at', s.published_at
    ) ORDER BY s.published_at DESC) AS signals
    FROM (
      SELECT s.title, s.source_provider, s.severity, s.published_at
      FROM signal_archive s
      WHERE s.region = p_region AND s.published_at >= v_today_start
      ORDER BY s.published_at DESC
      LIMIT 5
    ) s
  )
  SELECT
    p_region,
    t.cnt,
    ROUND(b.avg_daily, 1),
    ROUND(CASE WHEN b.avg_daily > 0 THEN t.cnt / b.avg_daily ELSE CASE WHEN t.cnt > 0 THEN 999 ELSE 0 END END, 1),
    ROUND(t.avg_sev, 2),
    ROUND(b.avg_sev, 2),
    ROUND(t.avg_sev - b.avg_sev, 2),
    (CASE WHEN b.avg_daily > 0 THEN t.cnt / b.avg_daily ELSE CASE WHEN t.cnt > 0 THEN 999 ELSE 0 END END) >= p_threshold_ratio
      OR (t.avg_sev IS NOT NULL AND b.avg_sev IS NOT NULL AND (t.avg_sev - b.avg_sev) > p_severity_delta),
    CASE
      WHEN (CASE WHEN b.avg_daily > 0 THEN t.cnt / b.avg_daily ELSE CASE WHEN t.cnt > 0 THEN 999 ELSE 0 END END) >= p_threshold_ratio
        AND (t.avg_sev IS NOT NULL AND b.avg_sev IS NOT NULL AND (t.avg_sev - b.avg_sev) > p_severity_delta)
      THEN 'Count ' || t.cnt || ' is ' || ROUND(CASE WHEN b.avg_daily > 0 THEN t.cnt / b.avg_daily ELSE 999 END, 1) || 'x baseline; severity jumped ' || ROUND(t.avg_sev - b.avg_sev, 2) || ' points'
      WHEN (CASE WHEN b.avg_daily > 0 THEN t.cnt / b.avg_daily ELSE CASE WHEN t.cnt > 0 THEN 999 ELSE 0 END END) >= p_threshold_ratio
      THEN 'Count ' || t.cnt || ' is ' || ROUND(CASE WHEN b.avg_daily > 0 THEN t.cnt / b.avg_daily ELSE 999 END, 1) || 'x the 7-day average (' || ROUND(b.avg_daily, 1) || ')'
      WHEN t.avg_sev IS NOT NULL AND b.avg_sev IS NOT NULL AND (t.avg_sev - b.avg_sev) > p_severity_delta
      THEN 'Severity jumped ' || ROUND(t.avg_sev - b.avg_sev, 2) || ' points above baseline'
      ELSE 'Within normal parameters'
    END,
    COALESCE(tp.signals, '[]'::jsonb)
  FROM today_stats t, baseline_stats b, top tp;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5c. Conflict correlation — find co-occurring signals across regions
CREATE OR REPLACE FUNCTION fn_signal_correlation(
  p_days INT DEFAULT 30,
  p_min_overlap INT DEFAULT 3
)
RETURNS TABLE (
  region_a TEXT,
  region_b TEXT,
  co_occurring_days INT,
  shared_signal_types TEXT[],
  correlation_strength NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_activity AS (
    SELECT
      COALESCE(region, 'general') AS region,
      published_at::date AS day,
      array_agg(DISTINCT signal_type) AS types,
      COUNT(*) AS cnt
    FROM signal_archive
    WHERE published_at >= NOW() - (p_days || ' days')::interval
    GROUP BY 1, 2
  )
  SELECT
    a.region AS region_a,
    b.region AS region_b,
    COUNT(*)::INT AS co_occurring_days,
    array_agg(DISTINCT unnest_type) AS shared_signal_types,
    ROUND(COUNT(*)::numeric / p_days, 2) AS correlation_strength
  FROM daily_activity a
  JOIN daily_activity b ON a.day = b.day AND a.region < b.region
  CROSS JOIN LATERAL unnest(a.types) AS unnest_type
  WHERE unnest_type = ANY(b.types)
  GROUP BY a.region, b.region
  HAVING COUNT(*) >= p_min_overlap
  ORDER BY co_occurring_days DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5d. Refresh all materialized views — call from cron
CREATE OR REPLACE FUNCTION fn_refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conflict_monthly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_escalation_baseline;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_country_risk_profile;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_source_reliability;
END;
$$ LANGUAGE plpgsql;

-- 5e. Data freshness check — used by /api/status
CREATE OR REPLACE FUNCTION fn_data_freshness()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  latest_entry TIMESTAMPTZ,
  staleness_hours NUMERIC,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    SELECT 'signal_archive'::text, COUNT(*), MAX(published_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(published_at)) / 3600, 1),
      CASE WHEN MAX(published_at) >= NOW() - INTERVAL '6 hours' THEN 'fresh'
           WHEN MAX(published_at) >= NOW() - INTERVAL '24 hours' THEN 'stale'
           ELSE 'cold' END
    FROM signal_archive
    UNION ALL
    SELECT 'events'::text, COUNT(*), MAX(created_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(created_at)) / 3600, 1),
      CASE WHEN MAX(created_at) >= NOW() - INTERVAL '24 hours' THEN 'fresh'
           WHEN MAX(created_at) >= NOW() - INTERVAL '72 hours' THEN 'stale'
           ELSE 'cold' END
    FROM events
    UNION ALL
    SELECT 'fire_events'::text, COUNT(*), MAX(created_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(created_at)) / 3600, 1),
      CASE WHEN MAX(created_at) >= NOW() - INTERVAL '24 hours' THEN 'fresh'
           WHEN MAX(created_at) >= NOW() - INTERVAL '48 hours' THEN 'stale'
           ELSE 'cold' END
    FROM fire_events
    UNION ALL
    SELECT 'market_data'::text, COUNT(*), MAX(created_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(created_at)) / 3600, 1),
      CASE WHEN MAX(created_at) >= NOW() - INTERVAL '24 hours' THEN 'fresh'
           WHEN MAX(created_at) >= NOW() - INTERVAL '48 hours' THEN 'stale'
           ELSE 'cold' END
    FROM market_data
    UNION ALL
    SELECT 'air_quality_snapshots'::text, COUNT(*), MAX(created_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(created_at)) / 3600, 1),
      CASE WHEN MAX(created_at) >= NOW() - INTERVAL '12 hours' THEN 'fresh'
           WHEN MAX(created_at) >= NOW() - INTERVAL '24 hours' THEN 'stale'
           ELSE 'cold' END
    FROM air_quality_snapshots
    UNION ALL
    SELECT 'signal_daily_summary'::text, COUNT(*), MAX(created_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(created_at)) / 3600, 1),
      CASE WHEN MAX(created_at) >= NOW() - INTERVAL '36 hours' THEN 'fresh'
           WHEN MAX(created_at) >= NOW() - INTERVAL '72 hours' THEN 'stale'
           ELSE 'cold' END
    FROM signal_daily_summary
  ) AS freshness
  ORDER BY staleness_hours DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. ROW-LEVEL SECURITY — Secure Supabase API access
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables (Supabase requires this for API security)
ALTER TABLE signal_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE rainfall_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE population_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_country_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_items_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_package_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_source_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access (anon key can read all data — this is a public dashboard)
CREATE POLICY IF NOT EXISTS "Public read: signal_archive"
  ON signal_archive FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: signal_daily_summary"
  ON signal_daily_summary FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: events"
  ON events FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: fire_events"
  ON fire_events FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: market_data"
  ON market_data FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: rainfall_data"
  ON rainfall_data FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: air_quality_snapshots"
  ON air_quality_snapshots FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: population_movements"
  ON population_movements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: macro_country_snapshots"
  ON macro_country_snapshots FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: country_economic_indicators"
  ON country_economic_indicators FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: intelligence_items_cache"
  ON intelligence_items_cache FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: intelligence_package_snapshots"
  ON intelligence_package_snapshots FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: intelligence_source_health"
  ON intelligence_source_health FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: visitor_movements"
  ON visitor_movements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: news_items"
  ON news_items FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: feed_health"
  ON feed_health FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read: data_snapshots"
  ON data_snapshots FOR SELECT USING (true);

-- Write access restricted to service_role only (ingestion uses service key)
CREATE POLICY IF NOT EXISTS "Service write: signal_archive"
  ON signal_archive FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: signal_archive"
  ON signal_archive FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: events"
  ON events FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: events"
  ON events FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: fire_events"
  ON fire_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: market_data"
  ON market_data FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: market_data"
  ON market_data FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: news_items"
  ON news_items FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: news_items"
  ON news_items FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: signal_daily_summary"
  ON signal_daily_summary FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: signal_daily_summary"
  ON signal_daily_summary FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: feed_health"
  ON feed_health FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: air_quality_snapshots"
  ON air_quality_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: rainfall_data"
  ON rainfall_data FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: visitor_movements"
  ON visitor_movements FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: visitor_movements"
  ON visitor_movements FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: intelligence_items_cache"
  ON intelligence_items_cache FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: intelligence_items_cache"
  ON intelligence_items_cache FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: intelligence_package_snapshots"
  ON intelligence_package_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: intelligence_package_snapshots"
  ON intelligence_package_snapshots FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: intelligence_source_health"
  ON intelligence_source_health FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: intelligence_source_health"
  ON intelligence_source_health FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: population_movements"
  ON population_movements FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: population_movements"
  ON population_movements FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: macro_country_snapshots"
  ON macro_country_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: macro_country_snapshots"
  ON macro_country_snapshots FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: country_economic_indicators"
  ON country_economic_indicators FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service update: country_economic_indicators"
  ON country_economic_indicators FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service write: data_snapshots"
  ON data_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. AUTO-UPDATE TRIGGERS — Consistent timestamps and computed fields
-- ═══════════════════════════════════════════════════════════════════════════

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at columns
DROP TRIGGER IF EXISTS trg_intelligence_items_updated ON intelligence_items_cache;
CREATE TRIGGER trg_intelligence_items_updated
  BEFORE UPDATE ON intelligence_items_cache
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_intelligence_package_updated ON intelligence_package_snapshots;
CREATE TRIGGER trg_intelligence_package_updated
  BEFORE UPDATE ON intelligence_package_snapshots
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. DATA LIFECYCLE — Retention policies and archival
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to clean up operational caches (keep research data forever)
CREATE OR REPLACE FUNCTION fn_cleanup_caches(p_days_to_keep INT DEFAULT 90)
RETURNS TABLE (
  table_cleaned TEXT,
  rows_deleted BIGINT
) AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := NOW() - (p_days_to_keep || ' days')::interval;
  v_count BIGINT;
BEGIN
  -- Intelligence caches: keep 90 days (research data is in signal_archive)
  DELETE FROM intelligence_items_cache WHERE updated_at < v_cutoff;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  table_cleaned := 'intelligence_items_cache';
  rows_deleted := v_count;
  RETURN NEXT;

  DELETE FROM intelligence_package_snapshots WHERE updated_at < v_cutoff;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  table_cleaned := 'intelligence_package_snapshots';
  rows_deleted := v_count;
  RETURN NEXT;

  -- Feed health: keep 30 days
  DELETE FROM feed_health WHERE checked_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  table_cleaned := 'feed_health';
  rows_deleted := v_count;
  RETURN NEXT;

  -- Data snapshots: keep 60 days
  DELETE FROM data_snapshots WHERE captured_at < NOW() - INTERVAL '60 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  table_cleaned := 'data_snapshots';
  rows_deleted := v_count;
  RETURN NEXT;

  -- Intelligence source health: keep latest per source only
  DELETE FROM intelligence_source_health h
  WHERE h.id NOT IN (
    SELECT DISTINCT ON (source_id) id
    FROM intelligence_source_health
    ORDER BY source_id, checked_at DESC
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  table_cleaned := 'intelligence_source_health';
  rows_deleted := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════════════
-- 9. SUPABASE REALTIME — Enable live subscriptions
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable Realtime on key tables for live dashboard updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE signal_archive;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE news_items;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE feed_health;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE intelligence_source_health;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. INITIAL REFRESH — Populate materialized views
-- ═══════════════════════════════════════════════════════════════════════════

-- First population uses non-concurrent refresh (required for empty views)
REFRESH MATERIALIZED VIEW mv_conflict_monthly;
REFRESH MATERIALIZED VIEW mv_escalation_baseline;
REFRESH MATERIALIZED VIEW mv_country_risk_profile;
REFRESH MATERIALIZED VIEW mv_source_reliability;


COMMIT;
