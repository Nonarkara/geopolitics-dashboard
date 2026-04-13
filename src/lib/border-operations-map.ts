import type {
  BorderOperationalCorridor,
  BorderOperationalMapResponse,
  BorderOperationalNode,
  BorderOperationalTheater,
  RefugeeMovement,
} from "../types/dashboard";

export const BORDER_NATIONAL_VIEW = {
  longitude: 100.85,
  latitude: 14.2,
  zoom: 6.25,
  pitch: 40,
  bearing: 0,
} as const;

const BORDER_OPERATION_THEATERS: BorderOperationalTheater[] = [
  {
    id: "myanmar-frontier",
    label: "Myanmar frontier",
    counterpart: "Myanmar",
    summary:
      "Western conflict-spillover theater with Mae Sot, Mae Sai, and Tak logistics acting as the main operational spine.",
    focusView: {
      longitude: 98.86,
      latitude: 16.82,
      zoom: 8.45,
      pitch: 48,
      bearing: 18,
    },
    deepZoomRadiusKm: 170,
    generalZoom: 8.45,
    deepZoom: 15.6,
  },
  {
    id: "cambodia-frontier",
    label: "Cambodia frontier",
    counterpart: "Cambodia",
    summary:
      "Eastern customs and queue-management theater anchored on Aranyaprathet, Poipet, and the Sa Kaeo logistics belt.",
    focusView: {
      longitude: 102.42,
      latitude: 13.61,
      zoom: 8.65,
      pitch: 46,
      bearing: 12,
    },
    deepZoomRadiusKm: 155,
    generalZoom: 8.65,
    deepZoom: 15.6,
  },
  {
    id: "malaysia-frontier",
    label: "Malaysia corridor",
    counterpart: "Malaysia",
    summary:
      "Southern freight and trade corridor from Sadao through Hat Yai to Padang Besar, where rail-road coupling and customs throughput matter every day.",
    focusView: {
      longitude: 100.47,
      latitude: 7.0,
      zoom: 9.2,
      pitch: 47,
      bearing: 10,
    },
    deepZoomRadiusKm: 140,
    generalZoom: 9.2,
    deepZoom: 15.8,
  },
  {
    id: "deep-south",
    label: "Deep South (Patani)",
    counterpart: "BRN / separatist groups",
    summary:
      "Malay-Muslim insurgency belt spanning Pattani, Yala, and Narathiwat provinces — Southeast Asia's longest-running separatist conflict with persistent IED, ambush, and communal tension.",
    focusView: {
      longitude: 101.28,
      latitude: 6.54,
      zoom: 9.0,
      pitch: 45,
      bearing: 5,
    },
    deepZoomRadiusKm: 120,
    generalZoom: 9.0,
    deepZoom: 15.0,
  },
];

