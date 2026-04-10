/**
 * Detect if the dashboard is running as a static GitHub Pages export.
 * In static mode, API routes don't exist — components should show
 * fallback data immediately instead of loading skeletons.
 */
export function isStaticExport(): boolean {
  if (typeof window === "undefined") return false;
  // GitHub Pages or any non-API host
  return (
    window.location.hostname.endsWith(".github.io") ||
    process.env.NEXT_PUBLIC_STATIC_EXPORT === "true"
  );
}
