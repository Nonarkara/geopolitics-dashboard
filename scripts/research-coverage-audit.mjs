import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';

const origin = process.env.RESEARCH_AUDIT_URL ?? 'https://geo.nonarkara.org';
const output = process.argv[2];
const paths = ['/api/research/signals?limit=50', '/api/border/news', '/api/border/reliefweb', '/api/border/earthquakes'];
const observations = [];
for (const path of paths) {
  const retrievedAt = new Date().toISOString();
  try {
    const response = await fetch(origin + path, { signal: AbortSignal.timeout(45000) });
    const body = await response.text();
    const payload = JSON.parse(body);
    const rows = Array.isArray(payload) ? payload : payload.news ?? payload.data?.reports ?? payload.signals ?? [];
    observations.push({ path, retrievedAt, httpStatus: response.status,
      declaredSource: response.headers.get('x-data-source'), count: rows.length,
      generatedAt: payload.generatedAt ?? payload.data?.generatedAt ?? null,
      bodySha256: createHash('sha256').update(body).digest('hex'),
      records: rows.map(row => ({ id: row.id ?? row.external_id ?? null,
        title: row.title ?? row.place ?? null, date: row.publishedAt ?? row.date ?? row.time ?? null,
        url: row.sourceUrl ?? row.url ?? null, source: row.source ?? row.provider ?? null,
        dateKind: row.dateKind ?? null })),
    });
  } catch (error) { observations.push({ path, retrievedAt, error: error.name }); }
}
const status = await fetch(origin + '/api/status', { signal: AbortSignal.timeout(15000) }).then(r => r.json());
const audit = { schemaVersion: 1, kind: 'system-coverage-audit', capturedAt: new Date().toISOString(), origin,
  scope: 'One retrieval per listed dashboard endpoint. Not an exhaustive provider audit or an event census.',
  databaseState: status.services?.database ?? 'unknown', observations,
  limitations: ['Only returned metadata retained; no source documents independently verified by this capture.',
    'Response hashes fingerprint the original bodies, which may change on subsequent requests.',
    'Counts describe returned records, not independent events or complete coverage.'],
};
if (output) {
  mkdirSync(new URL('../public/research/', import.meta.url), { recursive: true });
  writeFileSync(output, JSON.stringify(audit, null, 2) + '\n');
  console.log(JSON.stringify({ output, capturedAt: audit.capturedAt, databaseState: audit.databaseState,
    observations: observations.map(({ path, httpStatus, count, error }) => ({ path, httpStatus, count, error })) }));
} else console.log(JSON.stringify(audit, null, 2));
