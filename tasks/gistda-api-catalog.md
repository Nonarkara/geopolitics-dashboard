# GISTDA API Catalog — What We Can Bring Into the Dashboards

**Date:** 2026-05-20
**API Key:** Stored in `.env` as `GISTDA_API_KEY`
**Key type:** Sphere platform key (registered at sphere.gistda.or.th)

---

## Architecture Overview

GISTDA exposes data through **four independent systems**:

| System | Base URL | Auth | Protocol |
|--------|----------|------|----------|
| **Sphere Platform** | `api.sphere.gistda.or.th`, `basemap.sphere.gistda.or.th` | API key (Kong gateway, 401 without key) | REST + tile |
| **GISTDA Portal** | `gistdaportal.gistda.or.th/data/rest/services/` | None (public ArcGIS REST) | Esri REST |
| **GISTDA Open Data** | `opendata.gistda.or.th/api/3/` | None (CKAN) | CKAN REST |
| **Specialized APIs** | `pm25.gistda.or.th`, `cropsdrought.gistda.or.th`, `ocean.gistda.or.th` | None (public) | REST + WMS |

The API key (`RCDV9E...`) authenticates against the **Sphere Platform** and **API Gateway** (`api-gateway.gistda.or.th`). The specialized APIs and GISTDA Portal are **open/public** — no key needed.

---

## Tier 1 — Live Data, Ready to Integrate Now

### 1. PM2.5 Air Quality (Thailand-wide, hourly)

**Source:** `pm25.gistda.or.th` (no auth required)
**Freshness:** Hourly, satellite-derived (not just ground stations)
**Coverage:** All 77 provinces, all 928 districts

| Endpoint | Returns |
|----------|---------|
| `GET /rest/getPm25byProvince` | All 77 provinces ranked by PM2.5, with 24hr average |
| `GET /rest/getPm25byLocation?lat=X&lng=Y` | PM2.5 at exact coordinate + 24hr history graph |
| `GET /rest/getPm25byAmphoe?pv_idn=10` | All districts in a province ranked by PM2.5 |

**Response shape** (province):
```json
{
  "status": 200,
  "data": [{
    "pv_tn": "แม่ฮ่องสอน", "pv_en": "Mae Hong Son", "pv_idn": 58,
    "pm25": 26.82, "pm25Avg24hr": 20.93,
    "dt": "2026-05-20T13:00:00.000Z"
  }]
}
```

**Dashboard integration:** Thailand air quality panel. Northern border provinces (Chiang Mai, Chiang Rai, Mae Hong Son) are critical for the geopolitics dashboard's Myanmar frontier — burning season + cross-border smoke is a geopolitical signal.

### 2. AQI Station Data (187 ground stations, hourly)

**Source:** `api.longdo.com/map3/feed/aqi` (bundled with Sphere SDK, no auth)
**Freshness:** Hourly ground measurements
**Coverage:** 187 stations across Thailand

**Response shape:**
```json
{
  "stations": [{
    "stationID": "02t", "nameEN": "Bansomdejchaopraya Rajabhat University",
    "areaEN": "Hiran Ruchi, Khet Thon Buri, Bangkok",
    "lat": "13.732846", "long": "100.488976",
    "AQILast": {
      "date": "2026-05-20", "time": "13:00",
      "PM25": { "aqi": "21", "value": "12.5" },
      "PM10": { "aqi": "15", "value": "25.0" },
      "O3": { "aqi": "16", "value": "22" },
      "CO": { "aqi": "3", "value": "0.60" },
      "NO2": { "aqi": "1", "value": "2" },
      "SO2": { "aqi": "0", "value": "1" },
      "AQI": { "aqi": "21", "param": "PM25" }
    }
  }]
}
```

**Dashboard integration:** Point layer on the map — each station as a color-coded dot (PM2.5 severity). Combined with the satellite PM2.5 raster for Thailand heatmap overlay.

### 3. Fire Hotspots (MODIS + VIIRS/NPP, daily)

**Source:** `gistdaportal.gistda.or.th` (public ArcGIS REST, no auth)
**Freshness:** Daily (MODIS from Terra/Aqua satellites)
**Coverage:** All Thailand

