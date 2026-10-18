/** Layer system types – provider-agnostic */

export type LayerKind = "imagery" | "terrain" | "vector" | "overlay";

export interface LayerDescriptor {
  id: string;
  kind: LayerKind;
  nameKey: string; // i18n key
  descriptionKey?: string;
  defaultEnabled: boolean;
  /** Attribution string shown when layer is active */
  attribution: string;
  /** License note for docs */
  license: string;
}

export interface VectorFeatureStyle {
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  fillOpacity?: number;
}
