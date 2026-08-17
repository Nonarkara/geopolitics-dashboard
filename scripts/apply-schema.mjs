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

/** Schema files applied in order */
const SCHEMA_FILES = [
  path.join(ROOT_DIR, "db", "schema.sql"),
  path.join(ROOT_DIR, "db", "migrations", "001_v6_supabase_upgrade.sql"),
  path.join(ROOT_DIR, "db", "migrations", "002_holistic_conflict_model.sql"),
];

function loadDotEnvFile(filepath) {
  try {
    const content = readFileSync(filepath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, equalsIndex).trim();
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      let value = trimmed.slice(equalsIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch {
    // `.env` is optional here; rely on the environment if the file is absent.
  }
}

async function main() {
  loadDotEnvFile(ENV_PATH);
  loadDotEnvFile(ENV_LOCAL_PATH);

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required. Set it to your Supabase direct connection string."
    );
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    for (const schemaPath of SCHEMA_FILES) {
      const filename = path.relative(ROOT_DIR, schemaPath);
      try {
        const sql = await fs.readFile(schemaPath, "utf8");
        await client.query(sql);
        console.log(`Applied: ${filename}`);
      } catch (error) {
        console.error(
          `Failed: ${filename} — ${error instanceof Error ? error.message : String(error)}`
        );
        throw error;
      }
    }
    console.log("\nAll schema files applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    `Schema apply failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
