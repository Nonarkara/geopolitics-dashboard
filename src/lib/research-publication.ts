export interface ResearchReference {
  id: number;
  publisher: string;
  title: string;
  url: string;
  locator: string;
  date: string;
  checked: "document-read" | "publisher-index-only";
  boundary: string;
}

export const RESEARCH_PUBLICATION = {
  version: "2026-10-25.1",
  reviewedAt: "2026-10-25",
  title: "Reading pressure at Thailand’s borders",
  subtitle: "What public evidence can establish, what it cannot, and how to investigate the difference.",
  question: "Under what conditions can independent public observations support an assessment of changing border access, civilian pressure or disruption?",
  authorship: "Thailand Geopolitical Watch research notes. AI-assisted synthesis, checked against the cited publisher material; not an externally peer-reviewed study.",
  scope: "A methods-led assessment and three inquiry protocols, not a current incident bulletin, a validated forecast, or a claim that every public dataset has been exhausted.",
  sections: [
    {
      id: "coverage-audit", heading: "What the dashboard actually returned on 25 October 2026",
      paragraphs: [
        "A metadata-only capture completed at 05:03:31 UTC inspected four public dashboard endpoints once. The archive returned HTTP 200 with zero signal records while the status endpoint declared the database not configured. The news endpoint returned one record; the humanitarian endpoint returned nine; the earthquake endpoint returned seventeen. These are counts of returned records in that capture, not independent events, a provider census or a measure of regional coverage. The capture retains request times, returned metadata and hashes of the original response bodies. [12]",
        "The archive result could not support the conclusion that no signals occurred: the storage service was unavailable. The revised research routes distinguish that failure with HTTP 503 and an unavailable state. A working query that finds no matches remains a different result. The news record was labelled with a January 2025 date, so its appearance in a recently fetched feed did not establish a newly occurring displacement event. [12]",
        "The first humanitarian title described a snapshot as of 30 September 2026 while its feed publication date was 22 October. Those two dates answer different questions. The document itself was not independently inspected in this capture; no finding about its population totals is made. Code inspection also found that an HDX catalog entry was given the retrieval time as its report date. The loader now leaves that publication date unknown and retains catalog modification time separately. This is an audit of the system’s evidence handling, not an empirical study of changing border conditions. [12]",
      ],
    },
    {
      id: "finding", heading: "Central principle: trace agreement to its reporting chains",
      paragraphs: [
        "This dashboard can help a reader ask better questions about a frontier. It cannot make the frontier completely observable. A useful assessment joins a reported event, a place, a time and a plausible consequence, then tests whether another observation supports that connection. A brighter map or a larger collection of feeds does not by itself strengthen the connection.",
        "Consider a report of a crossing closure beside a thermal detection. The two observations are compatible with disruption, but compatibility is not confirmation. The report may repeat an old notice; the thermal detection may belong to agricultural burning. The defensible first conclusion is that access needs checking. A stronger conclusion requires dated crossing information and independent evidence that the relevant route was affected. This is an analytical example, not a report that such an event has occurred.",
        "Our assessment is therefore conditional: public feeds support a reviewable situational picture when their observation windows, geographic precision, units and source lineage are retained. They do not support a universal probability of conflict. The protocols below are proposed investigations. They have not been validated against a complete regional ground-truth dataset.",
      ],
    },
    {
      id: "units", heading: "First decide what is being counted",
      paragraphs: [
        "A news article, a coded event, a detected thermal pixel and a person registered for protection are different units. ACLED describes its records as reported events and warns about combining them with datasets built around other units. Its codebook also distinguishes location precision and treats fatality figures as estimates that can be revised. A mapped coordinate should not erase those qualifications. [1]",
        "GDELT’s DOC API searches monitored news coverage; it is not a census of events. Ten matching articles may reflect ten investigations, one syndicated report or an indexing change. ReliefWeb’s report schema separately identifies the originating organization and original publication time. Retain those fields when following a report through an aggregator. [2] [3]",
        "Proposed rule: count documents when measuring attention, distinct documented events when measuring event activity, and people only when the population definition and reference date are explicit. Never add these quantities into a physical total. A composite score may combine transformed indicators for triage, but its weights are a design choice, not a measurement unit or a calibrated probability.",
      ],
    },
    {
      id: "myanmar", heading: "Myanmar frontier: distinguish a population stock from a new movement",
      paragraphs: [
        "The first research question is whether conditions at a specified crossing or shelter catchment have changed, not whether a national headline looks severe. UNHCR’s Thailand material distinguishes the long-standing camp population, urban protection populations and newer arrivals. That distinction is relevant to any comparison, but the publisher’s pages could not be retrieved directly during this review; only publisher-indexed material was available. No current population total is asserted here. [4]",
        "Proposed protocol: establish a named crossing and reporting window; retain the original humanitarian report, its population definition and its observation period; then look for an independently produced access notice or event record covering the same place and time. Shelter occupancy, registered refugees and newly reported arrivals must remain separate series. A stable registered total cannot establish that no new movement occurred, and a changed total cannot by itself establish the route or cause of movement.",
        "The working hypothesis is that a reported movement and a documented access constraint may together identify an assistance or verification need. Competing explanations include a registration update, reporting lag, a changed catchment, weather-related access loss or repeated publication of the same report. The hypothesis should be weakened if the original report describes an earlier period, if its denominator changes, or if independent crossing information shows normal access. These are tests to run, not findings already demonstrated by the application.",
      ],
    },
    {
      id: "cambodia", heading: "Cambodia frontier: separate access disruption from attention",
      paragraphs: [
        "A crossing can attract coverage without a measurable change in movement, and a movement interruption can occur with little coverage. For the Cambodia-facing operating area, the proposed research question is narrow: did access, queue duration or throughput change at the named crossing during the stated window? A daily count of headlines cannot answer that question by itself. The distinction follows the units problem in event and news data. [1] [2]",
        "Proposed protocol: start with a dated crossing notice or an attributable field report. If a public queue image is used, preserve its capture time and treat it as a limited view, not a vehicle count for an entire day. If a throughput series is obtained, record its direction, vehicle or passenger category, collection method and coverage. Compare equivalent weekdays and operating periods before describing an anomaly. This application does not currently establish a complete crossing-throughput baseline.",
        "The hypothesis is that corroborated access constraints may explain a local mobility interruption. Alternatives include an ordinary peak period, an administrative inspection, a changed camera view, an equipment outage or weather. An official reopening notice, a corrected timestamp or normal matched-period throughput would change the assessment. Neither a silent AIS feed nor a flight-track count is a substitute for the missing land-crossing observation.",
      ],
    },
    {
      id: "south", heading: "Deep South and Malaysia-facing crossings: keep the questions separate",
      paragraphs: [
        "Domestic incident activity and cross-border movement are not the same research outcome. A report mentioning Pattani, Yala or Narathiwat needs geographic review; it should not automatically become evidence of disruption at a Malaysia-facing crossing. The interface’s theatre labels are organizational aids. They do not establish the location, actor or consequence of a particular report.",
        "Proposed protocol: define one outcome for the inquiry, such as a documented incident, an access restriction or a humanitarian consequence. Preserve the event’s location precision and identify whether the report concerns a province, a district, a crossing or an unspecified area. For a cross-border spillover claim, require evidence on both sides of the claimed relationship and a stated mechanism connecting them. ACLED’s event and location fields provide relevant distinctions, but do not supply that causal connection automatically. [1]",
        "The hypothesis is that particular incidents may affect a particular route or civilian service. Competing explanations include unrelated local events, a reporting burst and an imprecise regional label. A well-dated report locating the event elsewhere, or evidence that the proposed route remained open, should reduce confidence. The burden of proof rises when an assessment names an actor or could affect a person’s safety. Public research should not expose the precise movement of vulnerable individuals.",
      ],
    },
    {
      id: "satellites", heading: "Satellite evidence: observation is narrower than the picture",
      paragraphs: [
        "NASA’s FIRMS notes identify several reasons a fire may go undetected, including overpass timing, cloud, smoke and canopy. A detection supports a thermal observation at an acquisition time; an absence of detections is not a general assurance of safety. Interpreting a hotspot as an attack, a damaged building or a cause of displacement requires additional evidence. [5]",
        "NASA GIBS delivers visualizations of Earth-observation data as map tiles. That is useful for inspection, but the display should not be mistaken for a ready-made change estimate. A credible before/after comparison records the actual acquisitions, product, resolution, projection, cloud or quality mask and processing steps. A static cloudless composite is context, not a photograph of the current moment. [6]",
        "Sentinel-1’s radar capability offers observations when illumination or cloud obstructs an optical view. The mission capability does not make every bright or dark radar change a flood, vessel or damaged structure. Proposed SAR work must document preprocessing and acquisition geometry, establish a suitable baseline and test non-target explanations. This dashboard’s research catalogue is not evidence that a validated SAR change-detection pipeline has been implemented. [7]",
        "Likewise, the Open-Meteo air-quality API supplies model products. Modelled air conditions can inform an exposure question, but a grid value is not a street-level monitor or proof that a nearby mapped hotspot caused the pollution. Comparing these products is a research design requiring aligned time and space, not a causal result obtained by displaying two layers. [8]",
      ],
    },
    {
      id: "absence", heading: "A missing feed is an observation about the system",
      paragraphs: [
        "There are at least three distinct empty states: an available source returned no matching records; a source did not answer; or the archive does not exist for the requested period. Only the first is a measured empty query result, and even then it concerns the source’s coverage rather than the whole world. The other two are limits on what this system can know.",
        "OpenSky’s publisher-indexed FAQ describes uneven receiver coverage and limitations affecting some aircraft. Direct retrieval timed out during this review, so that source remains partially checked. The bounded conclusion is that a missing track cannot be treated as proof of an absent flight. No claim of complete aircraft or military coverage follows from an available tracking layer. [9]",
        "Proposed decision rule: if a necessary source fails, retain the last observation only with its original age and an explicit stale state, or display unavailable. Do not manufacture a zero, reset the observation time to the fetch time, or turn an outage into a calm condition. A fallback to current reports can support reading, but it cannot fill a missing historical series or preserve a historical comparison.",
      ],
    },
    {
      id: "analysis", heading: "Co-occurrence is a screening device, not a spillover finding",
      paragraphs: [
        "The correlation route counts distinct complete UTC days on which two regions share at least one archived signal type, divided by the requested number of days. Several shared types on one day still count as one day. This replaces a legacy calculation that could count the same day repeatedly. The fraction is neither a Pearson correlation coefficient nor a causal estimate or calibrated probability. Two heavily reported regions can share many active days without one influencing the other. A shared news cycle can generate co-occurrence even when underlying conditions are unrelated. The method remains descriptive and requires an available archive; it is not a validated spillover model.",
        "A stronger study would define the outcome and exposure before inspecting the result, preserve days with no observations separately from days with failed collection, record publisher availability and examine plausible time lags. It would compare the proposed relationship against a baseline and alternative explanations. No sample size, significance level, confidence interval or out-of-sample performance is supplied here because those analyses have not been run.",
        "Annual macroeconomic indicators belong in the structural context, not in an hourly escalation narrative. The World Bank warns that standardization does not guarantee full comparability, and its help desk explains that fiscal-year observations can be assigned to calendar years. Indicator code, unit, reference period and metadata are therefore part of a comparison, not optional footnotes. A fresh download does not make an annual observation a current market reading. [10] [11]",
      ],
    },
    {
      id: "reproduce", heading: "Make an assessment possible to challenge",
      paragraphs: [
        "A reproducible research packet should retain the question, geographic scope, time window and time zone; the exact query and source endpoint; retrieval time and source observation or publication time; source identifiers and original links; inclusion and exclusion rules; duplicate handling; missing-source states; and the transformation or model version. A publication date and a retrieval date answer different questions. The report schema used by ReliefWeb makes the original-document date explicit. [3]",
        "For each conclusion, record the supporting evidence, its independence limits, the alternative explanation and the observation that would change the assessment. Agreement among mirrors of one report is one reporting chain, not independent corroboration. A link labelled as a source is not automatically a primary document. Follow the citation to its origin and mark that origin as unverified if it cannot be inspected.",
        "This publication is a versioned synthesis of the references below and the inspected implementation. Its Markdown and JSON exports contain the same text and source ledger as the reading page. They are not a frozen copy of the dashboard’s changing feed results. Repeating a live query later may produce different material; reproducing a historical study requires an authorized, versioned archive. The production archive remains unavailable, so no complete longitudinal finding is claimed.",
      ],
    },
    {
      id: "agenda", heading: "What would make the research stronger",
      paragraphs: [
        "The next empirical step is a small, auditable case set, not a larger untested composite index. Select a crossing or service interruption with an attributable timeline; collect the original documents and relevant observation products; define the comparison window; then document both supporting and conflicting evidence. A reviewer should be able to reconstruct why an assessment changed without trusting an automated summary.",
        "For satellite work, test a declared target against independently documented cases and retain failed or ambiguous cases. For news research, audit language and publisher coverage as well as duplicates. For movement research, obtain an appropriate public aggregate and document its capture conditions. Useful evaluation asks what was missed, what was falsely inferred, how late evidence arrived and whether a human decision improved. A polished map is not an evaluation dataset.",
        "The assessment here would change if a complete, well-documented archive and independently reviewed case set showed that a proposed indicator reliably distinguishes the target condition from competing explanations. Until then, use the dashboard to inspect and organize evidence, describe model outputs as model outputs, and keep consequential judgments subject to human review. Neither this essay nor the source catalogue establishes professional certification, exhaustive coverage or predictive validity.",
      ],
    },
  ],
} as const;