| Endpoint | Satellite | Fields |
|----------|-----------|--------|
| `FR_Fire/hotspot_daily/MapServer/0/query` | MODIS (Terra/Aqua) | lon, lat, confidence, satellite, datetime, region, land_use, tambon, amphoe, province |
| `FR_Fire/hotspot_npp_daily/MapServer/0/query` | VIIRS (Suomi NPP) | lon, lat, confidence (high/nominal/low), satellite, date, time, province, amphoe, tambon, land_use, zone |

**Query pattern:**
```
GET /data/rest/services/FR_Fire/hotspot_daily/MapServer/0/query
  ?where=1=1&outFields=*&f=json&returnGeometry=true
```

**Dashboard integration:** This is Thailand-specific FIRMS data — higher resolution than the NASA FIRMS feed the dashboard already uses. VIIRS NPP includes confidence levels (high/nominal/low) and Thailand-specific admin boundaries (province, amphoe, tambon). Can replace or supplement the existing `/api/fires` route for Thailand-focused views.

### 4. Carbon Absorption/Emission by Province

**Source:** `cropsdrought-service.gistda.or.th` (no auth)
**Freshness:** Monthly
**Coverage:** All provinces, by region

| Endpoint | Returns |
|----------|---------|
| `GET /api/carbon/getCropsAllRegion?region=Central` | Carbon absorption per province in region (ton CO2) |
| `GET /api/carbon/getRubberAll` | Rubber plantation carbon by region (13.5M ton CO2 total) |

**Dashboard integration:** Economic/environmental panel. Shows which provinces are net carbon sinks vs. emitters. Rubber data is significant — Thailand is world's #1 rubber producer.

### 5. Crop Drought Risk (province + irrigation + watershed)

**Source:** `cropsdrought.gistda.or.th` (no auth)
**Freshness:** Updated regularly (satellite-derived)
**Coverage:** All Thailand provinces with GeoJSON boundaries

| Endpoint | Returns |
|----------|---------|
| `GET /api/rest/zonal/province` | Drought risk per province with polygon geometry |
| `GET /api/rest/zonal/irrigation` | Drought risk by irrigation zone |
| `GET /api/rest/zonal/mainbasin` | Drought risk by major river basin |

**Response includes GeoJSON MultiPolygon boundaries** — can be rendered as a Deck.gl GeoJSON layer directly.

**Dashboard integration:** Agricultural vulnerability overlay. Critical for understanding food security in Thailand border provinces.

---

## Tier 2 — Live Data, Needs Minor Integration Work

### 6. Flood Monitoring (prediction + actual extent)

**Source:** `gistdaportal.gistda.or.th` GFlood services (public, no auth)
**Freshness:** Near-real-time

| Layer | Type | Fields |
|-------|------|--------|
| `GFlood_Inno_WMS/0` (rain_30min.tif) | Raster | 30-minute rainfall prediction |
| `GFlood_Inno_WMS/1` (FloodArea_Poly) | Feature (Polygon) | Actual flood extent polygons with tambon/amphoe/province + area |
| `GFlood_Inno_WMS/2` (flood_prediction_union) | Feature (Polygon) | Flood prediction zones with severity classification |

**Flood extent fields:** TB_TN (tambon), AP_TN (amphoe), PV_TN (province), RE_ROYIN (region), F_AREA, flood_area, house (affected households)

**Also available via WMS** (requires auth for some):
- `flood-innotech.gistda.or.th/flood_warn_public` — Hourly flood warning (requires auth)
- `flood-innotech.gistda.or.th/flooding_vis_public` — Latest flood satellite imagery (requires auth)
- `flood-innotech.gistda.or.th/rain30min_public` — 30-min rainfall forecast (requires auth)

**Dashboard integration:** Flood prediction polygons as a Deck.gl GeoJSON overlay during rainy season (June-November). Color-coded by severity. The affected-households field is powerful for briefing context.

### 7. Historical Flood Extent (2009-2014 + recurrence map)

**Source:** `gistdaportal.gistda.or.th` FL_Flood services (public)
**Coverage:** Annual flood extent maps from GISTDA satellite analysis

