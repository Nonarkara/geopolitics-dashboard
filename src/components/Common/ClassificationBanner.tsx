"use client";

type ClassificationLevel =
  | "UNCLASSIFIED"
  | "CUI"
  | "FOUO"
  | "CONFIDENTIAL"
  | "SECRET"
  | "TOPSECRET";

const LEVELS: Record<ClassificationLevel, { bg: string; color: string; label: string }> = {
  UNCLASSIFIED: { bg: "#22c55e", color: "#000", label: "UNCLASSIFIED" },
  CUI: { bg: "#6366f1", color: "#fff", label: "CUI // CONTROLLED UNCLASSIFIED INFORMATION" },
  FOUO: { bg: "#3b82f6", color: "#fff", label: "UNCLASSIFIED // FOR OFFICIAL USE ONLY" },
  CONFIDENTIAL: { bg: "#3b82f6", color: "#fff", label: "CONFIDENTIAL" },
  SECRET: { bg: "#ef4444", color: "#fff", label: "SECRET" },
  TOPSECRET: { bg: "#f59e0b", color: "#000", label: "TOP SECRET" },
};

export default function ClassificationBanner({
  level = "FOUO",
}: {
  level?: ClassificationLevel;
}) {
  const config = LEVELS[level] || LEVELS.UNCLASSIFIED;

  const bannerStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: config.bg,
    color: config.color,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "2px",
    fontFamily: "var(--font-mono, monospace)",
    zIndex: 99999,
    textTransform: "uppercase",
    userSelect: "none",
    pointerEvents: "none",
  };

  return (
    <>
      <div style={{ ...bannerStyle, top: 0 }}>{config.label}</div>
      <div style={{ ...bannerStyle, bottom: 0 }}>{config.label}</div>
    </>
  );
}
