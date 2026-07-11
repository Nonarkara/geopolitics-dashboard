
import { buildRuntimeStatusPayload } from "../../../lib/runtime-status";

export async function GET() {
  return Response.json(await buildRuntimeStatusPayload());
}
