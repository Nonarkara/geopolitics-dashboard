-- 007 — natural key for non-OSM features
--
-- The `static_infrastructure` table's existing partial unique index
-- `static_infrastructure_kind_osm_uniq` covers (kind, osm_id) but only
-- WHERE osm_id IS NOT NULL. Features that don't have an OSM id (e.g.
-- the 9 Thai-Burma border refugee camps ingested from UNHCR data) all
-- land at NULL, and the unique index never matches — so re-running the
-- loader creates duplicate rows.
--
-- This migration:
--   1. Cleans up the duplicates the old loader left behind (deletes
--      older copies, keeps the most recent `updated_at` per group).
--   2. Adds a partial unique index on (kind, name) WHERE osm_id IS NULL,
--      giving non-OSM features their own natural key.
--
-- Idempotent: re-runs are no-ops.
--
-- After this migration:
--   - 9 refugee_camps rows (one per camp), not 36
--   - 703 dams rows (unchanged — every dam has an osm_id)
--   - subsequent loader runs are idempotent regardless of source

-- Step 1: dedup existing non-OSM rows. Keep the newest by updated_at.
-- Wrapped in DO so a missing column / future schema drift doesn't
-- abort the surrounding migration script.
DO $$
BEGIN
  DELETE FROM static_infrastructure a
  USING static_infrastructure b
  WHERE a.kind = b.kind
    AND a.name = b.name
    AND a.osm_id IS NULL
    AND b.osm_id IS NULL
    AND a.ctid <> b.ctid
    AND COALESCE(a.updated_at, a.created_at) < COALESCE(b.updated_at, b.created_at);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Step 2: add the partial unique index. Idempotent on re-run.
CREATE UNIQUE INDEX IF NOT EXISTS static_infrastructure_kind_name_uniq
  ON static_infrastructure (kind, name)
  WHERE osm_id IS NULL;
