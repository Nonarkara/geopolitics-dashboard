import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { TileLayer } from "@deck.gl/geo-layers";
import {
  ArcLayer,
  BitmapLayer,
  GeoJsonLayer,
  ScatterplotLayer,
} from "@deck.gl/layers";
import type {
  FireEvent,
  IncidentFeature,
  RainfallPoint,
  RefugeeMovement,
  RegionBorderCollection,
} from "../types/dashboard";

interface TileBounds {
  bbox: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
}

type TileImage =
  | string
  | HTMLCanvasElement
  | HTMLImageElement
  | HTMLVideoElement
  | ImageBitmap
  | ImageData
  | null
  | undefined;

type TileRenderProps = Record<string, unknown> & {
  tile: TileBounds;
  data: TileImage;
};

function createRasterTileLayer({
  id,
  data,
  maxZoom,
  opacity = 1,
  onTileError,
}: {
  id: string;
  data: string;
  maxZoom: number;
  opacity?: number;
  onTileError?: (error: unknown) => void;
}) {
  return new TileLayer({
    id,
    data,
    minZoom: 0,
    maxZoom,
    tileSize: 256,
    opacity,
    onTileError,
    renderSublayers: (props: TileRenderProps) => {
      const { data: image, ...layerProps } = props;
      const {
        bbox: { west, south, east, north },
      } = props.tile;

      return new BitmapLayer({
        ...layerProps,
        data: undefined,
        image,
        opacity,
        bounds: [west, south, east, north],
      });
    },
  });
}

export const createIncidentLayer = (data: IncidentFeature[]) =>
  new ScatterplotLayer({
    id: "incidents-scatter",
    data,
    getPosition: (d: IncidentFeature) => d.geometry.coordinates,
    getFillColor: (d: IncidentFeature) =>
      d.properties.fatalities > 0 ? [239, 68, 68, 200] : [245, 158, 11, 200],
    getRadius: (d: IncidentFeature) =>
      Math.sqrt(d.properties.fatalities + 1) * 2000,
    pickable: true,
    opacity: 0.8,
  });

export const createHeatmapLayer = (data: IncidentFeature[]) =>
  new HeatmapLayer({
    id: "incidents-heatmap",
    data,
    getPosition: (d: IncidentFeature) => d.geometry.coordinates,
    getWeight: (d: IncidentFeature) => d.properties.fatalities + 1,
    radiusPixels: 40,
    intensity: 1,
    threshold: 0.05,
  });

export const createFireLayer = (data: FireEvent[]) =>
  new ScatterplotLayer({
    id: "nasa-firms-fires",
    data,
    getPosition: (d: FireEvent) => [d.longitude, d.latitude],
    getFillColor: [255, 165, 0, 180],
    getRadius: (d: FireEvent) => Math.sqrt(d.brightness || 1) * 300,
    pickable: true,
  });

export const createRefugeeLayer = (data: RefugeeMovement[]) =>
  new ArcLayer({
    id: "refugee-movements",
    data,
    getSourcePosition: (d: RefugeeMovement) => d.source,
    getTargetPosition: (d: RefugeeMovement) => d.target,
    getSourceColor: [0, 128, 255, 120],
    getTargetColor: [0, 255, 128, 120],
    getWidth: (d: RefugeeMovement) => Math.log10(d.count + 1) * 2,
    pickable: true,
  });

export const createRainfallLayer = (data: RainfallPoint[]) =>
  new HeatmapLayer({
    id: "rainfall-anomalies",
    data,
    getPosition: (d: RainfallPoint) => [d.lng, d.lat],
    getWeight: (d: RainfallPoint) => Math.abs(d.value),
    radiusPixels: 60,
    colorRange: [
      [255, 255, 255, 0],
      [0, 100, 200, 100],
      [0, 200, 255, 200],
    ],
  });

export const createModisTerraLayer = (date: string, opacity = 0.72) =>
  createRasterTileLayer({
    id: "modis-terra-true-color",
    data: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    maxZoom: 9,
    opacity,
    onTileError: (error: unknown) => {
      console.warn("MODIS Terra tile load failed", error);
    },
  });

export const createModisAquaLayer = (date: string, opacity = 0.72) =>
  createRasterTileLayer({
    id: "modis-aqua-true-color",
    data: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    maxZoom: 9,
    opacity,
    onTileError: (error: unknown) => {
      console.warn("MODIS Aqua tile load failed", error);
    },
  });

export const createViirsTrueColorLayer = (date: string, opacity = 0.72) =>
  createRasterTileLayer({
    id: "viirs-true-color",
    data: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    maxZoom: 9,
    opacity,
    onTileError: (error: unknown) => {
      console.warn("VIIRS true color tile load failed", error);
    },
  });

export const createSentinelLayer = (date: string, opacity = 0.72) =>
  createViirsTrueColorLayer(date, opacity);

export const createCopernicusLayer = (date: string, opacity = 0.72) =>
  createModisTerraLayer(date, opacity);

export const createJaxaRainLayer = (date: string) =>
  createRasterTileLayer({
    id: "jaxa-gsmap-rain",
    data: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
    maxZoom: 6,
    opacity: 0.6,
  });

export const createDetailedSatelliteLayer = (date: string, opacity = 0.72) =>
  createModisAquaLayer(date, opacity);

export const createRegionalBorderLayer = (data: RegionBorderCollection) =>
  new GeoJsonLayer({
    id: "regional-borders",
    data: data as never,
    pickable: true,
    stroked: true,
    filled: true,
    getFillColor: [0, 0, 0, 0],
    getLineColor: [0, 255, 255, 100],
    getLineWidth: 2000,
    lineWidthMinPixels: 1,
  });

export const createNightlightLayer = (date: string) =>
  createRasterTileLayer({
    id: "viirs-nightlights",
    data: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_DayNightBand_AtSensor_M15/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
    maxZoom: 9,
  });
