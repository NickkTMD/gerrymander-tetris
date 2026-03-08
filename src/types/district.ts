import type { Feature, MultiPolygon, Polygon } from "geojson";

/** Properties attached to each congressional district feature in the Census data */
export interface DistrictProperties {
  /** State FIPS code (e.g., "06" for California) */
  STATEFP: string;
  /** Congressional district number (e.g., "14") */
  CD119FP: string;
  /** Full GEOID = STATEFP + CD119FP (e.g., "0614") */
  GEOID: string;
  /** Fully qualified GEOID */
  GEOIDFQ: string;
  /** Human-readable name (e.g., "Congressional District 14") */
  NAMELSAD: string;
  /** Legal/Statistical Area Description code */
  LSAD: string;
  /** Congressional district session (e.g., "119") */
  CDSESSN: string;
  /** Area of land in square meters */
  ALAND: number;
  /** Area of water in square meters */
  AWATER: number;
}

export type DistrictFeature = Feature<
  Polygon | MultiPolygon,
  DistrictProperties
>;
