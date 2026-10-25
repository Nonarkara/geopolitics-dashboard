/**
 * Apply database migrations in order.
 *
 * Runs all SQL files in db/migrations/ that haven't been applied yet,
 * tracked via a schema_migrations table.
 *
 * Usage:
 *   node scripts/apply-migrations.mjs           # apply pending migrations
 *   node scripts/apply-migrations.mjs --status   # show migration status
 *   node scripts/apply-migrations.mjs --force 001  # re-apply a specific migration
 */

import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env");
const ENV_LOCAL_PATH = path.join(ROOT_DIR, ".env.local");
const MIGRATIONS_DIR = path.join(ROOT_DIR, "db", "migrations");

function loadDotEnvFile(filepath) {
  try {
    const content = readFileSync(filepath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch { /* .env is optional */ }
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum TEXT
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    `SELECT version, filename, applied_at FROM schema_migrations ORDER BY version`
  );
  return new Map(result.rows.map(r => [r.version, r]));
}

async function getMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  return entries
    .filter(f => f.endsWith(".sql"))
    .sort()
    .map(f => ({
      filename: f,
      version: f.replace(/\.sql$/, ""),
      path: path.join(MIGRATIONS_DIR, f),
    }));
}

function simpleChecksum(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
  }
  return hash.toString(16);
}

async function main() {
  loadDotEnvFile(ENV_PATH);
  loadDotEnvFile(ENV_LOCAL_PATH);

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const showStatus = process.argv.includes("--status");
  const forceIdx = process.argv.indexOf("--force");
  const forceVersion = forceIdx !== -1 ? process.argv[forceIdx + 1] : null;

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const files = await getMigrationFiles();

    if (showStatus) {
      console.log("\n  Migration Status\n  ─────────────────────────────────────");
      for (const file of files) {
        const entry = applied.get(file.version);
        const status = entry
          ? `applied ${new Date(entry.applied_at).toISOString().slice(0, 16)}`
          : "pending";
        console.log(`  ${status === "pending" ? "○" : "●"} ${file.filename}  (${status})`);
      }
      if (files.length === 0) console.log("  No migration files found.");
      console.log();
      return;
    }

    const pending = files.filter(f =>
      forceVersion
        ? f.version.includes(forceVersion)
        : !applied.has(f.version)
    );

    if (pending.length === 0) {
      console.log("All migrations are up to date.");
      return;
    }

    for (const migration of pending) {
      console.log(`Applying ${migration.filename}...`);
      const sql = await fs.readFile(migration.path, "utf8");
      const checksum = simpleChecksum(sql);

      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (version, filename, checksum)
           VALUES ($1, $2, $3)
           ON CONFLICT (version) DO UPDATE SET
             applied_at = NOW(),
             checksum = EXCLUDED.checksum`,
          [migration.version, migration.filename, checksum]
        );
        console.log(`  ✓ ${migration.filename} applied successfully`);
      } catch (err) {
        console.error(`  ✗ ${migration.filename} failed: ${err.message}`);
        throw err;
      }
    }

    console.log(`\n${pending.length} migration(s) applied successfully.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
