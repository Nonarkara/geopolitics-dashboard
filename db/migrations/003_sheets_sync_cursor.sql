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
