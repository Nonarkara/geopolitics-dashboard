import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function getConfiguredToken() {
  const token = process.env.DATA_EXPLORER_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

function constantTimeMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function isDataExplorerAuthConfigured() {
  return getConfiguredToken() !== null;
}

export function isDataExplorerAuthorized(request: Request) {
  const expectedToken = getConfiguredToken();
  if (!expectedToken) {
    return true;
  }

  const header = request.headers.get("authorization");
  if (!header) {
    return false;
  }

  const [scheme, token] = header.split(/\s+/, 2);
  if (scheme !== "Bearer" || !token) {
    return false;
  }

  return constantTimeMatch(expectedToken, token);
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
