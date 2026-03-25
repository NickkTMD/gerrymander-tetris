/**
 * Downloads US Census Bureau cartographic boundary shapefiles for the 119th Congress
 * congressional districts and converts them to TopoJSON.
 *
 * Usage: npx tsx scripts/download-districts.ts
 */

import { execSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { open } from "shapefile";
import * as topojson from "topojson-server";
import type { Feature, FeatureCollection, Polygon, MultiPolygon, Position } from "geojson";

const CENSUS_URL =
  "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_cd119_500k.zip";
const OUTPUT_DIR = join(import.meta.dirname, "..", "public", "data");
const OUTPUT_FILE = join(OUTPUT_DIR, "districts.topo.json");

async function download(url: string, dest: string): Promise<void> {
  console.log(`Downloading ${url}...`);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  }
  await pipeline(res.body as unknown as NodeJS.ReadableStream, createWriteStream(dest));
  console.log(`Downloaded to ${dest}`);
}

function unzip(zipPath: string, destDir: string): void {
  console.log(`Extracting ${zipPath}...`);
  mkdirSync(destDir, { recursive: true });
  execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: "pipe" });
}

async function shapefileToGeoJSON(shpPath: string): Promise<FeatureCollection> {
  console.log(`Reading shapefile ${shpPath}...`);
  const source = await open(shpPath);
  const features: FeatureCollection["features"] = [];

  let result = await source.read();
  while (!result.done) {
    features.push(result.value);
    result = await source.read();
  }

  return { type: "FeatureCollection", features };
}

/** Compute the absolute area of a coordinate ring using the Shoelace formula. */
function shoelaceArea(ring: Position[]): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(area) / 2;
}

/** Reduce MultiPolygon features to just the largest polygon (by outer ring area). */
function keepLargestPolygon(feature: Feature): Feature {
  if (feature.geometry.type !== "MultiPolygon") return feature;
  const multi = feature.geometry as MultiPolygon;
  let largestIdx = 0;
  let largestArea = 0;
  for (let i = 0; i < multi.coordinates.length; i++) {
    const area = shoelaceArea(multi.coordinates[i][0]);
    if (area > largestArea) {
      largestArea = area;
      largestIdx = i;
    }
  }
  return {
    ...feature,
    geometry: {
      type: "Polygon",
      coordinates: multi.coordinates[largestIdx],
    } as Polygon,
  };
}

async function main() {
  const tmpDir = join(tmpdir(), "census-districts");
  mkdirSync(tmpDir, { recursive: true });

  const zipPath = join(tmpDir, "cb_2024_us_cd119_500k.zip");
  const extractDir = join(tmpDir, "extracted");

  // Download if not cached
  if (!existsSync(zipPath)) {
    await download(CENSUS_URL, zipPath);
  } else {
    console.log(`Using cached zip at ${zipPath}`);
  }

  // Extract
  unzip(zipPath, extractDir);

  // Find .shp file
  const shpPath = join(extractDir, "cb_2024_us_cd119_500k.shp");
  if (!existsSync(shpPath)) {
    throw new Error(`Shapefile not found at ${shpPath}`);
  }

  // Convert to GeoJSON
  const geojson = await shapefileToGeoJSON(shpPath);
  console.log(`Read ${geojson.features.length} district features`);

  // Reduce MultiPolygon districts to just the largest polygon
  const multiCount = geojson.features.filter(f => f.geometry.type === "MultiPolygon").length;
  geojson.features = geojson.features.map(keepLargestPolygon);
  console.log(`Simplified ${multiCount} MultiPolygon features to single Polygon`);

  // Convert to TopoJSON
  console.log("Converting to TopoJSON...");
  // Use high quantization (1e6) so small urban districts retain shape detail.
  // Default 1e4 reduces tiny districts to rectangles.
  const topo = topojson.topology({ districts: geojson }, 1e6);

  // Write output
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const json = JSON.stringify(topo);
  writeFileSync(OUTPUT_FILE, json);
  const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2);
  console.log(`Wrote ${OUTPUT_FILE} (${sizeMB} MB)`);

  // Verification
  const objectKeys = Object.keys(topo.objects);
  const districtObj = topo.objects["districts"] as any;
  const geometries = districtObj?.geometries ?? [];
  console.log(`\nVerification:`);
  console.log(`  Objects: ${objectKeys.join(", ")}`);
  console.log(`  Geometries: ${geometries.length}`);

  // Spot-check NY-14
  const ny14 = geometries.find(
    (g: any) => g.properties?.STATEFP === "36" && g.properties?.CD119FP === "14"
  );
  if (ny14) {
    console.log(`  NY-14 found: ${ny14.properties.NAMELSAD} (GEOID: ${ny14.properties.GEOID})`);
  } else {
    console.warn("  WARNING: NY-14 not found!");
  }

  if (geometries.length < 435) {
    console.warn(`  WARNING: Expected 435+ districts, got ${geometries.length}`);
  } else {
    console.log(`  All 435+ districts present`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
