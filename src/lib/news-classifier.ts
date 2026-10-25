/**
 * Heuristically classify a news item by which border it relates to.
 * Uses id prefix, tag, title, and summary text matching.
 */

export type BorderId = "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier" | "unknown";

interface NewsItemForClassification {
  id?: string;
  title?: string;
  summary?: string;
  tag?: string;
  source?: string;
  sourceUrl?: string;
}

const MYANMAR_KEYWORDS = [
  "myanmar", "burma", "tatmadaw", "mae sot", "myawaddy", "karen", "kayin",
  "shan", "rakhine", "chin", "kachin", "naypyidaw", "yangon", "sagaing",
  "mon state", "kayah", "bago"
];

const CAMBODIA_KEYWORDS = [
  "cambodia", "khmer", "phnom penh", "siem reap", "preah vihear",
  "poipet", "sihanoukville", "battambang", "pursat", "oddar meanchey",
  "banteay", "takeo"
];

const MALAYSIA_KEYWORDS = [
  "malaysia", "malaysian", "kuala lumpur", "johor", "penang",
  "sadao", "bukit kayu hitam", "kelantan", "perlis", "kedah",
  "padang besar", "rantau panjang", "sungai kolok", "narathiwat",
  "yala", "pattani", "songkhla", "southern thailand", "deep south"
];

export function classifyBorder(item: NewsItemForClassification): BorderId {
  const id = (item.id || "").toUpperCase();
  const haystack = [
    item.title || "",
    item.summary || "",
    item.tag || "",
    item.source || "",
    item.sourceUrl || "",
  ].join(" ").toLowerCase();

  // Direct id prefix match (most reliable)
  if (id.startsWith("MM-") || id.includes("MYANMAR") || id.includes("MMR")) return "myanmar-frontier";
  if (id.startsWith("KH-") || id.includes("CAMBODIA") || id.includes("KHM")) return "cambodia-frontier";
  if (id.startsWith("MY-") || id.includes("MALAYSIA") || id.includes("MYS")) return "malaysia-frontier";

  // Keyword match (any mention)
  const mmHit = MYANMAR_KEYWORDS.some((k) => haystack.includes(k));
  const khHit = CAMBODIA_KEYWORDS.some((k) => haystack.includes(k));
  const myHit = MALAYSIA_KEYWORDS.some((k) => haystack.includes(k));

  // If multiple match, prefer in order: Myanmar (most active), Cambodia, Malaysia
  if (mmHit) return "myanmar-frontier";
  if (khHit) return "cambodia-frontier";
  if (myHit) return "malaysia-frontier";

  return "unknown";
}

export const BORDER_COLORS: Record<BorderId, { bg: string; text: string; accent: string; label: string }> = {
  "myanmar-frontier": { bg: "rgba(217, 119, 6, 0.12)", text: "#fbbf24", accent: "#d97706", label: "MM" },
  "cambodia-frontier": { bg: "rgba(8, 145, 178, 0.12)", text: "#67e8f9", accent: "#0891b2", label: "KH" },
  "malaysia-frontier": { bg: "rgba(124, 58, 237, 0.12)", text: "#c4b5fd", accent: "#7c3aed", label: "MY" },
  "unknown": { bg: "rgba(115, 115, 115, 0.08)", text: "#a3a3a3", accent: "#737373", label: "—" },
};
