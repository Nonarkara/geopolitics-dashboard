/**
 * Deep South Insurgency Specialization
 *
 * The Malay-Muslim separatist conflict in Thailand's three southern border
 * provinces (Pattani, Yala, Narathiwat) has distinct characteristics from
 * the other border theaters. This module provides insurgency-specific
 * scoring weights and indicator definitions.
 *
 * Key actors: BRN (Barisan Revolusi Nasional), PULO (Patani United Liberation
 * Organisation), MARA Patani (umbrella peace negotiation group)
 */

/** Incident type weights — insurgency incidents weighted differently */
export const DEEP_SOUTH_INCIDENT_WEIGHTS: Record<string, number> = {
  // IED/bombings are the primary insurgent tactic
  "Explosions/Remote violence": 15,
  // Targeted killings of officials, teachers, monks
  "Violence against civilians": 12,
  // Ambushes on security forces
  "Battles": 10,
  // Arson attacks on schools and government buildings
  "Strategic developments": 8,
  // Protests and demonstrations
  "Protests": 4,
  // Riots / communal clashes
  "Riots": 6,
  // Default for unclassified events
  default: 9,
};

/** Keywords that indicate communal tension vs. separatist activity */
export const COMMUNAL_TENSION_KEYWORDS = [
  "buddhist",
  "muslim",
  "mosque",
  "temple",
  "communal",
  "sectarian",
  "religious",
  "monk",
  "imam",
  "arson",
  "desecration",
];

/** Keywords specific to insurgent operations */
export const INSURGENT_KEYWORDS = [
  "brn",
  "pulo",
  "mara patani",
  "separatist",
  "insurgent",
  "ied",
  "roadside bomb",
  "improvised explosive",
  "checkpoint attack",
  "ambush",
  "assassination",
  "beheading",
  "martial law",
  "emergency decree",
  "isoc",
  "ranger",
  "paramilitary",
];

/** School/teacher attack tracking — specific to the deep south conflict */
export const SCHOOL_ATTACK_KEYWORDS = [
  "school",
  "teacher",
  "student",
  "education",
  "classroom",
  "principal",
  "headmaster",
];

/**
 * Calculate a deep-south-specific severity multiplier for an incident
 * based on its type and description.
 */
export function deepSouthSeverityMultiplier(
  eventType: string,
  description: string,
): number {
  const lower = description.toLowerCase();
  let multiplier =
    DEEP_SOUTH_INCIDENT_WEIGHTS[eventType] ??
    DEEP_SOUTH_INCIDENT_WEIGHTS.default;

  // Boost for school/teacher attacks
  if (SCHOOL_ATTACK_KEYWORDS.some((kw) => lower.includes(kw))) {
    multiplier *= 1.5;
  }

  // Boost for communal tension indicators
  if (COMMUNAL_TENSION_KEYWORDS.some((kw) => lower.includes(kw))) {
    multiplier *= 1.3;
  }

  return multiplier;
}

/**
 * Classify an incident's deep-south significance.
 */
export function classifyDeepSouthIncident(
  description: string,
): "insurgent" | "communal" | "security" | "general" {
  const lower = description.toLowerCase();

  if (INSURGENT_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "insurgent";
  }

  if (COMMUNAL_TENSION_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "communal";
  }

  if (
    lower.includes("checkpoint") ||
    lower.includes("security") ||
    lower.includes("military") ||
    lower.includes("patrol")
  ) {
    return "security";
  }

  return "general";
}
