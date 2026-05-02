import { NextResponse } from "next/server";

function getConfiguredToken() {
  const token = process.env.DATA_EXPLORER_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

/** Constant-time string comparison using Web Crypto (edge-compatible). */
async function constantTimeMatch(expected: string, received: string): Promise<boolean> {
  const enc = new TextEncoder();
  const a = enc.encode(expected);
  const b = enc.encode(received);
  if (a.length !== b.length) return false;
  // HMAC-SHA256 both sides with the same key → compare digests in constant time
  const key = await crypto.subtle.importKey("raw", a, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const [sig1, sig2] = await Promise.all([
    crypto.subtle.sign("HMAC", key, a),
    crypto.subtle.sign("HMAC", key, b),
  ]);
  const v1 = new Uint8Array(sig1);
  const v2 = new Uint8Array(sig2);
  let diff = 0;
  for (let i = 0; i < v1.length; i++) diff |= v1[i] ^ v2[i];
  return diff === 0;
}

export function isDataExplorerAuthConfigured() {
  return getConfiguredToken() !== null;
}

export async function isDataExplorerAuthorized(request: Request): Promise<boolean> {
  const expectedToken = getConfiguredToken();
  if (!expectedToken) return true;

  const header = request.headers.get("authorization");
  if (!header) return false;

  const [scheme, token] = header.split(/\s+/, 2);
  if (scheme !== "Bearer" || !token) return false;

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
