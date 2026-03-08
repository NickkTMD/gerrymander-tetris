/**
 * Swappable rasterization algorithm.
 * Converts GeoJSON Polygon/MultiPolygon geometries into boolean[][] grids.
 */

import type { Polygon, MultiPolygon } from 'geojson';
import { pointInPolygon } from './pointInPolygon';

export interface RasterizeOptions {
  gridSize: number; // target grid dimension (default 10)
  cellSize?: number; // fixed degrees-per-cell for uniform scale across districts
  maxArea?: number; // max filled cells; if exceeded, scale is reduced and re-rasterized
}

const DEFAULT_OPTIONS: RasterizeOptions = { gridSize: 10 };

/**
 * Rasterize a GeoJSON geometry into a boolean[][] grid.
 */
export function rasterizeFeature(
  geometry: Polygon | MultiPolygon,
  options: Partial<RasterizeOptions> = {}
): boolean[][] {
  const { gridSize, cellSize, maxArea } = { ...DEFAULT_OPTIONS, ...options };

  // Collect all coordinate rings
  const allPolygons = geometry.type === 'MultiPolygon'
    ? geometry.coordinates
    : [geometry.coordinates];

  // Gather all coordinates for bounding box
  const allCoords: number[][] = [];
  for (const poly of allPolygons) {
    for (const ring of poly) {
      for (const coord of ring) {
        allCoords.push(coord);
      }
    }
  }

  if (allCoords.length === 0) {
    return [[true]];
  }

  // Detect antimeridian crossing (Alaska): if longitude range > 180, shift negative lons
  let lons = allCoords.map(c => c[0]);
  const lonRange = Math.max(...lons) - Math.min(...lons);
  let normalized = false;
  if (lonRange > 180) {
    normalized = true;
    // Shift all coordinates: negative longitudes get +360
    for (const poly of allPolygons) {
      for (const ring of poly) {
        for (const coord of ring) {
          if (coord[0] < 0) coord[0] += 360;
        }
      }
    }
    // Recompute lons
    lons = allCoords.map(c => c[0]);
  }

  // Bounding box
  const minX = Math.min(...lons);
  const maxX = Math.max(...lons);
  const lats = allCoords.map(c => c[1]);
  const minY = Math.min(...lats);
  const maxY = Math.max(...lats);

  const geoW = maxX - minX;
  const geoH = maxY - minY;

  if (geoW === 0 && geoH === 0) {
    return [[true]];
  }

  // Aspect-preserving scale to fit within gridSize × gridSize
  // If cellSize provided, use fixed scale so districts are proportional to real size,
  // but clamp so oversized districts still fit within gridSize.
  const fitScale = Math.min(
    geoW > 0 ? gridSize / geoW : Infinity,
    geoH > 0 ? gridSize / geoH : Infinity
  );
  const scale = cellSize
    ? Math.min(1 / cellSize, fitScale)
    : fitScale;

  const pixelW = Math.max(1, Math.round(geoW * scale));
  const pixelH = Math.max(1, Math.round(geoH * scale));

  // Offset to center the shorter dimension
  const offsetX = (gridSize - pixelW) / 2;
  const offsetY = (gridSize - pixelH) / 2;

  // Rasterize: for each grid cell, test center point against polygons
  const grid: boolean[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < gridSize; c++) {
      // Map grid cell to geographic coordinates
      // Row 0 = top = maxY, row increases downward
      const geoX = minX + (c - offsetX + 0.5) / scale;
      const geoY = maxY - (r - offsetY + 0.5) / scale;

      let inside = false;
      for (const poly of allPolygons) {
        if (pointInPolygon(geoX, geoY, poly)) {
          inside = true;
          break;
        }
      }
      row.push(inside);
    }
    grid.push(row);
  }

  // Trim empty border rows/columns
  let trimmed = trimGrid(grid);

  // Keep only the largest connected component
  trimmed = largestConnectedComponent(trimmed);

  // Enforce maxArea: if filled cells exceed limit, re-rasterize at reduced scale
  if (maxArea && maxArea > 0) {
    const filledCount = trimmed.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    if (filledCount > maxArea) {
      // Scale down by sqrt ratio so area shrinks proportionally
      const reductionFactor = Math.sqrt(filledCount / maxArea);
      const newCellSize = cellSize
        ? cellSize * reductionFactor
        : (1 / fitScale) * reductionFactor;

      // Un-normalize before recursive call
      if (normalized) {
        for (const poly of allPolygons) {
          for (const ring of poly) {
            for (const coord of ring) {
              if (coord[0] > 180) coord[0] -= 360;
            }
          }
        }
      }

      return rasterizeFeature(geometry, { gridSize, cellSize: newCellSize, maxArea });
    }
  }

  // Un-normalize if we modified coordinates (restore for caller)
  if (normalized) {
    for (const poly of allPolygons) {
      for (const ring of poly) {
        for (const coord of ring) {
          if (coord[0] > 180) coord[0] -= 360;
        }
      }
    }
  }

  return trimmed;
}

/** Trim empty rows and columns from the edges of a boolean grid. */
function trimGrid(grid: boolean[][]): boolean[][] {
  if (grid.length === 0) return grid;

  const rows = grid.length;
  const cols = grid[0].length;

  let minR = rows, maxR = -1, minC = cols, maxC = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  if (maxR === -1) return [[true]]; // no true cells at all

  const result: boolean[][] = [];
  for (let r = minR; r <= maxR; r++) {
    result.push(grid[r].slice(minC, maxC + 1));
  }
  return result;
}

/** Keep only the largest connected component (4-connected flood fill). */
function largestConnectedComponent(grid: boolean[][]): boolean[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  let bestCells: [number, number][] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] && !visited[r][c]) {
        // Flood fill
        const component: [number, number][] = [];
        const stack: [number, number][] = [[r, c]];
        visited[r][c] = true;

        while (stack.length > 0) {
          const [cr, cc] = stack.pop()!;
          component.push([cr, cc]);

          for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                grid[nr][nc] && !visited[nr][nc]) {
              visited[nr][nc] = true;
              stack.push([nr, nc]);
            }
          }
        }

        if (component.length > bestCells.length) {
          bestCells = component;
        }
      }
    }
  }

  // Rebuild grid with only the largest component
  const result: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );
  for (const [r, c] of bestCells) {
    result[r][c] = true;
  }

  // Trim again after removing disconnected parts
  return trimGridInner(result);
}

function trimGridInner(grid: boolean[][]): boolean[][] {
  const rows = grid.length;
  const cols = grid[0].length;

  let minR = rows, maxR = -1, minC = cols, maxC = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  if (maxR === -1) return [[true]];

  const result: boolean[][] = [];
  for (let r = minR; r <= maxR; r++) {
    result.push(grid[r].slice(minC, maxC + 1));
  }
  return result;
}