export const RESEARCH_REFERENCES: ResearchReference[] = [
  { id: 12, publisher: "Thailand Geopolitical Watch", title: "Frozen dashboard metadata coverage audit, 25 October 2026", url: "https://geo.nonarkara.org/research/coverage-audit-2026-10-25.json", locator: "Four endpoint observations, status and response fingerprints", date: "Captured 2026-10-25 at 05:03:31 UTC", checked: "document-read", boundary: "First-party metadata capture. It does not independently verify linked reports, establish event completeness or make the changing response bodies reproducible." },
  { id: 1, publisher: "ACLED", title: "ACLED Codebook", url: "https://acleddata.com/methodology/acled-codebook", locator: "Unit of analysis; event data; geographic precision; reported fatalities", date: "Continuously maintained; reviewed 2026-10-25", checked: "document-read", boundary: "Coding guidance is not independent verification of every recorded event." },
  { id: 2, publisher: "GDELT", title: "GDELT DOC 2.0 API Debuts", url: "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/", locator: "Full-text news search and multilingual coverage", date: "2017-06-20; historical API introduction", checked: "document-read", boundary: "Explains the data product; historical scale/coverage figures are not asserted as current." },
  { id: 3, publisher: "UN OCHA ReliefWeb", title: "Reports — API documentation", url: "https://apidoc.reliefweb.int/publish/reports/", locator: "Field summary: source and published", date: "Publication date not displayed", checked: "document-read", boundary: "Schema documentation does not validate an individual report’s conclusions." },
  { id: 4, publisher: "UNHCR", title: "Thailand country operation", url: "https://www.unhcr.org/where-we-work/countries/thailand", locator: "Protection populations and operational context", date: "Publisher-indexed page checked 2026-10-25", checked: "publisher-index-only", boundary: "Direct retrieval returned 429. Population distinctions are provisional context; no current total is asserted." },
  { id: 5, publisher: "NASA LANCE FIRMS", title: "Fire Alerts: Important Notes", url: "https://firms2.modaps.eosdis.nasa.gov/alerts/notes.php", locator: "Acquisition time; confidence; reasons for missed detections", date: "Publication date not displayed", checked: "document-read", boundary: "Detection limits do not identify a fire’s cause or an actor." },
  { id: 6, publisher: "NASA GIBS", title: "GIBS API introduction", url: "https://nasa-gibs.github.io/gibs-api-docs/", locator: "Overview: visualization tiles and underlying observations", date: "Publication date not displayed", checked: "document-read", boundary: "Rendered tiles are not a validated change-detection result." },
  { id: 7, publisher: "Copernicus Data Space Ecosystem", title: "Sentinel-1", url: "https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-1", locator: "Radar mission and day/night, all-weather capability", date: "Publication date not displayed", checked: "document-read", boundary: "Mission capability does not establish implemented processing or target-classification accuracy." },
  { id: 8, publisher: "Open-Meteo", title: "Air Quality API", url: "https://open-meteo.com/en/docs/air-quality-api", locator: "Data sources, model domains and forecast variables", date: "Publication date not displayed", checked: "document-read", boundary: "Model fields are not measurements from a monitor at the displayed street coordinate." },
  { id: 9, publisher: "OpenSky Network", title: "Frequently asked questions", url: "https://opensky-network.org/about/faq", locator: "Coverage and aircraft tracking limitations", date: "Publisher-indexed page checked 2026-10-25", checked: "publisher-index-only", boundary: "Direct retrieval timed out. This is a partially checked method reference, not a coverage audit of the dashboard’s flight feed." },
  { id: 10, publisher: "World Bank", title: "WDI: Sources and methods", url: "https://datatopics.worldbank.org/world-development-indicators/sources-and-methods.html", locator: "Comparability and methodological limitations", date: "Publication date not displayed", checked: "document-read", boundary: "Country and indicator metadata are still required for each numerical comparison." },
  { id: 11, publisher: "World Bank Data Help Desk", title: "Are all WDI series on a calendar year reporting period?", url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/201203-are-all-wdi-series-on-a-calendar-year-reporting-pe", locator: "Fiscal-year assignment and country/series metadata", date: "Publication date not displayed", checked: "document-read", boundary: "Calendar-year labels do not establish equivalent reference periods across series." },
];

export function researchPublicationMarkdown(): string {
  const p = RESEARCH_PUBLICATION;
  return `# ${p.title}\n\n${p.subtitle}\n\nVersion: ${p.version}. Reviewed: ${p.reviewedAt}.\n\n${p.authorship}\n\nQuestion: ${p.question}\n\nScope: ${p.scope}\n\n` +
    p.sections.map(s => `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}`).join("\n\n") +
    "\n\n## References and access ledger\n\n" + RESEARCH_REFERENCES.map(r =>
      `[${r.id}] ${r.publisher}. ${r.title}. ${r.url}\nSection: ${r.locator}. ${r.date}. Access checked ${p.reviewedAt}: ${r.checked}.\nLimit: ${r.boundary}`
    ).join("\n\n") + "\n";
}
