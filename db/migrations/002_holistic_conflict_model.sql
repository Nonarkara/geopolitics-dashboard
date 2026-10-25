-- ═══════════════════════════════════════════════════════════════════════════
-- V6.1 HOLISTIC CONFLICT MODEL — Actors, Phases, Humanitarian Impact
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Extends the research database with tables for long-term conflict
-- understanding: who is fighting, what phase the conflict is in,
-- humanitarian consequences, and multi-dimensional cross-correlation.
--
-- Depends on: db/schema.sql + db/migrations/001_v6_supabase_upgrade.sql
-- Run: psql $DATABASE_URL -f db/migrations/002_holistic_conflict_model.sql
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Extensions ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ENUM TYPES
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE conflict_phase_type AS ENUM (
    'escalation', 'de-escalation', 'ceasefire',
    'peace-talks', 'crisis', 'stable', 'active-combat',
    'humanitarian-emergency', 'post-conflict'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE actor_type_enum AS ENUM (
    'armed-group', 'state-military', 'political-party',
    'humanitarian-org', 'insurgent', 'militia',
    'criminal-network', 'peacekeeping', 'civilian-group',
    'media', 'foreign-government'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE relationship_type_enum AS ENUM (
    'allied', 'opposed', 'subordinate', 'neutral',
    'ceasefire', 'sponsor', 'splinter'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE displacement_type_enum AS ENUM (
    'refugee', 'idp', 'returnee', 'evacuation',
    'relocation', 'deportation'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE infrastructure_type_enum AS ENUM (
    'hospital', 'school', 'bridge', 'road', 'market',
    'water-supply', 'power', 'telecom', 'religious-site',
    'government-building', 'residential', 'agricultural'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE damage_level_enum AS ENUM (
    'destroyed', 'severe', 'moderate', 'minor', 'operational'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CONFLICT PHASES — Named periods of conflict evolution
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS conflict_phases (
    id              BIGSERIAL PRIMARY KEY,
    phase_name      TEXT NOT NULL,
    phase_type      conflict_phase_type NOT NULL,
    region          TEXT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,                          -- NULL = ongoing
    description     TEXT,
    trigger_event_id BIGINT REFERENCES signal_archive(id),
    severity_level  TEXT,                           -- stable/watch/alert/critical
    actors_involved TEXT[] DEFAULT '{}',
    signal_count    INTEGER DEFAULT 0,             -- computed: signals during this phase
    fatality_total  INTEGER DEFAULT 0,             -- computed: fatalities during this phase
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS conflict_phases_region_idx
  ON conflict_phases (region, start_date DESC);
CREATE INDEX IF NOT EXISTS conflict_phases_type_idx
  ON conflict_phases (phase_type, start_date DESC);
CREATE INDEX IF NOT EXISTS conflict_phases_active_idx
  ON conflict_phases (region) WHERE end_date IS NULL;

-- Auto-update trigger
DROP TRIGGER IF EXISTS trg_conflict_phases_updated ON conflict_phases;
CREATE TRIGGER trg_conflict_phases_updated
  BEFORE UPDATE ON conflict_phases
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ACTOR REGISTRY — Armed groups, political entities, humanitarian orgs
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS actors (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    aliases         TEXT[] DEFAULT '{}',
    actor_type      actor_type_enum NOT NULL,
    country_base    TEXT,                           -- ISO 2-letter code
    description     TEXT,
    active          BOOLEAN DEFAULT true,
    first_seen      DATE,
    last_seen       DATE,
    estimated_strength TEXT,                        -- e.g., "5,000-10,000"
    area_of_operations TEXT[] DEFAULT '{}',         -- region IDs
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS actors_type_idx ON actors (actor_type);
CREATE INDEX IF NOT EXISTS actors_country_idx ON actors (country_base);
CREATE INDEX IF NOT EXISTS actors_active_idx ON actors (active) WHERE active = true;
-- GIN index for searching actor aliases
CREATE INDEX IF NOT EXISTS actors_aliases_idx ON actors USING GIN (aliases);

DROP TRIGGER IF EXISTS trg_actors_updated ON actors;
CREATE TRIGGER trg_actors_updated
  BEFORE UPDATE ON actors
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ACTOR RELATIONSHIPS — Alliances, rivalries, command structures
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS actor_relationships (
    id                BIGSERIAL PRIMARY KEY,
    actor_a_id        BIGINT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    actor_b_id        BIGINT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    relationship_type relationship_type_enum NOT NULL,
    started_at        DATE,
    ended_at          DATE,                        -- NULL = current
    confidence        REAL DEFAULT 0.5,            -- 0-1 source confidence
    source_provider   TEXT,
    notes             TEXT,
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT actor_relationship_pair CHECK (actor_a_id < actor_b_id)
);

CREATE INDEX IF NOT EXISTS actor_rel_a_idx ON actor_relationships (actor_a_id);
CREATE INDEX IF NOT EXISTS actor_rel_b_idx ON actor_relationships (actor_b_id);
CREATE INDEX IF NOT EXISTS actor_rel_type_idx ON actor_relationships (relationship_type);
CREATE UNIQUE INDEX IF NOT EXISTS actor_rel_dedup_idx
  ON actor_relationships (actor_a_id, actor_b_id, relationship_type)
  WHERE ended_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. ACTOR-SIGNAL LINKS — Connect actors to events/signals
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS actor_signals (
    id              BIGSERIAL PRIMARY KEY,
    actor_id        BIGINT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    signal_id       BIGINT NOT NULL REFERENCES signal_archive(id) ON DELETE CASCADE,
    role            TEXT,                           -- e.g., 'perpetrator', 'target', 'mediator'
    confidence      REAL DEFAULT 0.5,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS actor_signals_actor_idx ON actor_signals (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS actor_signals_signal_idx ON actor_signals (signal_id);
CREATE UNIQUE INDEX IF NOT EXISTS actor_signals_dedup_idx
  ON actor_signals (actor_id, signal_id, role);


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. DISPLACEMENT EVENTS — Specific displacement incidents
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS displacement_events (
    id                  BIGSERIAL PRIMARY KEY,
    signal_id           BIGINT REFERENCES signal_archive(id),
    origin_location     TEXT,
    destination_location TEXT,
    origin_geom         GEOMETRY(Point, 4326),
    destination_geom    GEOMETRY(Point, 4326),
    population_count    INTEGER,
    displacement_type   displacement_type_enum NOT NULL,
    cause               TEXT,                      -- e.g., 'armed-conflict', 'natural-disaster'
    region              TEXT,
    country_origin      TEXT,                      -- ISO code
    country_destination TEXT,                      -- ISO code
    ref_date            DATE NOT NULL,
    source_provider     TEXT NOT NULL,
    notes               TEXT,
    payload             JSONB,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS displacement_region_idx
  ON displacement_events (region, ref_date DESC);
CREATE INDEX IF NOT EXISTS displacement_type_idx
  ON displacement_events (displacement_type, ref_date DESC);
CREATE INDEX IF NOT EXISTS displacement_origin_geom_idx
  ON displacement_events USING GIST (origin_geom);
CREATE INDEX IF NOT EXISTS displacement_dest_geom_idx
  ON displacement_events USING GIST (destination_geom);
CREATE INDEX IF NOT EXISTS displacement_date_idx
  ON displacement_events (ref_date DESC);


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. INFRASTRUCTURE IMPACTS — Damage to critical infrastructure
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS infrastructure_impacts (
    id                  BIGSERIAL PRIMARY KEY,
    signal_id           BIGINT REFERENCES signal_archive(id),
    infrastructure_type infrastructure_type_enum NOT NULL,
    damage_level        damage_level_enum NOT NULL,
    location            TEXT,
    geom                GEOMETRY(Point, 4326),
    region              TEXT,
    country_code        TEXT,
    ref_date            DATE NOT NULL,
    source_provider     TEXT NOT NULL,
    verified            BOOLEAN DEFAULT false,
    notes               TEXT,
    payload             JSONB,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS infra_region_idx
  ON infrastructure_impacts (region, ref_date DESC);
CREATE INDEX IF NOT EXISTS infra_type_idx
  ON infrastructure_impacts (infrastructure_type, damage_level);
CREATE INDEX IF NOT EXISTS infra_geom_idx
  ON infrastructure_impacts USING GIST (geom);
CREATE INDEX IF NOT EXISTS infra_date_idx
  ON infrastructure_impacts (ref_date DESC);


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. ENV PROXIES — Add missing indexes
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS env_proxies_geom_idx ON env_proxies USING GIST (geom);
CREATE INDEX IF NOT EXISTS env_proxies_date_idx ON env_proxies (ref_date DESC);
CREATE INDEX IF NOT EXISTS env_proxies_type_idx ON env_proxies (proxy_type, ref_date DESC);


-- ═══════════════════════════════════════════════════════════════════════════
-- 9. MATERIALIZED VIEWS — Holistic analytics
-- ═══════════════════════════════════════════════════════════════════════════

-- 9a. Humanitarian Dashboard — 30-day displacement + casualties + infrastructure
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_humanitarian_dashboard AS
SELECT
  COALESCE(region, 'general') AS region,
  -- Displacement
  (SELECT COALESCE(SUM(population_count), 0)
   FROM displacement_events de
   WHERE de.region = COALESCE(sa_agg.region, 'general')
     AND de.ref_date >= CURRENT_DATE - 30
  ) AS displaced_30d,
  (SELECT COUNT(*)
   FROM displacement_events de
   WHERE de.region = COALESCE(sa_agg.region, 'general')
     AND de.ref_date >= CURRENT_DATE - 30
  ) AS displacement_events_30d,
  -- Casualties from signals
  COALESCE(SUM(fatalities), 0) AS fatalities_30d,
  COUNT(*) FILTER (WHERE severity IN ('alert', 'critical')) AS high_severity_30d,
  -- Infrastructure damage
  (SELECT COUNT(*)
   FROM infrastructure_impacts ii
   WHERE ii.region = COALESCE(sa_agg.region, 'general')
     AND ii.ref_date >= CURRENT_DATE - 30
  ) AS infra_impacts_30d,
  (SELECT COUNT(*)
   FROM infrastructure_impacts ii
   WHERE ii.region = COALESCE(sa_agg.region, 'general')
     AND ii.ref_date >= CURRENT_DATE - 30
     AND ii.damage_level IN ('destroyed', 'severe')
  ) AS severe_infra_damage_30d,
  -- Signal activity
  COUNT(*) AS total_signals_30d,
  COUNT(DISTINCT signal_type) AS signal_diversity,
  NOW() AS computed_at
FROM signal_archive sa_agg
WHERE published_at >= NOW() - INTERVAL '30 days'
GROUP BY COALESCE(region, 'general')
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_humanitarian_dashboard_uq
  ON mv_humanitarian_dashboard (region);

-- 9b. Actor Activity — Actor-level signal trends (30-day)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_actor_activity AS
SELECT
  a.id AS actor_id,
  a.name AS actor_name,
  a.actor_type,
  a.country_base,
  COUNT(acs.id) AS signal_count_30d,
  COUNT(acs.id) FILTER (
    WHERE sa.severity IN ('alert', 'critical')
  ) AS high_severity_count,
  COALESCE(SUM(sa.fatalities), 0) AS fatalities_linked_30d,
  array_agg(DISTINCT sa.region) FILTER (WHERE sa.region IS NOT NULL) AS active_regions,
  array_agg(DISTINCT sa.signal_type) AS signal_types,
  MAX(sa.published_at) AS latest_activity,
  NOW() AS computed_at
FROM actors a
LEFT JOIN actor_signals acs ON acs.actor_id = a.id
  AND acs.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN signal_archive sa ON sa.id = acs.signal_id
WHERE a.active = true
GROUP BY a.id, a.name, a.actor_type, a.country_base
ORDER BY signal_count_30d DESC
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_actor_activity_uq
  ON mv_actor_activity (actor_id);

-- 9c. Conflict Timeline — Phase transitions with signal density overlay
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_conflict_timeline AS
SELECT
  cp.id AS phase_id,
  cp.phase_name,
  cp.phase_type,
  cp.region,
  cp.start_date,
  cp.end_date,
  cp.severity_level,
  cp.actors_involved,
  -- Signal density during this phase
  (SELECT COUNT(*)
   FROM signal_archive sa
   WHERE sa.region = cp.region
     AND sa.published_at::date >= cp.start_date
     AND (cp.end_date IS NULL OR sa.published_at::date <= cp.end_date)
  ) AS signal_count,
  (SELECT COALESCE(SUM(sa.fatalities), 0)
   FROM signal_archive sa
   WHERE sa.region = cp.region
     AND sa.published_at::date >= cp.start_date
     AND (cp.end_date IS NULL OR sa.published_at::date <= cp.end_date)
  ) AS fatality_total,
  (SELECT AVG(CASE sa.severity
     WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
     WHEN 'watch' THEN 2 WHEN 'stable' THEN 1 ELSE NULL
   END)
   FROM signal_archive sa
   WHERE sa.region = cp.region
     AND sa.published_at::date >= cp.start_date
     AND (cp.end_date IS NULL OR sa.published_at::date <= cp.end_date)
  ) AS avg_severity_numeric,
  -- Duration in days
  COALESCE(cp.end_date, CURRENT_DATE) - cp.start_date AS duration_days,
  NOW() AS computed_at
FROM conflict_phases cp
ORDER BY cp.region, cp.start_date DESC
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_conflict_timeline_uq
  ON mv_conflict_timeline (phase_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. DATABASE FUNCTIONS — Holistic analytics
-- ═══════════════════════════════════════════════════════════════════════════

-- 10a. Cross-correlate two signal types over time
CREATE OR REPLACE FUNCTION fn_cross_correlate(
  p_days INT DEFAULT 30,
  p_type_a TEXT DEFAULT 'incident',
  p_type_b TEXT DEFAULT 'thermal'
)
RETURNS TABLE (
  day DATE,
  region TEXT,
  type_a_count BIGINT,
  type_b_count BIGINT,
  type_a_severity NUMERIC,
  type_b_severity NUMERIC,
  co_occurrence BOOLEAN,
  fatalities_a BIGINT,
  fatalities_b BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH daily AS (
    SELECT
      published_at::date AS d,
      COALESCE(sa.region, 'general') AS r,
      sa.signal_type AS st,
      COUNT(*) AS cnt,
      AVG(CASE sa.severity
        WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
        WHEN 'watch' THEN 2 WHEN 'stable' THEN 1 ELSE NULL
      END) AS avg_sev,
      COALESCE(SUM(sa.fatalities), 0) AS fat
    FROM signal_archive sa
    WHERE sa.published_at >= NOW() - (p_days || ' days')::interval
      AND sa.signal_type IN (p_type_a, p_type_b)
    GROUP BY 1, 2, 3
  )
  SELECT
    COALESCE(a.d, b.d) AS day,
    COALESCE(a.r, b.r) AS region,
    COALESCE(a.cnt, 0) AS type_a_count,
    COALESCE(b.cnt, 0) AS type_b_count,
    ROUND(a.avg_sev, 2) AS type_a_severity,
    ROUND(b.avg_sev, 2) AS type_b_severity,
    (a.cnt IS NOT NULL AND b.cnt IS NOT NULL) AS co_occurrence,
    COALESCE(a.fat, 0) AS fatalities_a,
    COALESCE(b.fat, 0) AS fatalities_b
  FROM (SELECT * FROM daily WHERE st = p_type_a) a
  FULL OUTER JOIN (SELECT * FROM daily WHERE st = p_type_b) b
    ON a.d = b.d AND a.r = b.r
  ORDER BY day DESC, region;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10b. Humanitarian summary for a region
CREATE OR REPLACE FUNCTION fn_humanitarian_summary(
  p_region TEXT DEFAULT NULL,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  region TEXT,
  total_displaced BIGINT,
  displacement_events BIGINT,
  fatalities BIGINT,
  infra_destroyed BIGINT,
  infra_damaged BIGINT,
  high_severity_signals BIGINT,
  total_signals BIGINT,
  active_actors BIGINT,
  current_phase TEXT,
  current_phase_type conflict_phase_type
) AS $$
BEGIN
  RETURN QUERY
  WITH regions AS (
    SELECT DISTINCT COALESCE(sa.region, 'general') AS r
    FROM signal_archive sa
    WHERE (p_region IS NULL OR sa.region = p_region)
      AND sa.published_at >= NOW() - (p_days || ' days')::interval
  )
  SELECT
    r.r AS region,
    COALESCE((
      SELECT SUM(de.population_count)
      FROM displacement_events de
      WHERE de.region = r.r AND de.ref_date >= CURRENT_DATE - p_days
    ), 0) AS total_displaced,
    COALESCE((
      SELECT COUNT(*)
      FROM displacement_events de
      WHERE de.region = r.r AND de.ref_date >= CURRENT_DATE - p_days
    ), 0) AS displacement_events,
    COALESCE((
      SELECT SUM(sa.fatalities)
      FROM signal_archive sa
      WHERE COALESCE(sa.region, 'general') = r.r
        AND sa.published_at >= NOW() - (p_days || ' days')::interval
    ), 0) AS fatalities,
    COALESCE((
      SELECT COUNT(*)
      FROM infrastructure_impacts ii
      WHERE ii.region = r.r AND ii.ref_date >= CURRENT_DATE - p_days
        AND ii.damage_level = 'destroyed'
    ), 0) AS infra_destroyed,
    COALESCE((
      SELECT COUNT(*)
      FROM infrastructure_impacts ii
      WHERE ii.region = r.r AND ii.ref_date >= CURRENT_DATE - p_days
        AND ii.damage_level IN ('severe', 'moderate')
    ), 0) AS infra_damaged,
    COALESCE((
      SELECT COUNT(*)
      FROM signal_archive sa
      WHERE COALESCE(sa.region, 'general') = r.r
        AND sa.published_at >= NOW() - (p_days || ' days')::interval
        AND sa.severity IN ('alert', 'critical')
    ), 0) AS high_severity_signals,
    COALESCE((
      SELECT COUNT(*)
      FROM signal_archive sa
      WHERE COALESCE(sa.region, 'general') = r.r
        AND sa.published_at >= NOW() - (p_days || ' days')::interval
    ), 0) AS total_signals,
    COALESCE((
      SELECT COUNT(DISTINCT a.id)
      FROM actors a
      WHERE a.active = true AND r.r = ANY(a.area_of_operations)
    ), 0) AS active_actors,
    (SELECT cp.phase_name
     FROM conflict_phases cp
     WHERE cp.region = r.r AND cp.end_date IS NULL
     ORDER BY cp.start_date DESC LIMIT 1
    ) AS current_phase,
    (SELECT cp.phase_type
     FROM conflict_phases cp
     WHERE cp.region = r.r AND cp.end_date IS NULL
     ORDER BY cp.start_date DESC LIMIT 1
    ) AS current_phase_type
  FROM regions r
  ORDER BY total_signals DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10c. Suggest conflict phase based on signal patterns
CREATE OR REPLACE FUNCTION fn_conflict_phase_suggest(
  p_region TEXT
)
RETURNS TABLE (
  region TEXT,
  suggested_phase conflict_phase_type,
  confidence NUMERIC,
  reasoning TEXT,
  signal_count_7d BIGINT,
  avg_severity_7d NUMERIC,
  fatalities_7d BIGINT,
  trend_vs_30d TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats_7d AS (
    SELECT
      COUNT(*) AS cnt,
      AVG(CASE severity
        WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
        WHEN 'watch' THEN 2 WHEN 'stable' THEN 1 ELSE NULL
      END) AS avg_sev,
      COALESCE(SUM(fatalities), 0) AS fat
    FROM signal_archive
    WHERE region = p_region
      AND published_at >= NOW() - INTERVAL '7 days'
  ),
  stats_30d AS (
    SELECT
      COUNT(*) / 4.0 AS weekly_avg_cnt,
      AVG(CASE severity
        WHEN 'critical' THEN 4 WHEN 'alert' THEN 3
        WHEN 'watch' THEN 2 WHEN 'stable' THEN 1 ELSE NULL
      END) AS avg_sev,
      COALESCE(SUM(fatalities), 0) / 4.0 AS weekly_avg_fat
    FROM signal_archive
    WHERE region = p_region
      AND published_at >= NOW() - INTERVAL '30 days'
  )
  SELECT
    p_region,
    CASE
      WHEN s7.avg_sev >= 3.5 AND s7.fat > 10 THEN 'crisis'::conflict_phase_type
      WHEN s7.avg_sev >= 3.0 OR s7.fat > 5 THEN 'active-combat'::conflict_phase_type
      WHEN s7.avg_sev >= 2.5 AND s7.cnt > s30.weekly_avg_cnt * 1.5 THEN 'escalation'::conflict_phase_type
      WHEN s7.avg_sev <= 1.5 AND s7.cnt < s30.weekly_avg_cnt * 0.5 THEN 'de-escalation'::conflict_phase_type
      WHEN s7.avg_sev <= 1.2 AND s7.fat = 0 THEN 'stable'::conflict_phase_type
      ELSE 'escalation'::conflict_phase_type
    END AS suggested_phase,
    CASE
      WHEN s7.cnt >= 10 THEN 0.8
      WHEN s7.cnt >= 5 THEN 0.6
      ELSE 0.4
    END::NUMERIC AS confidence,
    'Based on ' || s7.cnt || ' signals (7d), avg severity ' ||
      ROUND(COALESCE(s7.avg_sev, 0), 1) || ', ' || s7.fat || ' fatalities' ||
      CASE
        WHEN s7.cnt > s30.weekly_avg_cnt * 1.5 THEN '; RISING vs 30d baseline'
        WHEN s7.cnt < s30.weekly_avg_cnt * 0.5 THEN '; DECLINING vs 30d baseline'
        ELSE '; STEADY vs 30d baseline'
      END AS reasoning,
    s7.cnt,
    ROUND(COALESCE(s7.avg_sev, 0), 2),
    s7.fat,
    CASE
      WHEN s7.cnt > s30.weekly_avg_cnt * 1.5 THEN 'rising'
      WHEN s7.cnt < s30.weekly_avg_cnt * 0.5 THEN 'declining'
      ELSE 'steady'
    END AS trend_vs_30d
  FROM stats_7d s7, stats_30d s30;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10d. Update fn_refresh_materialized_views to include new views
CREATE OR REPLACE FUNCTION fn_refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conflict_monthly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_escalation_baseline;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_country_risk_profile;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_source_reliability;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_humanitarian_dashboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_actor_activity;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conflict_timeline;
END;
$$ LANGUAGE plpgsql;

-- 10e. Update fn_data_freshness to include new tables
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
    UNION ALL
    SELECT 'conflict_phases'::text, COUNT(*), MAX(created_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(created_at)) / 3600, 1),
      CASE WHEN COUNT(*) = 0 THEN 'empty'
           ELSE 'reference' END
    FROM conflict_phases
    UNION ALL
    SELECT 'actors'::text, COUNT(*), MAX(created_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(created_at)) / 3600, 1),
      CASE WHEN COUNT(*) = 0 THEN 'empty'
           ELSE 'reference' END
    FROM actors
    UNION ALL
    SELECT 'displacement_events'::text, COUNT(*), MAX(created_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(created_at)) / 3600, 1),
      CASE WHEN MAX(created_at) >= NOW() - INTERVAL '48 hours' THEN 'fresh'
           WHEN MAX(created_at) >= NOW() - INTERVAL '7 days' THEN 'stale'
           ELSE 'cold' END
    FROM displacement_events
    UNION ALL
    SELECT 'infrastructure_impacts'::text, COUNT(*), MAX(created_at),
      ROUND(EXTRACT(EPOCH FROM NOW() - MAX(created_at)) / 3600, 1),
      CASE WHEN MAX(created_at) >= NOW() - INTERVAL '48 hours' THEN 'fresh'
           WHEN MAX(created_at) >= NOW() - INTERVAL '7 days' THEN 'stale'
           ELSE 'cold' END
    FROM infrastructure_impacts
  ) AS freshness
  ORDER BY staleness_hours DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;


-- ═══════════════════════════════════════════════════════════════════════════
-- 11. ROW-LEVEL SECURITY — New tables
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE conflict_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE displacement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_impacts ENABLE ROW LEVEL SECURITY;

-- Public read
DO $$ BEGIN
  CREATE POLICY "Public read: conflict_phases"
    ON conflict_phases FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Public read: actors"
    ON actors FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Public read: actor_relationships"
    ON actor_relationships FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Public read: actor_signals"
    ON actor_signals FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Public read: displacement_events"
    ON displacement_events FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Public read: infrastructure_impacts"
    ON infrastructure_impacts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service-role write
DO $$ BEGIN
  CREATE POLICY "Service write: conflict_phases"
    ON conflict_phases FOR INSERT WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service update: conflict_phases"
    ON conflict_phases FOR UPDATE USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service write: actors"
    ON actors FOR INSERT WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service update: actors"
    ON actors FOR UPDATE USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service write: actor_relationships"
    ON actor_relationships FOR INSERT WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service update: actor_relationships"
    ON actor_relationships FOR UPDATE USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service write: actor_signals"
    ON actor_signals FOR INSERT WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service write: displacement_events"
    ON displacement_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service update: displacement_events"
    ON displacement_events FOR UPDATE USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service write: infrastructure_impacts"
    ON infrastructure_impacts FOR INSERT WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service update: infrastructure_impacts"
    ON infrastructure_impacts FOR UPDATE USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 12. SUPABASE REALTIME — New tables
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE displacement_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conflict_phases;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 13. INITIAL REFRESH — Populate new materialized views
-- ═══════════════════════════════════════════════════════════════════════════

REFRESH MATERIALIZED VIEW mv_humanitarian_dashboard;
REFRESH MATERIALIZED VIEW mv_actor_activity;
REFRESH MATERIALIZED VIEW mv_conflict_timeline;


COMMIT;
