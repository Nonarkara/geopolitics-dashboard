import { NextRequest } from "next/server";
import { runCronJobRequest } from "../../../../lib/cron-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return runCronJobRequest(request, "movements-maritime");
}
