/**
 * Resolves a relative API path to an absolute URL.
 * In the browser, relative paths work fine. In static-export mode the API
 * routes don't exist, so callers fall back to mock data gracefully.
 */
export function resolveAppUrl(path: string): string {
  if (typeof window !== "undefined") {
    return path;
  }
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;
  return `${base}${path}`;
}
