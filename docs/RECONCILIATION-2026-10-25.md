# Agent-work reconciliation · 25 October 2026

Scope: fetched all origin branches; checked this checkout, registered worktrees,
stash names/paths, six PRs, merge history and patch-equivalent commits. No stash
was popped, dropped or overwritten. One registered worktree; checkout initially clean.

## Disposition

| Work | Evidence | Decision |
| --- | --- | --- |
| PR6, `52eb1d5`, merged into main | OSM light / Esri Dark Gray replacement absent from overhaul | Merge main into overhaul, keeping current Worker docs and environment template. |
| PR5, civic README | Equivalent illustration, ethics, MIT licence and updated deployment instructions already on overhaul | Preserve current documentation; do not restore Mapbox/Fly claims. |
| PR4, overhaul | Live Worker branch, open PR marked conflicting before reconciliation | Resolve divergence with main; preserve later security, research and responsive work. |
| PR3, `72ef27d` | Phuket map has validated view-state guard; `d2700f2` documentation already represented | No duplicate cherry-pick. Earlier Vercel infrastructure is superseded by Worker deployment. |
| PR2, `42b7a6f` | Status strip fetches traffic, earthquakes, floods, disasters and commodities; map engine has traffic layers | Preserve current equivalents, including later failure-state safeguards. |
| PR1, closed | ASEAN economics, manual and explorer present in current tree | Preserve existing implementation and explorer authentication. |
| clocks/equity branches, `94b93b1` | TopBar has ten IANA clocks; reference-data has five Yahoo symbols | Already incorporated despite differing patch hashes. No obsolete Pages/edge-runtime migration. |
| `stash@{0}` | Parked clocks-equity/map WIP | Remains intact and recoverable. Never bulk-apply over months of later fixes. |
| Stashed fire/flight fallback changes | Restore mock-as-live behavior | Reject those changes; retain fail-closed current routes. |
| Stashed frontier-news route | Empty placeholder versus current substantive implementation | Reject replacement. |
| Stashed keyboard controls / FlyToTarget | Useful unpublished interaction | Candidate: needs modal isolation, focus handling and single-character shortcut opt-out. |
| Stashed request coalescing | Useful per-isolate deduplication, but silently serves stale results | Candidate: require bounded retention, freshness metadata and concurrency/error tests before wiring. |
| Stashed AlphaEarth / TimesFM artifacts | Missing run/capture provenance; forecast has no source identifiers for 365 input values | Preserve, do not present as verified observations or current forecasts. |
| `fa4bff0` source-research notes | Useful GISTDA catalog; credential-related text in prose | Research candidate only; redact and independently verify contracts before reuse. No credential text copied here. |
| gh-pages | Generated static mock demonstration | Not a production source branch; do not merge generated output. |

Branch ancestry alone does not prove an idea is missing. `git cherry` helped find
candidates; file behavior and current contracts determined the decisions above.

## Design receipt

Task: compare Thailand frontier signals, locate them on the map, then inspect
source-linked evidence without losing the map's context.

Design read: a geographic instrument with a readable evidence desk, not a wall
of equally loud cards. Reference: Braun ET66's restrained control hierarchy and
Reuters' clear separation of headline, attribution and timestamp.

Conserved: live map/canvases, overlays, ticker, clocks, status strip, playback,
research, markets, cameras, sidebar and alternate Phuket surface.

Palette's contextual-type and Bauhaus skills informed the change: Jost supplies
both display and body roles; JetBrains Mono retains aligned data. Two families
replace three. Jost 300/400/600/700 and Mono 400/500/700 are self-hosted by next/font
with swap and technical fallbacks. Both are SIL Open Font License families.
Existing text sizes and data colors remain unchanged. This is a scoped font
change, not a claim that typography alone repairs the full composition.

The former Josefin display / Source Sans body split gave short labels a separate
display voice without an operating need. A full-screen map with evidence accessed
only through drawers was rejected: it would make comparison unnecessarily modal.
The existing map-first composition remains while its space costs are measured.

Human usability and fluent-language review have not been performed. Source guards
are not visual proof. First-screen MSH and independent screenshot findings must
be recorded against the tested release, not inferred from a successful build.

## Remaining system-audit work

- Correct stale runtime-status descriptions that still promise packaged rows.
- Verify provider observation timestamps rather than client receipt times.
- Replace the static-build shell's swallowed exit status and fixed /tmp backups.
- Audit cron failures masked by workflow continue-on-error.
- Reassess development-tool advisories without forcing obsolete adapter downgrades.
- Recover useful parked interactions only with tests and honest data contracts.
- Continue MSH audit of stacked bottom bands and short-height desktop map space.

