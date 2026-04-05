/**
 * Build script: rasterizes district TopoJSON geometries into boolean[][] grids
 * and writes src/data/generatedPieces.ts.
 *
 * Usage: npx tsx scripts/rasterize-districts.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import * as topojsonClient from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { rasterizeFeature } from '../src/rasterize/rasterizer';
import stateNames, { getDistrictLabel } from '../src/data/stateNames';

const INPUT_FILE = join(import.meta.dirname, '..', 'public', 'data', 'districts.topo.json');
const OUTPUT_DIR = join(import.meta.dirname, '..', 'src', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'generatedPieces.ts');

// 20-color Kelly palette for maximum contrast
const KELLY_COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
  '#469990', '#dcbeff', '#9a6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9',
];

/** Simple hash of a string to a number. */
function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

interface DistrictProps {
  STATEFP: string;
  CD119FP: string;
  GEOID: string;
  NAMELSAD: string;
  ALAND: number;
}

/** Haversine distance in miles between two [lon, lat] points */
function haversineMiles(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Sum haversine distances along all rings to get perimeter in miles */
function computePerimeter(rings: number[][][]): number {
  let total = 0;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      total += haversineMiles(ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1]);
    }
  }
  return total;
}

/** Get all coordinate rings from a Polygon or MultiPolygon */
function getAllRings(geom: { type: string; coordinates: number[][][] | number[][][][] }): number[][][] {
  if (geom.type === 'Polygon') {
    return geom.coordinates as number[][][];
  }
  return (geom.coordinates as number[][][][]).flat();
}

/** Count total polygon vertices as a proxy for shape complexity. */
function countVertices(geom: Polygon | MultiPolygon): number {
  const allPolys = geom.type === 'MultiPolygon'
    ? geom.coordinates as number[][][][]
    : [geom.coordinates as number[][][]];
  let count = 0;
  for (const poly of allPolys) {
    for (const ring of poly) count += ring.length;
  }
  return count;
}

const MIN_GRID = 8;
const MAX_GRID = 24;

/**
 * Map vertex count to a grid size on a log scale.
 * ~50 vertices → 8 cells (simple/compact districts)
 * ~2000+ vertices → 24 cells (complex/gerrymandered districts)
 */
function gridSizeForComplexity(vertexCount: number): number {
  const t = Math.min(1, Math.log10(vertexCount / 50) / Math.log10(2000 / 50));
  return Math.max(MIN_GRID, Math.round(MIN_GRID + t * (MAX_GRID - MIN_GRID)));
}

/** Compute bounding box extent (max of width/height) for a set of rings */
function bboxExtent(rings: number[][][]): { minX: number; minY: number; maxX: number; maxY: number; extent: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, extent: Math.max(maxX - minX, maxY - minY) };
}

/** Compute viewBox string centered on bbox, using district's own extent */
function getUniformViewBox(rings: number[][][]): string {
  const { minX, minY, maxX, maxY, extent: ownExtent } = bboxExtent(rings);
  // Flip Y for SVG (negate y)
  const cx = (minX + maxX) / 2;
  const cy = (-minY + -maxY) / 2;
  const pad = ownExtent * 0.05;
  const size = ownExtent + pad * 2;
  return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
}

function main() {
  console.log('Reading TopoJSON...');
  const raw = readFileSync(INPUT_FILE, 'utf-8');
  const topo: Topology = JSON.parse(raw);

  // Convert to GeoJSON features
  const objectKey = Object.keys(topo.objects)[0];
  const geomCollection = topo.objects[objectKey] as GeometryCollection;
  const featureCollection = topojsonClient.feature(topo, geomCollection);
  const features = featureCollection.features as Feature<Polygon | MultiPolygon, DistrictProps>[];

  console.log(`Found ${features.length} district features`);

  // Sort by GEOID for deterministic output
  features.sort((a, b) => a.properties!.GEOID.localeCompare(b.properties!.GEOID));

  // Filter valid features first
  const validFeatures = features.filter(f => {
    const geom = f.geometry;
    if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') {
      console.warn(`  Skipping ${f.properties!.GEOID}: unsupported geometry type ${geom.type}`);
      return false;
    }
    return true;
  });

  // Grid size varies per district based on polygon complexity (vertex count).
  // Simple/compact districts get a smaller grid; gerrymandered/tentacled
  // districts get a larger grid so their weird shapes are preserved.
  // No maxArea cap — we no longer downscale complex shapes into oblivion.

  const entries: string[] = [];
  const ids: string[] = [];

  for (const feature of validFeatures) {
    const props = feature.properties!;
    const geoid = props.GEOID;
    const geom = feature.geometry;

    const vertexCount = countVertices(geom);
    const gridSize = gridSizeForComplexity(vertexCount);
    const shape = rasterizeFeature(geom, { gridSize });
    const filledCells = shape.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    console.log(`  ${geoid}: ${vertexCount} verts → ${gridSize}×${gridSize} grid, ${filledCells} cells, shape ${shape[0].length}w×${shape.length}h`);
    const color = KELLY_COLORS[hashString(geoid) % KELLY_COLORS.length];
    const name = getDistrictLabel(props.STATEFP, props.CD119FP);

    const rings = getAllRings(geom);
    const areaSqMi = props.ALAND / 2_589_988;
    const perimeterMi = computePerimeter(rings);
    const viewBox = getUniformViewBox(rings);

    const pp = (4 * Math.PI * areaSqMi) / (perimeterMi ** 2);
    const gerrymanderScore = Math.round((1 - Math.min(pp, 1)) * 100);

    // Serialize shape as boolean[][] literal
    const shapeStr = shape
      .map(row => `      [${row.map(v => v ? '1' : '0').join(', ')}]`)
      .join(',\n');

    const id = `d${geoid}`;
    ids.push(id);

    entries.push(`  '${id}': {
    shape: [
${shapeStr},
    ] as unknown as boolean[][],
    color: '${color}',
    name: '${name.replace(/'/g, "\\'")}',
    geoid: '${geoid}',
    viewBox: '${viewBox}',
    areaSqMi: ${areaSqMi},
    perimeterMi: ${perimeterMi},
    gerrymanderScore: ${gerrymanderScore},
  }`);
  }

  const skipped = features.length - validFeatures.length;

  console.log(`Rasterized ${ids.length} districts (skipped ${skipped})`);

  // Write output file
  const output = `// AUTO-GENERATED by scripts/rasterize-districts.ts — do not edit manually

export interface GeneratedPiece {
  shape: boolean[][];
  color: string;
  name: string;
  geoid: string;
  viewBox: string;
  areaSqMi: number;
  perimeterMi: number;
  gerrymanderScore: number;
}

export const DISTRICT_PIECES: Record<string, GeneratedPiece> = {
${entries.join(',\n')},
};

export const DISTRICT_PIECE_IDS: string[] = [
${ids.map(id => `  '${id}'`).join(',\n')},
];
`;

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, output);
  console.log(`Wrote ${OUTPUT_FILE} (${ids.length} pieces)`);
}

main();
