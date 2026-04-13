import type { Coordinates, IncidentFeature } from "../types/dashboard";

export type BorderAreaId =
  | "myanmar-frontier"
  | "cambodia-frontier"
  | "malaysia-frontier"
  | "deep-south";

export type BorderAreaConfig = {
  id: BorderAreaId;
  label: string;
  counterpart: string;
  center: Coordinates;
  radiusKm: number;
  aliases: string[];
  baseScore: number;
  baseScoreRationale: string;
  watchpoints: string[];
  actionTitle: string;
  actionOwner: string;
};

export const BORDER_AREAS: BorderAreaConfig[] = [
  {
    id: "myanmar-frontier",
    label: "Myanmar frontier",
    counterpart: "Myanmar",
    center: [98.5746, 16.7163],
    radiusKm: 420,
    aliases: [
      "mae sot",
      "myawaddy",
      "tak",
      "mae sai",
      "three pagodas",
      "ranong",
      "kawthaung",
      "karen",
      "myanmar",
      "burma",
    ],
    baseScore: 58,
    baseScoreRationale: "Chronic conflict spillover baseline — active civil war in Kayin/Karen state drives elevated default threat",
    watchpoints: [
      "Conflict spillover around Mae Sot / Myawaddy",
      "Shelter and humanitarian pressure in Tak",
      "Truck queue growth and trade disruption on western gates",
    ],
    actionTitle: "Stabilize the western frontier posture",
    actionOwner: "Interior + provincial governors",
  },
  {
    id: "cambodia-frontier",
    label: "Cambodia frontier",
    counterpart: "Cambodia",
    center: [13.6587, 102.5636],
    radiusKm: 320,
    aliases: [
      "aranyaprathet",
      "poipet",
      "sa kaeo",
      "sa keo",
      "trat",
      "koh kong",
      "chanthaburi",
      "ban laem",
      "preah vihear",
      "cambodia",
      "khmer",
    ],
    baseScore: 34,
    baseScoreRationale: "Cross-border queue monitoring and scam-economy narrative baseline — moderate security posture",
    watchpoints: [
      "Queue visibility gap at Aranyaprathet / Poipet",
      "Cross-border passenger and casino-linked traffic surges",
      "Eastern customs throughput and scam-economy narrative spillover",
    ],
    actionTitle: "Tighten eastern crossing visibility",
    actionOwner: "Customs + immigration",
  },
  {
    id: "malaysia-frontier",
    label: "Malaysia frontier",
    counterpart: "Malaysia",
    center: [100.4186, 7.0084],
    radiusKm: 200,
    aliases: [
      "hat yai",
      "sadao",
      "padang besar",
      "songkhla",
      "bukit kayu hitam",
      "kelantan",
      "malaysia",
    ],
    baseScore: 38,
    baseScoreRationale: "Southern trade corridor baseline — freight and coach flow monitoring with routine security posture",
    watchpoints: [
      "Coach and freight pressure on Hat Yai / Sadao approaches",
      "Rail-road coupling efficiency on the Malaysia corridor",
      "Weather-driven disruption on the southbound logistics spine",
    ],
    actionTitle: "Keep the southern corridor moving",
    actionOwner: "Transport + customs",
  },
  {
    id: "deep-south",
    label: "Deep South (Patani)",
    counterpart: "BRN / separatist groups",
    center: [101.28, 6.54],
    radiusKm: 180,
    aliases: [
      "pattani",
      "yala",
      "narathiwat",
      "sungai kolok",
      "su-ngai kolok",
      "betong",
      "brn",
      "pulo",
      "mara patani",
      "deep south",
      "insurgency",
      "separatist",
      "rangae",
      "bacho",
      "ruso",
    ],
    baseScore: 52,
    baseScoreRationale: "Persistent Malay-Muslim insurgency baseline — Southeast Asia's longest-running separatist conflict with recurrent IED, ambush, and communal incidents",
    watchpoints: [
      "BRN / PULO insurgent activity tempo and IED incidents",
      "Targeted attacks on schools, teachers, and government officials",
      "Communal tension indicators between Buddhist and Muslim communities",
      "Security force deployment shifts and checkpoint escalation",
    ],
    actionTitle: "Maintain Deep South security posture",
    actionOwner: "ISOC Region 4 + security command",
  },
];

export function normalizeBorderText(value = "") {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function haversineKm(left: Coordinates, right: Coordinates) {
  const [leftLng, leftLat] = left;
  const [rightLng, rightLat] = right;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(rightLat - leftLat);
  const longitudeDelta = toRadians(rightLng - leftLng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(leftLat)) *
      Math.cos(toRadians(rightLat)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function incidentMatchesBorderArea(
  area: BorderAreaConfig,
  incident: IncidentFeature,
) {
  const coordinates = incident.geometry.coordinates;
  const text = normalizeBorderText(
    `${incident.properties.title} ${incident.properties.notes} ${incident.properties.location}`,
  );

  return (
    haversineKm(area.center, coordinates) <= area.radiusKm ||
    area.aliases.some((alias) => text.includes(alias))
  );
}

/**
 * Assign an incident to the closest matching area when it falls in overlapping
 * radii (e.g. malaysia-frontier and deep-south). Returns true only if this area
 * is the best match.
 */
export function isClosestBorderArea(
  area: BorderAreaConfig,
  incident: IncidentFeature,
) {
  if (!incidentMatchesBorderArea(area, incident)) return false;

  const distance = haversineKm(area.center, incident.geometry.coordinates);

  for (const candidate of BORDER_AREAS) {
    if (candidate.id === area.id) continue;
    if (!incidentMatchesBorderArea(candidate, incident)) continue;

    const candidateDistance = haversineKm(
      candidate.center,
      incident.geometry.coordinates,
    );

    if (candidateDistance < distance) return false;
  }

  return true;
}

export function resolveBorderAreaByText(text: string) {
  const normalized = normalizeBorderText(text);

  return (
    BORDER_AREAS.find((area) =>
      area.aliases.some((alias) => normalized.includes(alias)),
    ) ?? null
  );
}

export function resolveBorderAreaLabel(areaId: BorderAreaId) {
  return BORDER_AREAS.find((area) => area.id === areaId)?.label ?? areaId;
}