## Implemented in this release

- Next16.4.3 / OpenNext1.20.13 includes the upstream preview-manifest repair and
  patches the October Next security advisories. `follow-redirects`1.16.1 closes
  the reported cross-origin credential-header issues. Production audit is zero;
  seven development-tool advisories remain, explicitly not counted as fixed.
- Evidence comparison uses a viewport-proportioned180–260px allocation instead
  of a hard340px desktop band. All evidence and news content is preserved.
- Map controls remain within their map at desktop widths; nonshrinking groups
  preserve controls, and scrolling reaches the final action. The earlier desktop
  override made them unbounded and unreachable below the clipped map.
- Playwright now collects its9 browser specs, not Node backend tests.
- 31 backend tests, separate map/research rendered gates, and mutation checks
  protect the release. These checks do not replace visual or human review.

Independent review: older PR/branch equivalents confirmed; mock-as-live stash
changes rejected; useful unpublished candidates preserved. Initial font captures
had no new font blocker, but were loading states. Settled captures confirmed the
shallow map and cut-off selector; both were repaired. Compacting the evidence
band exposed the collapsing radar, now given a stable180px plotting area and
scroll access. Final release captures require independent visual disposition.

Measured preview:390×844 map766.25px/header52px;1024×900 and1440×900 map381.25px
(was293px), header72px and evidence252px (was340px). Header consumes6.2%/8%/8%;
ticker, playback and loaded status together consume about21% on desktop.
No document horizontal overflow in these captures. This is an improvement, not
a clean whole-system MSH verdict: stacked bottom chrome, low-contrast metadata,
long control lists and the inherited white control styling still need work.

Verification limits:31 backend tests; research141width geometry and mutation;
map three viewports, final-control hit-test and mutation; actual Jost font faces
loaded; dynamic status200 and unauthenticated cron401 on packaged Worker.
Changed-file lint is clean except the pre-existing map set-state-in-effect rule
at the dams effect, which this release does not alter. Full browser suite was
discovered (9 tests), not claimed executed. Phuket loaded its real content with
no page errors at the diagnostic visit; a full alternate-surface audit is pending.

Upstream security references: [Next October security update](https://nextjs.org/blog/nextjs-security-update-october-14-2026),
[OpenNext preview-manifest repair](https://github.com/opennextjs/opennextjs-cloudflare/pull/1356),
[redirect credential stripping advisory](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8).
Font-blocked375/768/1280px probes kept Research hit-testable with no document overflow.
Both GitHub verification jobs passed on5e67dd8. This does not erase the remaining
development-tool advisories or inherited MSH issues listed above.

Final independent-review disposition: settled map/overlays preserved at all three
sizes; desktop map and selector repair accepted. Reviewer found phone database
status truncation introduced by the wider brand. Replaced only “not configured”
with truthful “no database”, kept full status in title, prevented status shrink,
and extended the width gate to assert unclipped text. Inherited weak selector
contrast, low first-news visibility and horizontally dense bottom status remain
open. Radar detail capture is required to close the compact-chart review.

## Final scoped visual closure and live receipt

Independent reviewer inspected the settled three-size captures and scrolled
radar/selector details. Phone text-fit finding closed: full NO DATABASE, Research
and brand remain visible. Full radar polygon, five axis labels and legend visible;
lower selector controls contained and reachable. No introduced blocker remains
in the reviewed changes. This is explicitly not an overall MSH pass.

Rules1–7 disposition:1) oversized evidence band reduced and selector contained;
2) map restored as the larger geographic surface, crowded lower controls remain;
3) existing readable prose measures preserved, no wide full-screen prose added;
4) actual Jost/Mono loaded, fallback probes passed;5) no decorative elements added;
6) map height293→381.25px, live overlays preserved;7) inherited low-contrast
selector caption, first-news displacement and dense horizontal status remain.
Feed-integrity labeling still needs a separate semantic audit. Enlarged-text and
human task testing are unverified, not represented by automated geometry checks.

Worker`9b1bc000-468d-4dcc-9913-447b93a1b085` deployed with source`aee9184`;
subsequent changes are test/receipt only. Both live domains returned200, served
CSS`bc6ccf60e56dc76c.css` matching the packaged artifact SHA256, returned200 for
dynamic status and401 for unauthenticated snapshot cron. Live research gate
passed141widths with the loaded phone-status fixture and stretched-dialog mutant.
The runtime still truthfully reports no production database; deployment did not
repair the historical archive. The shared-memory compatibility lesson was updated
only after these live checks.

This reconciliation is not a claim that every public dataset has been exhausted,
the historical production database is repaired, or the full system audit is done.
