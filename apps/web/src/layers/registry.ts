import type { LayerDescriptor } from "./types";

/**
 * Built-in layer registry.
 * Only license-verified or clearly attributed open sources.
 * See docs/data-licenses.md before adding production layers.
 */
export const LAYER_REGISTRY: LayerDescriptor[] = [
  {
    id: "osm-imagery",
    kind: "imagery",
    nameKey: "layerOsm",
    descriptionKey: "layerOsmDesc",
    defaultEnabled: true,
    attribution: "© OpenStreetMap contributors",
    license: "ODbL + OSM Tile Usage Policy",
  },
  {
    id: "ellipsoid-terrain",
    kind: "terrain",
    nameKey: "layerEllipsoid",
    descriptionKey: "layerEllipsoidDesc",
    defaultEnabled: true,
    attribution: "WGS84 ellipsoid",
    license: "N/A (mathematical model)",
  },
  {
    id: "world-terrain",
    kind: "terrain",
    nameKey: "layerWorldTerrain",
    descriptionKey: "layerWorldTerrainDesc",
    defaultEnabled: false,
    attribution: "Cesium World Terrain (requires ion token)",
    license: "Cesium ion Terms – token required",
  },
  {
    id: "countries",
    kind: "vector",
    nameKey: "layerCountries",
    descriptionKey: "layerCountriesDesc",
    defaultEnabled: true,
    attribution: "Natural Earth (public domain)",
    license: "Public Domain",
  },
];

export function getLayer(id: string): LayerDescriptor | undefined {
  return LAYER_REGISTRY.find((l) => l.id === id);
}
