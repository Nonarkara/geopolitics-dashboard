-- Static infrastructure layers (dams, datacenters, cables, etc.)
-- Generic table so each layer type from ingestion/data/static/*.geojson
-- can be ingested through the same loader and queried through the same
-- /api/infrastructure route.
--
-- Geometry is generic (Polygon | MultiPolygon | Point | LineString) so
-- a single geom column covers all layer types. We discriminate via `kind`.
-- `properties` carries the raw OSM tags so callers can show local-language
-- names, plant:output:electricity, etc. without a column-per-tag explosion.
--
-- Idempotency: (kind, osm_id) is the natural key. osm_id can be NULL for
-- non-OSM sources, in which case (kind, name, country) is the fallback.
CREATE TABLE IF NOT EXISTS static_infrastructure (
    id              BIGSERIAL PRIMARY KEY,
    kind            TEXT NOT NULL,
    osm_id          BIGINT,
    name            TEXT NOT NULL,
    country         TEXT,
    properties      JSONB NOT NULL DEFAULT '{}'::jsonb,
    geom            GEOMETRY(Geometry, 4326) NOT NULL,
    source          TEXT NOT NULL,
    source_license  TEXT NOT NULL,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS static_infrastructure_kind_geom_idx
    ON static_infrastructure USING GIST (geom)
    WHERE kind IS NOT NULL;

CREATE INDEX IF NOT EXISTS static_infrastructure_kind_idx
    ON static_infrastructure (kind);

-- The natural key: same (kind, osm_id) should not be inserted twice. NULL
-- osm_id rows are excluded from the unique constraint via the WHERE.
CREATE UNIQUE INDEX IF NOT EXISTS static_infrastructure_kind_osm_uniq
    ON static_infrastructure (kind, osm_id)
    WHERE osm_id IS NOT NULL;

-- Bbox filter is the only hot read path (the /api/infrastructure route
-- requires a bbox). GIST index on geom already covers it.
