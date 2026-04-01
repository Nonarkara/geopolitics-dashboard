"""
GDELT Global Knowledge Graph (GKG) entity ingestion.

Fetches named persons, organizations, themes, and sentiment from the GDELT GKG API.
Stores into gkg_entities table for longitudinal entity tracking and trend analysis.

The GKG updates every 15 minutes and provides extracted metadata from global news.

Usage:
    python ingestion/gkg_ingest.py
"""

import os
import sys
from datetime import datetime, date

import psycopg2
import requests
from dotenv import load_dotenv

from common import REQUEST_TIMEOUT_SECONDS, exit_with_error, fallback_or_raise

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

GKG_API_URL = "https://api.gdeltproject.org/api/v2/gkg/gkg"
GKG_QUERY = "Thailand AND (Myanmar OR Cambodia OR Malaysia OR border OR frontier OR crossing OR conflict)"


def fetch_gkg_data():
    """Fetch GKG entities for Thailand border region from the last 60 minutes."""
    params = {
        "query": GKG_QUERY,
        "format": "json",
        "timespan": "60",
    }

    headers = {
        "Accept": "application/json",
        "User-Agent": "geopolitics-dashboard/6.1",
    }

    for attempt in range(3):
        try:
            response = requests.get(
                GKG_API_URL, params=params, timeout=REQUEST_TIMEOUT_SECONDS, headers=headers
            )

            if not response.ok:
                if attempt < 2 and response.status_code in {429, 500, 502, 503}:
                    import time
                    time.sleep(2 + attempt * 2)
                    continue
                response.raise_for_status()

            text = response.text

            # Detect rate-limiting (GDELT returns plain text errors)
            if "Please limit requests" in text or "quota" in text.lower():
                raise RuntimeError("GDELT GKG rate-limited — will retry next cycle")

            data = response.json()
            return data

        except requests.exceptions.Timeout:
            if attempt < 2:
                continue
            raise

    raise RuntimeError("GKG request failed after 3 retries")


def parse_gkg_entities(data):
    """Parse GKG API response into entity rows."""
    entities = []
    now = datetime.utcnow().isoformat() + "Z"
    ref = date.today().isoformat()

    # GKG responses vary in structure — handle both article-list and summary formats
    articles = []
    if isinstance(data, dict):
        articles = data.get("articles", data.get("gkg_articles", []))
    elif isinstance(data, list):
        articles = data

    # Aggregate entities across all articles
    person_counts = {}
    org_counts = {}
    theme_counts = {}
    tone_sums = {}
    tone_counts = {}
    sources_by_entity = {}

    for article in articles:
        if not isinstance(article, dict):
            continue

        # Extract persons
        persons_raw = article.get("persons", article.get("socialimage_persons", ""))
        if isinstance(persons_raw, str) and persons_raw:
            for person in persons_raw.split(";"):
                person = person.strip()
                if person and len(person) > 2:
                    person_counts[person] = person_counts.get(person, 0) + 1
                    sources_by_entity.setdefault(("person", person), set()).add(
                        article.get("domain", article.get("source", "unknown"))[:80]
                    )

        # Extract organizations
        orgs_raw = article.get("organizations", "")
        if isinstance(orgs_raw, str) and orgs_raw:
            for org in orgs_raw.split(";"):
                org = org.strip()
                if org and len(org) > 2:
                    org_counts[org] = org_counts.get(org, 0) + 1
                    sources_by_entity.setdefault(("organization", org), set()).add(
                        article.get("domain", "unknown")[:80]
                    )

        # Extract themes
        themes_raw = article.get("themes", "")
        if isinstance(themes_raw, str) and themes_raw:
            for theme in themes_raw.split(";"):
                theme = theme.strip()
                if theme and len(theme) > 2:
                    theme_counts[theme] = theme_counts.get(theme, 0) + 1

        # Extract tone
        tone_raw = article.get("tone", "")
        if isinstance(tone_raw, str) and tone_raw:
            try:
                tone_value = float(tone_raw.split(",")[0])
                for entity_type_map in [person_counts, org_counts]:
                    for name in entity_type_map:
                        tone_sums[name] = tone_sums.get(name, 0) + tone_value
                        tone_counts[name] = tone_counts.get(name, 0) + 1
            except (ValueError, IndexError):
                pass

    # Build entity rows
    for person, count in sorted(person_counts.items(), key=lambda x: -x[1])[:30]:
        avg_tone = tone_sums.get(person, 0) / max(tone_counts.get(person, 1), 1)
        srcs = list(sources_by_entity.get(("person", person), set()))[:5]
        entities.append({
            "entity_type": "person",
            "entity_name": person[:200],
            "mention_count": count,
            "avg_tone": round(avg_tone, 3),
            "source_count": len(srcs),
            "first_seen": now,
            "last_seen": now,
            "sample_sources": srcs,
            "ref_date": ref,
        })

    for org, count in sorted(org_counts.items(), key=lambda x: -x[1])[:30]:
        avg_tone = tone_sums.get(org, 0) / max(tone_counts.get(org, 1), 1)
        srcs = list(sources_by_entity.get(("organization", org), set()))[:5]
        entities.append({
            "entity_type": "organization",
            "entity_name": org[:200],
            "mention_count": count,
            "avg_tone": round(avg_tone, 3),
            "source_count": len(srcs),
            "first_seen": now,
            "last_seen": now,
            "sample_sources": srcs,
            "ref_date": ref,
        })

    for theme, count in sorted(theme_counts.items(), key=lambda x: -x[1])[:20]:
        entities.append({
            "entity_type": "theme",
            "entity_name": theme[:200],
            "mention_count": count,
            "avg_tone": None,
            "source_count": 0,
            "first_seen": now,
            "last_seen": now,
            "sample_sources": [],
            "ref_date": ref,
        })

    return entities


