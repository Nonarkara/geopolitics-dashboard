import { NextResponse } from "next/server";
import { constantTimeTokenMatch, readBearerToken } from "./request-auth";

function getConfiguredToken() {
  const token = process.env.DATA_EXPLORER_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

export function isDataExplorerAuthConfigured() {
  return getConfiguredToken() !== null;
}

export async function isDataExplorerAuthorized(request: Request): Promise<boolean> {
  const expectedToken = getConfiguredToken();
  if (!expectedToken) return false;

  const token = readBearerToken(request);
  return token ? constantTimeTokenMatch(expectedToken, token) : false;
}

export function unauthorizedDataExplorerResponse() {
  return NextResponse.json(
    { error: "Unauthorized." },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Bearer realm="data-explorer"',
      },
    },
  );
}
