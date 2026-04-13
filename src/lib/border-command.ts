import { listCriticalCameras } from "./critical-cameras";
import {
  BORDER_AREAS,
  haversineKm,
  isClosestBorderArea,
  normalizeBorderText,
  type BorderAreaConfig,
} from "./border-regions";
import {
  buildBorderMovements,
  filterTruthfulBorderOsint,
  loadBorderIncidents,
  loadBorderOsint,
} from "./border-osint";
import { PlaybackApiError } from "./playback-api";
import { loadThailandEconomics } from "./thailand-monitor";
import type {
  BorderActionItem,
  BorderAreaStatus,
  BorderCommandBrief,
  BorderCommandConcern,
  BorderCommandPosture,
  BorderHumanitarianSnapshot,
  BorderNarrativeSignal,
  EconomicIndicator,
  IncidentFeature,
  PublicCamera,
  RefugeeMovement,
} from "../types/dashboard";

const BORDER_BRIEF_TTL_MS = 60 * 1000;

type CachedBorderBrief = {
  payload: BorderCommandBrief;
  cachedAt: number;
};

const briefCache: CachedBorderBrief[] = [];

function postureFromScore(score: number): BorderCommandPosture {
  if (score >= 75) {
    return "priority";
  }

  if (score >= 48) {
    return "watch";
  }

  return "stable";
}

function postureRank(posture: BorderCommandPosture) {
  switch (posture) {
    case "priority":
      return 3;
    case "watch":
      return 2;
    default:
      return 1;
  }
}

function formatChange(change: number | string) {
  if (typeof change === "number") {
    if (change === 0) {
      return "flat";
    }

    return `${change > 0 ? "+" : ""}${change}`;
  }

  return String(change);
}

function cameraMatchesArea(area: BorderAreaConfig, camera: PublicCamera) {
  const text = normalizeBorderText(
    `${camera.label} ${camera.locationLabel ?? ""} ${camera.focusArea ?? ""} ${camera.strategicNote ?? ""}`,
  );

  return (
    haversineKm(area.center, [camera.lng, camera.lat]) <= area.radiusKm ||
    area.aliases.some((alias) => text.includes(alias))
  );
}

function narrativeMatchesArea(
  area: BorderAreaConfig,
  signal: BorderNarrativeSignal,
) {
  return signal.areaId === area.id;
}

function humanitarianMatchesArea(
  area: BorderAreaConfig,
  snapshot: BorderHumanitarianSnapshot,
) {
  return snapshot.areaId === area.id;
}

function selectLeadIndicator(indicators: EconomicIndicator[]) {
  return [...indicators]
    .sort((left, right) => {
      const leftMagnitude =
        typeof left.change === "number" ? Math.abs(left.change) : 0;
      const rightMagnitude =
        typeof right.change === "number" ? Math.abs(right.change) : 0;

      return rightMagnitude - leftMagnitude;
    })
    .find((indicator) => indicator.label);
}