| Service | Description |
|---------|-------------|
| `FL_Flood/FL_flood_GISTDA_50k_Y2009` through `Y2014` | Annual flood extent (MapServer) |
| `FL_Flood/FL_RepeatedFlooding_GISTDA_50k_Y2005_Y2016` | 12-year flood recurrence (FeatureServer + MapServer) |

**Dashboard integration:** Historical playback. Toggle through annual flood extent to show recurrence patterns. The 2011 Great Flood of Thailand overlay would be a powerful briefing visual.

### 8. AQI Ground Stations (PM2.5 + PM10, hourly)

**Source:** `gistdaportal.gistda.or.th` FR_Fire/AirQuality_hourly (public)
**Fields:** station_id, station_name, pm10, pm25, date, time, province, amphoe, tambon, lon, lat

Provides the raw ground station readings that feed the satellite-interpolated PM2.5 surface. Useful for validation and for showing actual measurement points.

### 9. Ocean Chlorophyll-a (CHL-a) WMS

**Source:** `ocean.gistda.or.th/geoserver/openwq/wms` (public GeoServer, OGC WMS)
**Data:** Daily chlorophyll-a concentration from VIIRS (Suomi NPP/NOAA-20)
**Coverage:** Gulf of Thailand + Andaman Sea

**Dashboard integration:** Marine layer. Chlorophyll-a blooms correlate with fishing activity, river runoff (pollution), and red tide events. Relevant for the Andaman Sea / Strait of Malacca shipping lanes.

---

## Tier 3 — Available But Needs Auth Upgrade or Additional Work

### 10. Sphere Basemap Tiles

**Layers available:**
- `sphere_streets` — Street map of Thailand (Thai labels)
- `sphere_hybrid` — Satellite + street overlay
- `thailand_images` — Pure satellite imagery of Thailand
- `sphere_transparent` — Overlay-ready transparent layer

**Status:** Returns 401 with the current key. The tile server uses a different Kong auth route than the API gateway. May need to register the key specifically for tile access at sphere.gistda.or.th.

**Value:** A Thailand-optimized basemap with native Thai labels — more detailed than Mapbox for rural Thailand, especially tambon-level boundaries.

### 11. Sphere Search/Geocoding/Routing

The Sphere SDK exposes:
- **Search:** `api.sphere.gistda.or.th/services/search` — POI + place search
- **Address:** `api.sphere.gistda.or.th/services/geo/address` — Reverse geocoding (Thai admin hierarchy)
- **POI:** `api.sphere.gistda.or.th/services/poi` — Points of interest
- **Route:** `api.sphere.gistda.or.th/services/route` — Routing with traffic

**Status:** These endpoints return 404 when called directly — they're proxied through the Sphere JS SDK. Need to investigate if there's a REST API pattern or if these only work through the client-side SDK.

### 12. API Gateway Disaster Services

**Base:** `api-gateway.gistda.or.th/api/2.0/resources/gi-service/`

| Endpoint | Status with our key |
|----------|-------------------|
| `v1.1/disasters/flood-recurrence?lat=X&lon=Y` | **403** (permission denied) |
| `v1.1/disasters/drought-recurrence?lat=X&lon=Y` | **200** (returns data or "not found") |
| `v1.1/disasters/flood-extent-1day?lat=X&lon=Y` | **200** (returns data or "not found") |
| `v1.2/disasters/burnt-area-latest?lat=X&lon=Y` | **200** (returns data + update date) |
| `v1.2/disasters/burnt-area-latest-365?lat=X&lon=Y` | Untested |

The API key has **partial access** — drought, burnt area, and flood extent work. Flood recurrence needs an upgraded subscription.

### 13. THEOS-2 Satellite Imagery Tiles

**Pattern:** `api-gateway.gistda.or.th/api/2.0/resources/tiles/{image_id}/{z}/{x}/{y}.png?api_key=X`

THEOS-2 is Thailand's own Earth observation satellite (50cm pan, 2m multispectral). Imagery tiles are available for specific events (e.g., earthquake damage assessment). However, the tile IDs are event-specific and the endpoint returned 404 for the earthquake imagery — may need to discover current available imagery through a separate catalog endpoint.

