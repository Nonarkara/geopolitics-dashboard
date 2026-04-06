-- Extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Events Table (ACLED/RSS)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE,
    event_date DATE NOT NULL,
    event_type TEXT,
    sub_event_type TEXT,
    actor1 TEXT,
    actor2 TEXT,
    location TEXT,
    fatalities INTEGER DEFAULT 0,
    notes TEXT,
    severity_score FLOAT DEFAULT 0,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS events_geom_idx ON events USING GIST(geom);
CREATE INDEX IF NOT EXISTS events_date_idx ON events(event_date);

-- Market Data (HDX/Exchange Rates)
CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    category TEXT,
    indicator TEXT,
    value FLOAT NOT NULL,
    unit TEXT,
    province TEXT,
    source TEXT,
    ref_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS market_date_idx ON market_data(ref_date);
CREATE INDEX IF NOT EXISTS market_cat_idx ON market_data(category);

-- Fire Events (NASA FIRMS)
CREATE TABLE IF NOT EXISTS fire_events (
    id SERIAL PRIMARY KEY,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    brightness FLOAT,
    confidence TEXT,
    acq_date DATE NOT NULL,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (latitude, longitude, brightness, confidence, acq_date)
);

CREATE INDEX IF NOT EXISTS fire_events_date_idx ON fire_events(acq_date);
CREATE INDEX IF NOT EXISTS fire_events_geom_idx ON fire_events USING GIST(geom);

-- Rainfall Data (HDX HAPI)
CREATE TABLE IF NOT EXISTS rainfall_data (
    id SERIAL PRIMARY KEY,
    location TEXT NOT NULL,
    value FLOAT NOT NULL,
    unit TEXT,
    ref_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (location, ref_date, unit)
);

CREATE INDEX IF NOT EXISTS rainfall_date_idx ON rainfall_data(ref_date);

-- Population Movements / Refugees (HDX HAPI)
CREATE TABLE IF NOT EXISTS population_movements (
    id SERIAL PRIMARY KEY,
    origin_country TEXT NOT NULL,
    asylum_country TEXT NOT NULL,
    population_type TEXT NOT NULL,
    count INTEGER NOT NULL,
    ref_year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (origin_country, asylum_country, population_type, ref_year)
);

CREATE INDEX IF NOT EXISTS population_movements_year_idx ON population_movements(ref_year);

-- Environmental Proxies (VIIRS/Sentinel)
CREATE TABLE IF NOT EXISTS env_proxies (
    id SERIAL PRIMARY KEY,
    proxy_type TEXT,
    value FLOAT,
    location TEXT,
    geom GEOMETRY(Geometry, 4326),
    ref_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Air quality snapshots for longitudinal AQI / PM2.5 tracking
CREATE TABLE IF NOT EXISTS air_quality_snapshots (
    id SERIAL PRIMARY KEY,
    location TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    aqi INTEGER NOT NULL,
    pm25 FLOAT NOT NULL,
    category TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    source TEXT NOT NULL DEFAULT 'Open-Meteo Air Quality',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source, location, observed_at)
);

CREATE INDEX IF NOT EXISTS air_quality_location_idx ON air_quality_snapshots(location);
CREATE INDEX IF NOT EXISTS air_quality_observed_idx ON air_quality_snapshots(observed_at DESC);

-- Country-level macro snapshots for annual GDP comparisons
CREATE TABLE IF NOT EXISTS macro_country_snapshots (
    id SERIAL PRIMARY KEY,
    country_code TEXT NOT NULL,
    country TEXT NOT NULL,
    gdp_usd DOUBLE PRECISION NOT NULL,
    gdp_per_capita_usd DOUBLE PRECISION NOT NULL,
    gdp_year INTEGER NOT NULL,
    gdp_per_capita_year INTEGER NOT NULL,
    source TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (country_code, gdp_year, gdp_per_capita_year, source)
);

CREATE INDEX IF NOT EXISTS macro_country_code_idx ON macro_country_snapshots(country_code);
CREATE INDEX IF NOT EXISTS macro_country_captured_idx ON macro_country_snapshots(captured_at DESC);

-- Country-level indicator history for ASEAN sidebar profiles
CREATE TABLE IF NOT EXISTS country_economic_indicators (
    id SERIAL PRIMARY KEY,
    country_code TEXT NOT NULL,
    country TEXT NOT NULL,
    indicator_code TEXT NOT NULL,
    indicator_label TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit TEXT,
    ref_year INTEGER NOT NULL,
    source TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (country_code, indicator_code, ref_year, source)
);