function buildAreaSummary(
  area: BorderAreaConfig,
  posture: BorderCommandPosture,
  incidents: IncidentFeature[],
  fatalityCount: number,
  verifiedCameras: number,
  candidateCameras: number,
  narrativeCount: number,
  humanitarian: BorderHumanitarianSnapshot | null,
) {
  if (area.id === "myanmar-frontier") {
    if (incidents.length > 0) {
      const displacementNote = humanitarian
        ? ` UNHCR is also carrying ${humanitarian.count.toLocaleString("en-US")} registered refugees from Myanmar hosted in Thailand (${humanitarian.asOf}).`
        : "";

      return `${incidents.length} matched field incidents and ${fatalityCount} reported fatalities are keeping the western frontier at ${posture}.${displacementNote}`;
    }

    return humanitarian
      ? `Conflict spillover remains the main strategic concern, and UNHCR still counts ${humanitarian.count.toLocaleString("en-US")} registered refugees from Myanmar hosted in Thailand (${humanitarian.asOf}).`
      : "Conflict spillover remains the main strategic concern even when field reporting briefly thins out.";
  }

  if (area.id === "cambodia-frontier") {
    if (verifiedCameras === 0) {
      return narrativeCount > 0
        ? `The eastern frontier is a visibility problem first: ${narrativeCount} narrative corroborations are landing faster than the current camera coverage can confirm them.`
        : "The eastern frontier is a visibility problem first: queue pressure can build faster than the current camera coverage can confirm it.";
    }

    return "Passenger and customs surges around Aranyaprathet need a tighter watch before they turn into a wider provincial issue.";
  }

  if (area.id === "deep-south") {
    if (incidents.length > 0) {
      return `${incidents.length} security incidents across Pattani, Yala, and Narathiwat are keeping the deep-south insurgency belt at ${posture}. IED and ambush activity requires sustained ISOC Region 4 attention.`;
    }

    return "The deep-south insurgency belt is in a lower-tempo phase, but BRN/PULO activity can escalate without warning — maintain checkpoint discipline and communal tension monitoring.";
  }

  if (candidateCameras > 0 && verifiedCameras <= 1) {
    return narrativeCount > 0
      ? `Southern corridor flow remains active, and ${narrativeCount} narrative corroborations are still leaning too heavily on proxy visibility south of Hat Yai.`
      : "Southern corridor flow remains active, but the command picture is still relying too heavily on proxy visibility south of Hat Yai.";
  }

  return "Freight, coach, and customs pressure on the Malaysia trade corridor remains manageable but needs daily discipline.";
}

function buildSignals(
  incidents: IncidentFeature[],
  verifiedCameras: number,
  candidateCameras: number,
  narrativeCount: number,
  humanitarian: BorderHumanitarianSnapshot | null,
  leadIndicator?: EconomicIndicator,
) {
  const signals = [
    incidents.length > 0
      ? `${incidents.length} matched field incidents`
      : "No confirmed incident cluster in the last sweep",
    `${verifiedCameras} verified camera feeds`,
  ];

  if (candidateCameras > 0) {
    signals.push(`${candidateCameras} scout slots still need validation`);
  }

  if (narrativeCount > 0) {
    signals.push(`${narrativeCount} OSINT corroborations`);
  }

  if (humanitarian) {
    signals.push(
      `UNHCR ${humanitarian.count.toLocaleString("en-US")} registered`,
    );
  }

  if (leadIndicator) {
    signals.push(`${leadIndicator.label} ${formatChange(leadIndicator.change)}`);
  }

  return signals.slice(0, 4);
}