const BORDER_OPERATION_NODES: BorderOperationalNode[] = [
  {
    id: "mae-sot-sez",
    theaterId: "myanmar-frontier",
    label: "Mae Sot SEZ",
    shortLabel: "MAE SOT",
    type: "sez",
    coordinates: [98.5746, 16.7163],
    summary: "Primary western customs and industrial gate facing Myawaddy.",
    usage:
      "Truck, relief, and labor flows stack here first when Kayin conflict or bridge friction hits the frontier.",
    focusView: {
      longitude: 98.6104,
      latitude: 16.7089,
      zoom: 12.45,
      pitch: 50,
      bearing: 16,
    },
    allowsDeepZoom: true,
    emphasis: "primary",
  },
  {
    id: "mae-sai-gate",
    theaterId: "myanmar-frontier",
    label: "Mae Sai gate",
    shortLabel: "MAE SAI",
    type: "checkpoint",
    coordinates: [99.8762, 20.4335],
    summary: "Northern frontier gate for commercial spillover and cross-border queue monitoring.",
    usage:
      "Useful when the northern diversion route starts to absorb pressure away from Mae Sot.",
    focusView: {
      longitude: 99.8784,
      latitude: 20.4287,
      zoom: 12.1,
      pitch: 48,
      bearing: 6,
    },
    allowsDeepZoom: true,
    emphasis: "secondary",
  },
  {
    id: "tak-logistics-hub",
    theaterId: "myanmar-frontier",
    label: "Tak logistics hub",
    shortLabel: "TAK HUB",
    type: "logistics-hub",
    coordinates: [99.1296, 16.8847],
    summary: "Inland staging node where western truck queues become provincial logistics risk.",
    usage:
      "The inland handoff point for freight, shelters, and governor-level reroute discipline.",
    focusView: {
      longitude: 99.1182,
      latitude: 16.864,
      zoom: 11.35,
      pitch: 42,
      bearing: 8,
    },
    allowsDeepZoom: false,
    emphasis: "secondary",
  },
  {
    id: "aranyaprathet-sez",
    theaterId: "cambodia-frontier",
    label: "Aranyaprathet SEZ",
    shortLabel: "ARAN",
    type: "sez",
    coordinates: [102.5636, 13.6587],
    summary: "Eastern gate where queue visibility, customs, and casino-linked passenger flows collide.",
    usage:
      "Passenger processing, customs inspection, and bus-coach turnover all compress into one gate picture here.",
    focusView: {
      longitude: 102.5608,
      latitude: 13.6669,
      zoom: 12.55,
      pitch: 50,
      bearing: 12,
    },
    allowsDeepZoom: true,
    emphasis: "primary",
  },
  {
    id: "sa-kaeo-logistics",
    theaterId: "cambodia-frontier",
    label: "Sa Kaeo logistics belt",
    shortLabel: "SA KAEO",
    type: "logistics-hub",
    coordinates: [102.0837, 13.6904],
    summary: "Provincial logistics belt where eastern queue pressure becomes distribution delay.",
    usage:
      "A useful read on whether gate friction is leaking inland into warehouse and coach dispatch timing.",
    focusView: {
      longitude: 102.104,
      latitude: 13.702,
      zoom: 11.55,
      pitch: 42,
      bearing: 10,
    },
    allowsDeepZoom: false,
    emphasis: "secondary",
  },
  {
    id: "ban-laem-checkpoint",
    theaterId: "cambodia-frontier",
    label: "Ban Laem checkpoint",
    shortLabel: "BAN LAEM",
    type: "checkpoint",
    coordinates: [102.1184, 12.6012],
    summary: "Secondary eastern gate useful for diversion and coastal customs pressure.",
    usage:
      "A smaller gate that becomes operationally important when Aranyaprathet congestion spills south.",
    focusView: {
      longitude: 102.125,
      latitude: 12.606,
      zoom: 11.8,
      pitch: 44,
      bearing: 8,
    },
    allowsDeepZoom: true,
    emphasis: "secondary",
  },
  {
    id: "sadao-sez",
    theaterId: "malaysia-frontier",
    label: "Sadao SEZ",
    shortLabel: "SADAO",
    type: "sez",
    coordinates: [100.4186, 6.7483],
    summary: "Primary southern customs gate facing Bukit Kayu Hitam.",
    usage:
      "The main freight and coach pressure valve on the Malaysia corridor, especially when queue discipline breaks.",
    focusView: {
      longitude: 100.4275,
      latitude: 6.7481,
      zoom: 12.45,
      pitch: 50,
      bearing: 10,
    },
    allowsDeepZoom: true,
    emphasis: "primary",
  },
  {
    id: "hat-yai-hub",
    theaterId: "malaysia-frontier",
    label: "Hat Yai corridor hub",
    shortLabel: "HAT YAI",
    type: "logistics-hub",
    coordinates: [100.4747, 7.0084],
    summary: "Rail-road consolidation node for southern diversion and throughput monitoring.",
    usage:
      "If Sadao is the gate, Hat Yai is where the corridor tells you whether the whole south is still moving.",
    focusView: {
      longitude: 100.4798,
      latitude: 7.0114,
      zoom: 11.9,
      pitch: 46,
      bearing: 12,
    },
    allowsDeepZoom: false,
    emphasis: "secondary",
  },
  {
    id: "padang-besar-rail",
    theaterId: "malaysia-frontier",
    label: "Padang Besar rail gate",
    shortLabel: "PADANG",
    type: "rail",
    coordinates: [100.3171, 6.6642],
    summary: "Rail-linked crossing for freight transfer and alternate queue relief.",
    usage:
      "Critical when rail-road substitution starts carrying load away from the main customs lanes.",
    focusView: {
      longitude: 100.3205,
      latitude: 6.6684,
      zoom: 12.1,
      pitch: 46,
      bearing: 8,
    },
    allowsDeepZoom: true,
    emphasis: "secondary",
  },
  {
    id: "sungai-kolok-security",
    theaterId: "deep-south",
    label: "Sungai Kolok security gate",
    shortLabel: "KOLOK",
    type: "security",
    coordinates: [101.9623, 6.0298],
    summary: "Security-sensitive border gate in the heart of the insurgency zone where screening tempo and movement control are critical.",
    usage:
      "Primary crossing for Narathiwat province — security incidents and checkpoint escalation are monitored here first.",
    focusView: {
      longitude: 101.9696,
      latitude: 6.0261,
      zoom: 12.2,
      pitch: 48,
      bearing: 14,
    },
    allowsDeepZoom: true,
    emphasis: "primary",
  },
  {
    id: "betong-checkpoint",
    theaterId: "deep-south",
    label: "Betong checkpoint",
    shortLabel: "BETONG",
    type: "checkpoint",
    coordinates: [101.0718, 5.7708],
    summary: "Southernmost Thai town and strategic checkpoint on the Yala-Malaysia frontier.",
    usage:
      "Monitors cross-border movement in the western deep-south flank and serves as an indicator of insurgent lateral mobility.",
    focusView: {
      longitude: 101.075,
      latitude: 5.774,
      zoom: 12.0,
      pitch: 46,
      bearing: 8,
    },
    allowsDeepZoom: true,
    emphasis: "secondary",
  },
  {
    id: "pattani-security-command",
    theaterId: "deep-south",
    label: "Pattani security command",
    shortLabel: "PATTANI",
    type: "security",
    coordinates: [101.2506, 6.8672],
    summary: "Provincial security command center for the Pattani insurgency zone — ISOC Region 4 coordination point.",
    usage:
      "Central node for monitoring insurgent activity, IED incidents, and communal tension across the three southern provinces.",
    focusView: {
      longitude: 101.255,
      latitude: 6.87,
      zoom: 11.5,
      pitch: 44,
      bearing: 6,
    },
    allowsDeepZoom: false,
    emphasis: "primary",
  },
];

