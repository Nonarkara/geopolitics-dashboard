import type { BorderAreaId } from "./border-regions";

export type BorderColorEntry = { accent: string; label: string };

/**
 * Tactical accent colours for each frontier — matches the dark
 * monochrome palette (amber primary, sky secondary, emerald tertiary).
 */
export const BORDER_COLORS: Record<BorderAreaId | "unknown", BorderColorEntry> = {
  "myanmar-frontier":  { accent: "#f59e0b", label: "Myanmar Frontier"  },
  "cambodia-frontier": { accent: "#38bdf8", label: "Cambodia Frontier" },
  "malaysia-frontier": { accent: "#34d399", label: "Malaysia Frontier" },
  "unknown":           { accent: "#6b7280", label: "Unknown"           },
};
