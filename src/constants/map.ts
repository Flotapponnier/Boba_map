import type { MapConfig } from "@/types";

/**
 * Stuttgart city center coordinates
 */
export const STUTTGART_CENTER = {
  lat: 48.7758,
  lng: 9.1829,
} as const;

export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: STUTTGART_CENTER,
  zoom: 14,
  minZoom: 10,
  maxZoom: 18,
};

/**
 * CARTO Positron tile layer - light minimalist style (free, no API key)
 */
export const OSM_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';








