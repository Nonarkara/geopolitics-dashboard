# Geopolitics Dashboard

ASEAN regional command center — 14-layer satellite maps, live news ticker, YouTube TV feeds (Burma, Cambodia, Malaysia), AI incident analysis, ASEAN atomic clocks, economic stats. Designed for 72-inch presentation screens.

Live: `geopolitics-dashboard.fly.dev` (Fly.io)

## Tech Stack

Next.js 16 + React 19 + TypeScript + Tailwind 4 + Deck.gl 9.2 + Mapbox GL + Supabase + Framer Motion

## Build & Deploy

```bash
npm run dev                # Dev server (Turbopack)
npm run build              # Production build (standalone output)
flyctl deploy              # Deploy to Fly.io (Docker multi-stage)
```

Type-check before every build: `tsc --noEmit`

Deployment: Fly.io with Docker multi-stage build (`Dockerfile`). Config in `fly.toml`. Region: `sin` (Singapore). The app runs Node.js — no edge runtime restrictions.

## Design System

### Tokens (in `src/app/globals.css`)

```css
/* Tactical Precision Palette */
--bg: #f2f2f0;        --bg-raised: #ffffff;   --bg-surface: #ffffff;
--ink: #000000;       --muted: #555552;        --dim: #999994;
--line: #000000;      --line-dim: #e0e0dc;

--accent: #ff3b30;    /* Apple Alert Red — critical incidents */
--hazard: #ff9500;    /* Apple Warning Orange — elevated */
--safe: #34c759;      /* Confirmed safe / data fresh */
--tech: #007aff;      /* Precision Blue — UI chrome, links */
--danger: #ff3b30;    --success: #34c759;

/* Signal Intensity Border System */
--signal-none:     rgba(0,0,0,0.06);
--signal-low:      rgba(0,122,255,0.25);
--signal-medium:   rgba(255,149,0,0.45);
--signal-high:     rgba(255,59,48,0.6);
--signal-critical: rgba(255,59,48,0.9);
```

### Typography Scale (Major Third 1.25)

```css
--text-xs: 0.625rem;    --text-sm: 0.75rem;    --text-base: 0.875rem;
--text-md: 1rem;        --text-lg: 1.25rem;    --text-xl: 1.5rem;
--text-2xl: 2rem;       --text-3xl: 2.5rem;
```

Fonts: `--font-display: "Josefin Sans"` (headings), `--font-ui: "Source Sans 3"` (body/UI), `--font-mono: "JetBrains Mono"` (data/code)

**Banned fonts (§11.10):** Never use Roboto, Inter, Poppins, Montserrat, Open Sans, or Lato.

### Layout Rules

- **1920×1080 base** — CSS `transform: scale()` auto-scales to any screen
- **Zero border-radius** — `border-radius: 0 !important` across all elements
- **Connected grid** — `1.5px` gap on `var(--line)` background; cells use `var(--bg-surface)`
- **Glass morphism** — `backdrop-filter: blur(20px) saturate(180%)` via `var(--glass)`
- **Ease** — `--ease: cubic-bezier(0.23, 1, 0.32, 1)` for all transitions
- **Page entry** — `@keyframes pageEnter { from { opacity:0; translateY(6px) } to { opacity:1; translateY(0) } }` at 400ms

### Design Law

**No decorative elements. Every pixel must carry information.** Jony Ive × Dieter Rams × NY Subway signage. If an element does not communicate data, remove it.

---

## Code Patterns

### Type System

All domain entities must be strict TypeScript interfaces. Use discriminated unions for state that has multiple shapes. Confidence levels on every data claim:

```typescript
type DataConfidence = "verified" | "derived" | "field-estimated" | "stale";

interface IncidentClaim {
  value: string | number;
  source: DataSource;
  confidence: DataConfidence;
  observedAt: string; // ISO 8601
}
```

Theater types (not loose strings):

```typescript
type Theater = "myanmar" | "cambodia" | "malaysia" | "thailand" | "laos" | "vietnam";
type SignalChannel = "acled" | "gdelt" | "nasa-firms" | "hdx" | "ais" | "manual" | "press";
type IncidentSeverity = "critical" | "high" | "medium" | "low" | "informational";
```

### Data Layer — Multi-Tier Caching

Every data fetch follows this pattern (from SCITI `cityApi.ts`):

```typescript
async function fetchJson<T>(url: string, retries = 2, backoff = 300): Promise<T> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      if (retries > 0 && res.status >= 500) {
        await new Promise(r => setTimeout(r, backoff));
        return fetchJson(url, retries - 1, backoff * 2);
      }
      throw new Error(`Request failed: ${res.status}`);
    }
    const envelope = await res.json() as { success: boolean; data: T; error?: string };
    if (envelope.success === false) throw new Error(envelope.error || "API failure");
    return envelope.data;
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return fetchJson(url, retries - 1, backoff * 2);
    }
    throw error;
  }
}
```

Cache priority:
1. **In-memory module cache** (sync, instant)
2. **Supabase HTTP** (`supabase-js`)
3. **PostGIS direct TCP** (`pg` — lazy dynamic import, falls back gracefully)
4. **Mock fallback** (static export mode, dev without DB)

### API Response Envelope

All `/api/*` routes must return this shape:

```typescript
{ success: boolean; data: T; error?: string }
// On error: { success: false; data: null; error: "reason" }
// Never throw raw errors to the client — always envelope
```

