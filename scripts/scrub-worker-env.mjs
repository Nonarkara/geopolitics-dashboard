/**
 * Post-build hygiene: OpenNext bakes every .env.local value into
 * .open-next/cloudflare/next-env.mjs, which is uploaded to Cloudflare
 * inside the worker bundle. Server-side secrets belong in Worker
 * bindings (wrangler secret put), not in the artifact — and a baked
 * localhost DATABASE_URL would shadow the Hyperdrive path forever.
 *
 * This script blanks sensitive keys in the generated file. Public
 * NEXT_PUBLIC_* values stay unless they point at localhost / 127.0.0.1
 * (Localbase on the build machine). Those are rewritten from wrangler.jsonc
 * vars so the Worker does not ship the laptop's Postgres.
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = ".open-next/cloudflare/next-env.mjs";
const WRANGLER_CONFIG = "wrangler.jsonc";

const SCRUB_KEYS = new Set([
  "DATABASE_URL",
  "REDIS_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "ACLED_KEY",
  "ACLED_EMAIL",
  "ACLED_USERNAME",
  "ACLED_PASSWORD",
  "OPENSANCTIONS_API",
  "WARNELY_API",
  "TELEPORT_API",
  "REST_COUNTRIES_API",
  "CRON_SECRET",
  "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN",
  "DATA_DIR",
]);

function isLocalhostValue(value) {
  return typeof value === "string" && /localhost|127\.0\.0\.1/i.test(value);
}

function loadWranglerPublicVars() {
  try {
    const raw = readFileSync(WRANGLER_CONFIG, "utf8");
    const json = raw.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");
    const cfg = JSON.parse(json);
    return cfg.vars && typeof cfg.vars === "object" ? cfg.vars : {};
  } catch {
    return {};
  }
}

let src;
try {
  src = readFileSync(FILE, "utf8");
} catch {
  console.log(`[scrub-worker-env] ${FILE} not found — skipping`);
  process.exit(0);
}

const wranglerVars = loadWranglerPublicVars();
let scrubbedCount = 0;
const out = src.replace(
  /^export const (production|development) = (\{.*\});?\s*$/gm,
  (match, name, json) => {
    const obj = JSON.parse(json);
    for (const key of Object.keys(obj)) {
      if (SCRUB_KEYS.has(key) && obj[key]) {
        obj[key] = "";
        scrubbedCount += 1;
        continue;
      }
      if (isLocalhostValue(obj[key])) {
        const replacement = wranglerVars[key];
        obj[key] =
          typeof replacement === "string" &&
          replacement &&
          !isLocalhostValue(replacement)
            ? replacement
            : "";
        scrubbedCount += 1;
      }
    }
    return `export const ${name} = ${JSON.stringify(obj)};`;
  },
);

if (/localhost|127\.0\.0\.1/i.test(out)) {
  console.error(
    `[scrub-worker-env] leftover localhost value in ${FILE} — refusing to leave a laptop URL in the Worker bundle`,
  );
  process.exit(1);
}

writeFileSync(FILE, out);
console.log(`[scrub-worker-env] blanked ${scrubbedCount} secret value(s) in ${FILE}`);
