import { NextRequest } from "next/server";
import { runCronJobRequest } from "../../../../lib/cron-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

/**
 * Combined daily operations cron — replaces 2 separate Vercel cron jobs:
 *   daily-summary, maintenance-cleanup
 * Runs sequentially to stay within Vercel Hobby's 2 cron limit.
 */
export async function GET(request: NextRequest) {
  const jobs = ["daily-summary", "maintenance-cleanup"] as const;

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
