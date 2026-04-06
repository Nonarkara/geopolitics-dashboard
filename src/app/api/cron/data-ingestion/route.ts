import { NextRequest } from "next/server";
import { runCronJobRequest } from "../../../../lib/cron-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

/**
 * Combined data ingestion cron — replaces 4 separate Vercel cron jobs:
 *   conflict-intel, environment-thermal, markets-macro, movements-maritime
 * Runs sequentially to stay within Vercel Hobby's 2 cron limit.
 */
export async function GET(request: NextRequest) {
  const jobs = [
    "conflict-intel",
    "environment-thermal",
    "markets-macro",
    "movements-maritime",
  ] as const;

  const results: { job: string; ok: boolean; error?: string }[] = [];

  for (const jobId of jobs) {
    try {
      const response = await runCronJobRequest(request, jobId);
      const ok = response.status >= 200 && response.status < 300;
      results.push({ job: jobId, ok });
    } catch (err) {
      results.push({
        job: jobId,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const allOk = results.every((r) => r.ok);

  return Response.json(
    {
      combined: true,
      ok: allOk,
      jobs: results,
      completedAt: new Date().toISOString(),
    },
    { status: allOk ? 200 : 207 },
  );
}