### Playback Mode Contract

Historical time-window queries must always return `200`:

```typescript
// Valid time window, data exists: { success: true, data: [...], mode: "historical" }
// Valid time window, no data:     { success: true, data: [], mode: "historical-empty" }
// Invalid time window:            { success: false, error: "invalid range" } // 400
// Never return 404 for playback routes
```

### Evidence Registry

Every data point shown to the user must have a `DataSource`:

```typescript
interface DataSource {
  id: string;
  name: string;
  url: string;
  type: "satellite" | "acled" | "gdelt" | "government" | "ais" | "manual" | "press";
  freshness: "live" | "daily" | "weekly" | "annual";
}
```

Aggregate intelligence items carry `confidence: DataConfidence` derived from the weakest contributing source.

### Component Patterns

**Error boundary** — wrap every theater panel and map layer independently. A failed panel must not crash the whole dashboard.

```typescript
// ErrorBoundary wraps each <TheaterPanel>, <MapLayer>, <SignalTicker>
// Fallback: gray panel with panel name + "Data unavailable" — never blank white
```

**`useInView` hook** — IntersectionObserver for `.reveal` → `.visible` scroll transitions:

```typescript
function useInView(threshold = 0.2): [React.RefObject<Element>, boolean] {
  const ref = useRef<Element>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}
```

**Responsive images** — always `<picture>` with `.webp` primary:

```tsx
<picture>
  <source srcSet="/images/foo.webp" type="image/webp" />
  <img src="/images/foo.jpg" alt="..." loading="lazy" />
</picture>
// Inside overlay containers: position: absolute (never block-level — breaks overflow:hidden)
```

**Loading state** — use the `.loading` CSS class (spinner via `::before`), not custom spinners per component.

---

## AI Integration (Claude API)

Briefing assistant pattern — port from SCITI GeminiChat, adapted for Claude:

- **Model:** `claude-sonnet-4-6` (or latest Sonnet)
- **Pattern:** Client-side, user-supplied API key stored in `localStorage`
- **Key storage:** `localStorage.getItem("geopolitics-claude-key")`
- **RAG context:** Inject per turn — top 5 incidents + active theater briefing + data source list
- **History:** Last 6 messages (sliding window)
- **Config:** `max_tokens: 1024`, `temperature: 0.5` (intelligence, not creative writing)

Request shape (Anthropic Messages API):

```typescript
{
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  temperature: 0.5,
  system: buildSystemPrompt(theaterContext, incidentSummaries, dataSources),
  messages: last6Messages, // { role: "user" | "assistant", content: string }[]
}
```

---

## Database

Supabase PostgreSQL + PostGIS.

**Rule:** `pg` uses lazy dynamic import in `src/lib/db.ts` — falls back gracefully if unavailable. `supabase-js` HTTP client works everywhere.

All geospatial columns require GIST index:

```sql
CREATE INDEX idx_events_geom ON events USING GIST (geom);
```

**Snapshots pattern** — every cron job writes a row to `data_snapshots`:

```sql
-- enables historical playback at any Bangkok-day window
INSERT INTO data_snapshots (table_name, snapshot_date, data) VALUES (...);
```

Redis optional — degrade gracefully (`REDIS_URL` may not be set).

---

## Key Components

| Component | File | Purpose |
|---|---|---|
| TV feeds | `Intelligence/LiveTVPanel.tsx` | YouTube embeds — Burma, Cambodia, Malaysia |
| News ticker | `Intelligence/SignalTicker.tsx` | Signal ticker, refreshes every few minutes |
| ASEAN clocks | `Intelligence/TopBar.tsx` | Atomic clock, ASEAN timezones |
| Map layers | `Map/BorderMap.tsx` | 14 satellite/weather layers, Deck.gl |
| ASEAN logos | `Identity/LogoStrip.tsx` | All flags/logos at top |
| AI analysis | `lib/intelligence.ts` + `lib/convergence.ts` | Incident detection, narrative generation |
| Economic stats | `Sidebar/AseanEconomicsPanel.tsx` | GDP, trade, country indicators |
| Briefing chat | `Intelligence/BriefingChat.tsx` | Claude API briefing assistant |
| Time window | `lib/time-window.ts` | Bangkok UTC+7 day boundaries |
| Live clock | `hooks/useNow.ts` | Re-rendering clock hook |
| News classifier | `lib/news-classifier.ts` | Border color constants |
| Auth | `lib/data-explorer-auth.ts` | Web Crypto HMAC constant-time auth |

---

## Testing

Framework: **Vitest** + `@testing-library/react`. Playwright for UI tests.

Coverage targets:
- Smoke test for each theater panel component
- API route unit tests: mock Supabase client, verify response envelope shape
- Fetch retry logic: verify exponential backoff behavior
- Playback routes: verify `historical-empty` response for no-data windows
- Playwright: live mode + historical playback mode end-to-end

---

## Accessibility

- `.skip-link` — visually hidden, revealed on focus, jumps to `#main-content`
- `:focus-visible` — `2px solid var(--tech)` with `2px` offset (already in `globals.css`)
- All interactive elements must have a visible focus indicator (no `outline: none` on interactive elements)
- `document.documentElement.lang = "en"` set on mount

---

## Static Export Mode

`NEXT_PUBLIC_STATIC_EXPORT=true` + `NEXT_OUTPUT=export` — strips API routes, uses mock data. GitHub Pages demo only.
