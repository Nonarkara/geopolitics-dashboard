export function isDataExplorerEnabled() {
  if (typeof window === "undefined") {
    return (
      process.env.DATA_EXPLORER_ENABLED === "true" ||
      process.env.NEXT_PUBLIC_ENABLE_DATA_EXPLORER === "true"
    );
  }

  return process.env.NEXT_PUBLIC_ENABLE_DATA_EXPLORER === "true";
}