CREATE INDEX IF NOT EXISTS country_economic_code_idx ON country_economic_indicators(country_code);
CREATE INDEX IF NOT EXISTS country_economic_indicator_idx ON country_economic_indicators(indicator_code);
CREATE INDEX IF NOT EXISTS country_economic_captured_idx ON country_economic_indicators(captured_at DESC);

-- Normalized intelligence items cache
CREATE TABLE IF NOT EXISTS intelligence_items_cache (
    id SERIAL PRIMARY KEY,
    item_id TEXT UNIQUE NOT NULL,
    package_id TEXT NOT NULL,
    source_label TEXT NOT NULL,
    source_url TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    url TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    severity TEXT NOT NULL,
    score FLOAT NOT NULL,
    kind TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS intelligence_items_package_idx ON intelligence_items_cache(package_id);
CREATE INDEX IF NOT EXISTS intelligence_items_published_idx ON intelligence_items_cache(published_at DESC);

-- Cached package snapshots
CREATE TABLE IF NOT EXISTS intelligence_package_snapshots (
    id SERIAL PRIMARY KEY,
    package_id TEXT UNIQUE NOT NULL,
    snapshot JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'live',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS intelligence_package_updated_idx ON intelligence_package_snapshots(updated_at DESC);

-- Source health and refresh state
CREATE TABLE IF NOT EXISTS intelligence_source_health (
    id SERIAL PRIMARY KEY,
    source_id TEXT UNIQUE NOT NULL,
    source_label TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL,
    checked_at TIMESTAMPTZ NOT NULL,
    response_time_ms INTEGER,
    message TEXT
);

CREATE INDEX IF NOT EXISTS intelligence_source_checked_idx ON intelligence_source_health(checked_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- V5.0 RESEARCH DATABASE — Capture All Signals for Trend Analysis
-- ═══════════════════════════════════════════════════════════════

-- Signal Archive: permanent store of every news article, intelligence signal,
-- OSINT report, humanitarian update, and environmental event. Nothing gets lost.
CREATE TABLE IF NOT EXISTS signal_archive (
    id              BIGSERIAL PRIMARY KEY,
    external_id     TEXT,
    signal_type     TEXT NOT NULL,
    source_provider TEXT NOT NULL,
    source_url      TEXT,
    title           TEXT NOT NULL,
    summary         TEXT,
    url             TEXT,
    published_at    TIMESTAMPTZ NOT NULL,
    ingested_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    region          TEXT,
    country_focus   TEXT[] DEFAULT '{}',
    severity        TEXT,
    score           REAL,
    fatalities      INTEGER,
    keywords        TEXT[] DEFAULT '{}',
    tags            JSONB DEFAULT '[]',
    payload         JSONB,
    geom            GEOMETRY(Point, 4326)
);

CREATE UNIQUE INDEX IF NOT EXISTS signal_archive_dedup
    ON signal_archive (source_provider, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS signal_archive_published ON signal_archive (published_at DESC);
CREATE INDEX IF NOT EXISTS signal_archive_region ON signal_archive (region, published_at DESC);
CREATE INDEX IF NOT EXISTS signal_archive_type ON signal_archive (signal_type, published_at DESC);
CREATE INDEX IF NOT EXISTS signal_archive_provider ON signal_archive (source_provider, published_at DESC);
CREATE INDEX IF NOT EXISTS signal_archive_geom ON signal_archive USING GIST (geom);
CREATE INDEX IF NOT EXISTS signal_archive_keywords ON signal_archive USING GIN (keywords);

-- Visitor Movements: border crossing, refugee flow, tourism, and trade traffic
CREATE TABLE IF NOT EXISTS visitor_movements (
    id              BIGSERIAL PRIMARY KEY,
    crossing_point  TEXT NOT NULL,
    region          TEXT NOT NULL,
    direction       TEXT,
    movement_type   TEXT NOT NULL,
    count           INTEGER,
    source_provider TEXT NOT NULL,
    ref_date        DATE NOT NULL,
    notes           TEXT,
    payload         JSONB,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS visitor_movements_crossing ON visitor_movements (crossing_point, ref_date DESC);
CREATE INDEX IF NOT EXISTS visitor_movements_region ON visitor_movements (region, ref_date DESC);
CREATE INDEX IF NOT EXISTS visitor_movements_type ON visitor_movements (movement_type, ref_date DESC);

-- Signal Daily Summary: pre-computed rollups for fast trend queries
CREATE TABLE IF NOT EXISTS signal_daily_summary (
    id              BIGSERIAL PRIMARY KEY,
    summary_date    DATE NOT NULL,
    region          TEXT NOT NULL,
    signal_type     TEXT NOT NULL,
    signal_count    INTEGER DEFAULT 0,
    avg_severity    REAL,
    top_keywords    TEXT[] DEFAULT '{}',
    fatality_total  INTEGER DEFAULT 0,
    source_breakdown JSONB,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS signal_daily_summary_uq
    ON signal_daily_summary (summary_date, region, signal_type);
CREATE INDEX IF NOT EXISTS signal_daily_summary_date ON signal_daily_summary (summary_date DESC);


-- ═══════════════════════════════════════════════════════════════
-- NEWS, FEED HEALTH & SNAPSHOTS (formerly in supabase-schema.sql)
-- ═══════════════════════════════════════════════════════════════

-- News Items — headlines from all news feeds (Realtime-enabled)
CREATE TABLE IF NOT EXISTS news_items (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source       TEXT NOT NULL,
    title        TEXT NOT NULL,
    summary      TEXT,
    url          TEXT NOT NULL UNIQUE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    severity     TEXT,
    tags         TEXT[] DEFAULT '{}',
    payload      JSONB,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS news_items_published_idx ON news_items (published_at DESC);
CREATE INDEX IF NOT EXISTS news_items_source_idx ON news_items (source);

-- Feed Health — upstream data feed health tracking
CREATE TABLE IF NOT EXISTS feed_health (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feed_id          TEXT NOT NULL,
    status           TEXT NOT NULL CHECK (status IN ('ok', 'error', 'timeout', 'degraded')),
    checked_at       TIMESTAMPTZ DEFAULT NOW(),
    response_time_ms INTEGER,
    message          TEXT
);

CREATE INDEX IF NOT EXISTS feed_health_feed_idx ON feed_health (feed_id, checked_at DESC);

-- Data Snapshots — periodic snapshots of fetched data for historical comparison
CREATE TABLE IF NOT EXISTS data_snapshots (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feed_id       TEXT NOT NULL,
    snapshot_data JSONB NOT NULL,
    captured_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS data_snapshots_feed_idx ON data_snapshots (feed_id, captured_at DESC);


-- ═══════════════════════════════════════════════════════════════
-- V6.1 NEW DATA SOURCES
-- ═══════════════════════════════════════════════════════════════

-- GDELT GKG Entities — named persons, organizations, themes, sentiment
CREATE TABLE IF NOT EXISTS gkg_entities (
    id              BIGSERIAL PRIMARY KEY,
    entity_type     TEXT NOT NULL,
    entity_name     TEXT NOT NULL,
    mention_count   INTEGER DEFAULT 1,
    avg_tone        REAL,
    source_count    INTEGER DEFAULT 1,
    first_seen      TIMESTAMPTZ NOT NULL,
    last_seen       TIMESTAMPTZ NOT NULL,
    sample_sources  TEXT[] DEFAULT '{}',
    ref_date        DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entity_type, entity_name, ref_date)
);

CREATE INDEX IF NOT EXISTS gkg_entities_type_idx ON gkg_entities (entity_type);
CREATE INDEX IF NOT EXISTS gkg_entities_ref_date_idx ON gkg_entities (ref_date DESC);
CREATE INDEX IF NOT EXISTS gkg_entities_mentions_idx ON gkg_entities (mention_count DESC);

-- Maritime Vessel Positions — AIS tracking via AISstream
CREATE TABLE IF NOT EXISTS vessel_positions (
    id              BIGSERIAL PRIMARY KEY,
    mmsi            TEXT NOT NULL,
    vessel_name     TEXT,
    ship_type       INTEGER,
    latitude        FLOAT NOT NULL,
    longitude       FLOAT NOT NULL,
    speed           REAL,
    course          REAL,
    heading         REAL,
    destination     TEXT,
    flag_country    TEXT,
    geom            GEOMETRY(Point, 4326),
    observed_at     TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (mmsi, observed_at)
);

CREATE INDEX IF NOT EXISTS vessel_positions_mmsi_idx ON vessel_positions (mmsi);
CREATE INDEX IF NOT EXISTS vessel_positions_observed_idx ON vessel_positions (observed_at DESC);
CREATE INDEX IF NOT EXISTS vessel_positions_geom_idx ON vessel_positions USING GIST (geom);

-- Google Sheets sync cursor — tracks incremental export progress
CREATE TABLE IF NOT EXISTS sheets_sync_cursor (
    id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    last_synced_at  TIMESTAMPTZ NOT NULL DEFAULT '2020-01-01T00:00:00Z',
    rows_synced     BIGINT DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sheets_sync_cursor (last_synced_at)
VALUES ('2020-01-01T00:00:00Z')
ON CONFLICT DO NOTHING;
