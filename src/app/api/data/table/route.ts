export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import {
  isDataExplorerAuthorized,
  unauthorizedDataExplorerResponse,
} from "../../../../lib/data-explorer-auth";
import { buildDatabaseTablePreview } from "../../../../lib/database-browser";
import { getErrorMessage } from "../../../../lib/errors";
import { isDataExplorerEnabled } from "../../../../lib/feature-flags";

export async function GET(request: NextRequest) {
  if (!isDataExplorerEnabled()) {
    return NextResponse.json(
      { error: "Data explorer is disabled." },
      { status: 403 },
    );
  }

  if (!await isDataExplorerAuthorized(request)) {
    return unauthorizedDataExplorerResponse();
  }

  const table = request.nextUrl.searchParams.get("table");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 50;

  if (!table) {
    return NextResponse.json(
      { error: "A table query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const preview = await buildDatabaseTablePreview(table, limit);

    if (!preview) {
      return NextResponse.json(
        { error: `Unknown table: ${table}` },
        { status: 400 },
      );
    }

    return NextResponse.json(preview);
  } catch (error: unknown) {
    console.error("Database preview error:", getErrorMessage(error));
    return NextResponse.json(
      { error: "Unable to load database preview." },
      { status: 500 },
    );
  }
}