function resolvePrimaryFlowLabel(
  liveFlows: RefugeeMovement[],
  theaterId: BorderOperationalTheater["id"],
  fallback: string,
) {
  if (theaterId === "myanmar-frontier") {
    return liveFlows[0]?.label ?? fallback;
  }

  if (theaterId === "cambodia-frontier") {
    return liveFlows[1]?.label ?? fallback;
  }

  if (theaterId === "deep-south") {
    return liveFlows[3]?.label ?? fallback;
  }

  return liveFlows[2]?.label ?? fallback;
}

export function buildBorderOperationsMapResponse(
  liveFlows: RefugeeMovement[],
): BorderOperationalMapResponse {
  const corridors: BorderOperationalCorridor[] = [
    {
      id: "west-conflict-spine",
      theaterId: "myanmar-frontier",
      label: "Mae Sot / Myawaddy spine",
      shortLabel: "WEST SPINE",
      coordinates: [
        [98.5746, 16.7163],
        [98.7212, 16.6408],
        [98.9115, 16.6911],
        [99.1296, 16.8847],
      ],
      mode: "mixed",
      summary:
        "Primary western corridor linking the border bridge to inland staging and governor response.",
      usage: resolvePrimaryFlowLabel(
        liveFlows,
        "myanmar-frontier",
        "Western corridor handles truck, relief, and shelter-linked displacement pressure.",
      ),
      emphasis: "primary",
    },
    {
      id: "north-diversion-spine",
      theaterId: "myanmar-frontier",
      label: "Mae Sai diversion spine",
      shortLabel: "DIVERSION",
      coordinates: [
        [99.8762, 20.4335],
        [99.7925, 20.2886],
        [99.6456, 20.1113],
        [99.4708, 19.9094],
      ],
      mode: "security",
      summary:
        "Secondary northern diversion line for commercial spillover and checkpoint visibility.",
      usage:
        "Monitor when western pressure starts to spill into northern commercial routing and checkpoint queues.",
      emphasis: "secondary",
    },
    {
      id: "east-customs-spine",
      theaterId: "cambodia-frontier",
      label: "Aranyaprathet / Poipet customs spine",
      shortLabel: "EAST SPINE",
      coordinates: [
        [102.5636, 13.6587],
        [102.4308, 13.6196],
        [102.2518, 13.6211],
        [102.0837, 13.6904],
      ],
      mode: "passenger",
      summary:
        "Primary eastern customs line where passenger queues and bus turnover become visible first.",
      usage: resolvePrimaryFlowLabel(
        liveFlows,
        "cambodia-frontier",
        "Eastern customs traffic is dominated by passenger and checkpoint processing pressure.",
      ),
      emphasis: "primary",
    },
    {
      id: "coastal-diversion-spine",
      theaterId: "cambodia-frontier",
      label: "Ban Laem coastal diversion",
      shortLabel: "COASTAL",
      coordinates: [
        [102.1184, 12.6012],
        [102.0455, 12.7314],
        [102.1032, 12.8875],
        [102.2136, 13.0588],
      ],
      mode: "mixed",
      summary:
        "Secondary coastal line that matters when Aranyaprathet congestion forces redistribution.",
      usage:
        "Use this route to judge whether eastern queue pressure is staying local or spreading south along the coast.",
      emphasis: "secondary",
    },
    {
      id: "south-freight-spine",
      theaterId: "malaysia-frontier",
      label: "Sadao / Hat Yai freight spine",
      shortLabel: "SOUTH SPINE",
      coordinates: [
        [100.4186, 6.7483],
        [100.4529, 6.8797],
        [100.4747, 7.0084],
        [100.6172, 7.1628],
      ],
      mode: "freight",
      summary:
        "Primary southern rail-road freight spine linking the customs gate to Hat Yai consolidation.",
      usage: resolvePrimaryFlowLabel(
        liveFlows,
        "malaysia-frontier",
        "Southern freight and coach movements are concentrated on the Sadao / Hat Yai spine.",
      ),
      emphasis: "primary",
    },
    {
      id: "kolok-security-spine",
      theaterId: "deep-south",
      label: "Sungai Kolok security spine",
      shortLabel: "KOLOK SPINE",
      coordinates: [
        [101.9623, 6.0298],
        [101.8896, 6.1614],
        [101.815, 6.4319],
        [101.2791, 6.5397],
      ],
      mode: "security",
      summary:
        "Security-sensitive deep-south line linking Sungai Kolok through Narathiwat to Pattani — the insurgency's operational spine.",
      usage:
        "Track IED incidents, checkpoint escalations, and insurgent activity tempo across the three southern border provinces.",
      emphasis: "primary",
    },
    {
      id: "deep-south-interior-spine",
      theaterId: "deep-south",
      label: "Pattani-Yala interior spine",
      shortLabel: "INTERIOR",
      coordinates: [
        [101.2506, 6.8672],
        [101.2791, 6.5397],
        [101.0718, 5.7708],
      ],
      mode: "security",
      summary:
        "Interior corridor connecting Pattani command through Yala to Betong — insurgent lateral mobility route.",
      usage:
        "Monitor when insurgent activity shifts between provinces and whether security force redeployments are keeping pace.",
      emphasis: "secondary",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    nationalView: BORDER_NATIONAL_VIEW,
    theaters: BORDER_OPERATION_THEATERS,
    nodes: BORDER_OPERATION_NODES,
    corridors,
    liveFlows,
    sources: [
      "Curated tri-border theater geometry",
      "Border movement API",
      "Operational node annotations",
    ],
  };
}
