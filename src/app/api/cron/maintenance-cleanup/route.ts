import { NextRequest } from "next/server";
import { runMaintenanceCronRequest } from "../../../../lib/cron-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return runMaintenanceCronRequest(request);
}
