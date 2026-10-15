/** Edge-compatible comparison for bearer tokens without early string equality. */
export async function constantTimeTokenMatch(
  expected: string,
  received: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const [expectedDigest, receivedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
    crypto.subtle.digest("SHA-256", encoder.encode(received)),
  ]);
  const expectedBytes = new Uint8Array(expectedDigest);
  const receivedBytes = new Uint8Array(receivedDigest);
  let difference = 0;

  for (let index = 0; index < expectedBytes.length; index += 1) {
    difference |= expectedBytes[index] ^ receivedBytes[index];
  }

  return difference === 0;
}

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")?.trim();
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match?.[1] ?? null;
}
