import { NextRequest } from "next/server";
import {
  runCronJobRequest,
  runMaintenanceCronRequest,
} from "../../../../lib/cron-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const results: { job: string; ok: boolean; error?: string }[] = [];

  // Run daily-summary via standard cron handler
  try {
    const response = await runCronJobRequest(request, "daily-summary");
    results.push({ job: "daily-summary", ok: response.status < 300 });
  } catch (err) {
    results.push({
      job: "daily-summary",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Run maintenance-cleanup via its dedicated handler
  try {
    const response = await runMaintenanceCronRequest(request);
    results.push({ job: "maintenance-cleanup", ok: response.status < 300 });
  } catch (err) {
    results.push({
      job: "maintenance-cleanup",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
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
