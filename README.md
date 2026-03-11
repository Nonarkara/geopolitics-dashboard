# Geopolitics Dashboard

Map-first monitoring dashboard for Thailand-border security, market stress, rainfall anomalies, fires, and population movement. The frontend is a Next.js app; the data layer is PostgreSQL/PostGIS plus Python ingestion scripts.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Deck.gl + react-map-gl
- PostgreSQL + PostGIS
- Python ingestion for conflict, market, fire, rainfall, and refugee datasets

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL with PostGIS installed
- Python 3.9+ if you want to run ingestion

## Environment

Create a local env file:

```bash
cp .env.example .env
```

Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: public Mapbox token for basemaps
- `FIRMS_KEY`: NASA FIRMS key for live fire ingestion
- `REFERENCE_DASHBOARD_URL`: optional external reference feed for incidents, market cards, and trend adapters
- `OPENAI_API_KEY`: optional AI summary key for package headline/priority synthesis
- `OPENAI_MODEL`: optional Responses API model override for intelligence summaries

## Setup

Install frontend dependencies:

```bash
npm install
```

Initialize the database schema:

```bash
./scripts/setup-db.sh
```

Install ingestion dependencies if needed:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r ingestion/requirements.txt
```

## Run

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The UI can still render with fallback data if the database is not populated yet, and it can also pull incidents, package sources, and market cards from the external reference dashboard.

## Ingestion

Run whichever scripts you need:

```bash
python ingestion/acled_ingest.py
python ingestion/hdx_ingest.py
python ingestion/firms_ingest.py
python ingestion/rainfall_ingest.py
python ingestion/refugee_ingest.py
python ingestion/fetch_borders.py
```

## Quality Checks

```bash
npm run lint
npm run build
```

## Render Deployment

This repo now includes a root `render.yaml` for a single Render web service.

- Required for a real basemap: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- Optional for live backend data: `DATABASE_URL`
- If `DATABASE_URL` is omitted, the app still boots and the API routes serve fallback sample data

To deploy with the Blueprint flow, push the repo to GitHub, GitLab, or Bitbucket, then create the Render Blueprint from that repo.

## Data Flow

1. Python scripts fetch external data and write normalized rows to Postgres.
2. Next.js API routes combine Postgres data, RSS/search feeds, and reference APIs into cached intelligence packages.
3. React components fetch those routes and render map overlays, charts, package panels, and live signal cards.
