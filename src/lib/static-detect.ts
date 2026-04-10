/**
 * Whether the dashboard was built as a static GitHub Pages export.
 * Evaluated at BUILD TIME via NEXT_PUBLIC_STATIC_EXPORT env var.
 * In static mode, API routes don't exist — components show fallback data.
 */
export const IS_STATIC_EXPORT =
  process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