function buildAreaStatus(
  area: BorderAreaConfig,
  incidents: IncidentFeature[],
  cameras: PublicCamera[],
  narratives: BorderNarrativeSignal[],
  humanitarian: BorderHumanitarianSnapshot[],
  leadIndicator?: EconomicIndicator,
): BorderAreaStatus {
  const matchedIncidents = incidents.filter((incident) =>
    isClosestBorderArea(area, incident),
  );
  const matchedCameras = cameras.filter((camera) => cameraMatchesArea(area, camera));
  const matchedNarratives = narratives.filter((signal) =>
    narrativeMatchesArea(area, signal),
  );
  const humanitarianSnapshot =
    humanitarian.find((snapshot) => humanitarianMatchesArea(area, snapshot)) ?? null;
  const fatalityCount = matchedIncidents.reduce(
    (sum, incident) => sum + (incident.properties.fatalities ?? 0),
    0,
  );
  const verifiedCameras = matchedCameras.filter(
    (camera) => camera.validationState === "verified",
  ).length;
  const candidateCameras = matchedCameras.filter(
    (camera) => camera.validationState === "candidate",
  ).length;
  const contributions: import("../types/dashboard").ScoreContribution[] = [];

  if (matchedIncidents.length > 0) {
    contributions.push({ factor: "Matched Incidents", rawValue: matchedIncidents.length, weight: 9, contribution: matchedIncidents.length * 9, source: "ACLED", sourceUrl: "https://acleddata.com" });
  }
  if (fatalityCount > 0) {
    contributions.push({ factor: "Fatalities", rawValue: fatalityCount, weight: 6, contribution: fatalityCount * 6, source: "ACLED", sourceUrl: "https://acleddata.com" });
  }
  if (matchedNarratives.length > 0) {
    contributions.push({ factor: "OSINT Narratives", rawValue: matchedNarratives.length, weight: 2, contribution: matchedNarratives.length * 2, source: "GDELT", sourceUrl: "https://api.gdeltproject.org" });
  }
  const humanitarianContrib = humanitarianSnapshot ? Math.min(12, Math.round(humanitarianSnapshot.count / 20_000)) : 0;
  if (humanitarianContrib > 0) {
    contributions.push({ factor: "Humanitarian Pressure", rawValue: humanitarianSnapshot!.count, weight: 1, contribution: humanitarianContrib, source: "UNHCR", sourceUrl: "https://www.unhcr.org/refugee-statistics" });
  }
  if (verifiedCameras > 0) {
    contributions.push({ factor: "Verified Cameras", rawValue: verifiedCameras, weight: 3, contribution: verifiedCameras * 3, source: "Camera Network" });
  }
  if (candidateCameras > 0) {
    contributions.push({ factor: "Candidate Cameras", rawValue: candidateCameras, weight: 4, contribution: candidateCameras * 4, source: "Camera Network" });
  }

  const rawTotal = area.baseScore + contributions.reduce((s, c) => s + c.contribution, 0);
  const score = Math.min(96, rawTotal);
  const posture = postureFromScore(score);

  const scoreBreakdown: import("../types/dashboard").ScoreBreakdown = {
    baseScore: area.baseScore,
    baseScoreRationale: area.baseScoreRationale,
    contributions,
    rawTotal,
    clampedScore: score,
    formula: `min(96, baseScore + incidents×9 + fatalities×6 + narratives×2 + humanitarian + cameras×3 + scouts×4)`,
  };

  return {
    id: area.id,
    label: area.label,
    counterpart: area.counterpart,
    posture,
    score,
    scoreBreakdown,
    incidentCount: matchedIncidents.length,
    fatalityCount,
    verifiedCameras,
    candidateCameras,
    summary: buildAreaSummary(
      area,
      posture,
      matchedIncidents,
      fatalityCount,
      verifiedCameras,
      candidateCameras,
      matchedNarratives.length,
      humanitarianSnapshot,
    ),
    watchpoints: area.watchpoints,
    signals: buildSignals(
      matchedIncidents,
      verifiedCameras,
      candidateCameras,
      matchedNarratives.length,
      humanitarianSnapshot,
      leadIndicator,
    ),
    recommendedAction:
      posture === "priority"
        ? `${area.actionTitle}. Escalate cross-agency coordination immediately.`
        : posture === "watch"
          ? `${area.actionTitle}. Keep provincial leads on a tighter check-in cycle.`
          : `${area.actionTitle}. Maintain normal monitoring and keep scout coverage moving.`,
  };
}

function buildConcerns(areas: BorderAreaStatus[]): BorderCommandConcern[] {
  return areas.flatMap((area) =>
    area.watchpoints.slice(0, 2).map((watchpoint, index) => ({
      id: `${area.id}-concern-${index + 1}`,
      areaId: area.id,
      areaLabel: area.label,
      label: watchpoint,
      posture: area.posture,
      detail: area.summary,
      metric:
        area.incidentCount > 0
          ? `${area.incidentCount} incidents`
          : `${area.verifiedCameras}/${area.candidateCameras} feeds`,
    })),
  );
}