---

## Tier 4 — Reference Data (Static/Infrequently Updated)

### 14. Administrative Boundaries
- `L05_AdminBoundary/L05_Province_GISTDA_50k` — All 77 Thai provinces
- `L05_AdminBoundary/L05_Amphoe_GISTDA_50k` — All 928 districts
- **Value:** More authoritative than OSM for Thai admin boundaries. Could use as base layer.

### 15. Land Use / Land Cover
- `L09_Landuse/L09_Landuse_GISTDA_50k` — Thailand land use classification
- **Value:** Cross-reference fire hotspots against land use (forest vs. agricultural burn).

### 16. Forest / Mangrove / National Parks
- `L10_Forest/L10_Forest_GISTDA_50k` — Forest cover
- `L10_Forest/L10_Mangrove_MNRE_50k` — Mangrove areas
- `L10_Forest/L10_NHTA_DNP_50k` — National parks / protected areas
- **Value:** Environmental monitoring. Forest fires in protected areas vs. agricultural burn.

### 17. Hydrology / Water Resources
- `L07_Hydrology/L07_Stream_RID_50k` — Major rivers
- `WR_WaterResource/Waterresource2rai_thailand_wfs` — Water resources (FeatureServer)
- **Value:** Overlay river network on flood prediction.

### 18. DEM / Elevation
- `L04_DEM/RTSD_XXXXXXXX_XXXXXXXX_ThailandAirport_30m` — 30m DEM
- **Value:** Terrain context for flood modeling.

### 19. Satellite Imagery Archives
- `L02_thaichote` — THEOS-1 (Thaichote) imagery (requires token)
- `L02_landsat8`, `L02_planet`, `L02_pleiades`, `L02_worldview2`, `L02_worldview3` — Multi-satellite archives
- **Status:** Most require authentication tokens.

---

## Integration Plan — Priority Order

### Phase 1: Thailand Intelligence Panel (high impact, public APIs, no auth needed)

**New API route:** `/api/thailand/environment`

Aggregate in a single call:
1. PM2.5 by province (top 10 worst + Thailand average)
2. GISTDA fire hotspots (today's count + coordinates)
3. AQI station data (187 stations)

This becomes a "Thailand Environmental Situational Awareness" panel — a signature Thailand-specific feature that no other dashboard has.

### Phase 2: Map Overlays (medium impact)

Add Deck.gl layers:
1. **GISTDA Fire Hotspots** — Thai-specific MODIS/VIIRS data with province labels
2. **PM2.5 Heatmap** — Interpolated air quality surface
3. **Drought Risk** — GeoJSON polygons colored by severity
4. **Flood Prediction** — GeoJSON polygons (rainy season)

### Phase 3: Historical Playback

1. **Flood recurrence** map (12-year historical data)
2. **Annual flood extent** (2009-2014) as playback layers
3. **Carbon tracking** dashboard panel

### Phase 4: Sphere Basemap (pending auth resolution)

Replace or supplement Mapbox with GISTDA Sphere tiles for Thailand-focused views. Thai-language labels, tambon-level detail.

---

## Environment Variables to Add

```env
GISTDA_API_KEY=RCDV9E6cQciXC61kroUXV2sq3coeRvs9LqJQ9PhcOCD5ebo7fj8xYxfXucBK1OOX
# Public endpoints — no key needed:
# pm25.gistda.or.th
# cropsdrought.gistda.or.th
# gistdaportal.gistda.or.th
# ocean.gistda.or.th
# api.longdo.com/map3/feed/aqi
```

---

## Key Insight

The most valuable data is **free and public** — no API key required. The PM2.5, fire hotspot, drought risk, flood prediction, and AQI station data are all open. The Sphere API key unlocks basemap tiles and some geocoding services, but the intelligence-grade data flows without it.

Thailand-specific fire hotspot data from GISTDA is higher resolution and richer (includes tambon/amphoe/province, land use classification, confidence scores) than the NASA FIRMS data the dashboard currently uses. For the Thailand theater, GISTDA data should be the primary source.