def mock_gkg_data():
    ref = date.today().isoformat()
    now = datetime.utcnow().isoformat() + "Z"
    return [
        {"entity_type": "person", "entity_name": "Prayuth Chan-ocha", "mention_count": 5, "avg_tone": -1.2, "source_count": 3, "first_seen": now, "last_seen": now, "sample_sources": ["bangkokpost.com"], "ref_date": ref},
        {"entity_type": "organization", "entity_name": "UNHCR", "mention_count": 8, "avg_tone": 0.5, "source_count": 4, "first_seen": now, "last_seen": now, "sample_sources": ["reuters.com"], "ref_date": ref},
        {"entity_type": "theme", "entity_name": "REFUGEES", "mention_count": 12, "avg_tone": None, "source_count": 0, "first_seen": now, "last_seen": now, "sample_sources": [], "ref_date": ref},
    ]


def ingest_gkg_entities(entities):
    if not DB_URL:
        print("DATABASE_URL not configured — dry run:")
        for e in entities[:5]:
            print(f"  [{e['entity_type']}] {e['entity_name']}: {e['mention_count']} mentions")
        print(f"  ... {len(entities)} total entities")
        return len(entities)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    count = 0

    for e in entities:
        cur.execute(
            """
            INSERT INTO gkg_entities
                (entity_type, entity_name, mention_count, avg_tone, source_count,
                 first_seen, last_seen, sample_sources, ref_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (entity_type, entity_name, ref_date)
            DO UPDATE SET
                mention_count = gkg_entities.mention_count + EXCLUDED.mention_count,
                avg_tone = EXCLUDED.avg_tone,
                source_count = GREATEST(gkg_entities.source_count, EXCLUDED.source_count),
                last_seen = EXCLUDED.last_seen,
                sample_sources = EXCLUDED.sample_sources
            """,
            (
                e["entity_type"],
                e["entity_name"],
                e["mention_count"],
                e["avg_tone"],
                e["source_count"],
                e["first_seen"],
                e["last_seen"],
                e["sample_sources"],
                e["ref_date"],
            ),
        )
        count += 1

    conn.commit()
    cur.close()
    conn.close()
    return count


def main() -> int:
    print("Fetching GDELT GKG entities...")
    try:
        raw_data = fetch_gkg_data()
        entities = parse_gkg_entities(raw_data)
    except Exception as e:
        entities = fallback_or_raise(f"GKG fetch failed: {e}", mock_gkg_data)

    if not entities:
        print("  No entities extracted.")
        return 0

    print(f"  Extracted {len(entities)} entities ({sum(1 for e in entities if e['entity_type'] == 'person')} persons, "
          f"{sum(1 for e in entities if e['entity_type'] == 'organization')} orgs, "
          f"{sum(1 for e in entities if e['entity_type'] == 'theme')} themes)")

    count = ingest_gkg_entities(entities)
    print(f"  → {count} rows upserted into gkg_entities")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        sys.exit(exit_with_error("GKG ingest", e))
