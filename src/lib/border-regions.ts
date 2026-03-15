import type { Coordinates, IncidentFeature } from "../types/dashboard";

export type BorderAreaId =
  | "myanmar-frontier"
  | "cambodia-frontier"
  | "malaysia-frontier";

export type BorderAreaConfig = {
  id: BorderAreaId;
  label: string;
  counterpart: string;
  center: Coordinates;
  radiusKm: number;
  aliases: string[];
  baseScore: number;
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
    center: [6.7483, 100.4186],
    radiusKm: 360,
    aliases: [
      "hat yai",
      "sadao",
      "padang besar",
      "sungai kolok",
      "su-ngai kolok",
      "narathiwat",
      "songkhla",
      "yala",
      "betong",
      "bukit kayu hitam",
      "kelantan",
      "malaysia",
    ],
    baseScore: 42,
    watchpoints: [
      "Coach and freight pressure on Hat Yai / Sadao approaches",
      "Southern security tempo near Sungai Kolok and Narathiwat",
      "Weather-driven disruption on the southbound logistics spine",
    ],
    actionTitle: "Keep the southern corridor moving",
    actionOwner: "Transport + security command",
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
