import { NextResponse } from "next/server";
import {
  isDataExplorerAuthorized,
  unauthorizedDataExplorerResponse,
} from "../../../../lib/data-explorer-auth";
import { buildDatabaseCatalog } from "../../../../lib/database-browser";
import { getErrorMessage } from "../../../../lib/errors";
import { isDataExplorerEnabled } from "../../../../lib/feature-flags";

export async function GET(request: Request) {
  if (!isDataExplorerEnabled()) {
    return NextResponse.json(
      { error: "Data explorer is disabled." },
      { status: 403 },
    );
  }

  if (!isDataExplorerAuthorized(request)) {
    return unauthorizedDataExplorerResponse();
  }

  try {
    return NextResponse.json(await buildDatabaseCatalog());
  } catch (error: unknown) {
    console.error("Database catalog error:", getErrorMessage(error));
    return NextResponse.json(
      {
        databaseConfigured: false,
        generatedAt: new Date().toISOString(),
        totalRows: 0,
        tables: [],
      },
      { status: 200 },
    );
  }
}