function buildActionQueue(areas: BorderAreaStatus[]): BorderActionItem[] {
  return areas.map((area) => ({
    id: `${area.id}-action`,
    areaId: area.id,
    areaLabel: area.label,
    title: area.recommendedAction,
    detail:
      area.posture === "priority"
        ? `${area.label} is the lead intervention area because it combines live field pressure with the highest command score.`
        : area.posture === "watch"
          ? `${area.label} needs a governor-ready check because pressure is building faster than static reporting can show.`
          : `${area.label} is stable enough to monitor, but the current watchpoints still need visible ownership.`,
    owner: BORDER_AREAS.find((candidate) => candidate.id === area.id)?.actionOwner ?? "Border command",
    posture: area.posture,
  }));
}

function buildHeadline(areas: BorderAreaStatus[]) {
  const lead = areas[0];

  if (!lead) {
    return "Tri-border command picture is synchronizing.";
  }

  return `${lead.label} is the lead intervention area today`;
}

function buildSummary(areas: BorderAreaStatus[]) {
  const lead = areas[0];
  const support = areas[1];

  if (!lead) {
    return "No border command picture is available yet.";
  }

  if (!support) {
    return lead.summary;
  }

  return `${lead.summary} ${support.label} remains the secondary watch line for this cycle.`;
}

export async function loadBorderMovements(): Promise<RefugeeMovement[]> {
  return buildBorderMovements(await loadBorderOsint());
}

export async function loadBorderCommandBrief(): Promise<BorderCommandBrief> {
  const cached = briefCache[0];

  if (cached && Date.now() - cached.cachedAt <= BORDER_BRIEF_TTL_MS) {
    return cached.payload;
  }

  const [incidents, indicators, osint] = await Promise.all([
    loadBorderIncidents(),
    loadThailandEconomics(),
    loadBorderOsint(),
  ]);
  const truthfulOsint = filterTruthfulBorderOsint(osint);

  if (
    incidents.length === 0 &&
    indicators.length === 0 &&
    truthfulOsint.signals.length === 0 &&
    truthfulOsint.humanitarian.length === 0
  ) {
    throw new PlaybackApiError(
      "LIVE_DATA_UNAVAILABLE",
      "No live border-command inputs are available for the current cycle.",
    );
  }

  const cameras = listCriticalCameras();
  const leadIndicator = selectLeadIndicator(indicators);
  const areas = BORDER_AREAS.map((area) =>
    buildAreaStatus(
      area,
      incidents,
      cameras,
      truthfulOsint.signals,
      truthfulOsint.humanitarian,
      leadIndicator,
    ),
  ).sort((left, right) => {
    if (postureRank(right.posture) !== postureRank(left.posture)) {
      return postureRank(right.posture) - postureRank(left.posture);
    }

    return right.score - left.score;
  });
  const topConcerns = buildConcerns(areas).sort((left, right) => {
    if (postureRank(right.posture) !== postureRank(left.posture)) {
      return postureRank(right.posture) - postureRank(left.posture);
    }

    return right.metric.localeCompare(left.metric);
  });
  const actionQueue = buildActionQueue(areas).sort((left, right) => {
    if (postureRank(right.posture) !== postureRank(left.posture)) {
      return postureRank(right.posture) - postureRank(left.posture);
    }

    return left.areaLabel.localeCompare(right.areaLabel);
  });
  const overallScore = Math.max(...areas.map((area) => area.score), 0);
  const payload: BorderCommandBrief = {
    generatedAt: new Date().toISOString(),
    headline: buildHeadline(areas),
    summary: buildSummary(areas),
    overallPosture: postureFromScore(overallScore),
    overallScore,
    overallScoreMethod: `max(${areas.map(a => `${a.label}:${a.score}`).join(", ")})`,
    areas,
    topConcerns: topConcerns.slice(0, 6),
    actionQueue: actionQueue.slice(0, 4),
    sources: [
      ...osint.sources
        .filter((source) => source.status !== "offline")
        .map((source) => source.label),
      "Border incident monitor",
      "Reference market indicators",
      "Critical camera network",
    ],
  };

  briefCache[0] = {
    payload,
    cachedAt: Date.now(),
  };

  return payload;
}
