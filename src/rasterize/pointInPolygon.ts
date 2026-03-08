/**
 * Ray-casting point-in-polygon test.
 * Tests whether a point (x, y) lies inside a polygon ring using the
 * odd-even rule: cast a horizontal ray to the right and count edge crossings.
 */

/** Test if point (x, y) is inside a simple polygon ring (array of [x, y] coords). */
export function pointInRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    if ((yi > y) !== (yj > y) &&
        x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Test if point (x, y) is inside a polygon with optional holes.
 * rings[0] is the outer ring; rings[1..n] are holes.
 */
export function pointInPolygon(x: number, y: number, rings: number[][][]): boolean {
  if (!pointInRing(x, y, rings[0])) return false;
  // Subtract holes
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(x, y, rings[i])) return false;
  }
  return true;
}
