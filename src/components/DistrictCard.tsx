import type { DistrictFeature } from '../types/district';
import { getDistrictLabel } from '../data/stateNames';
import { DISTRICT_PIECES } from '../data/generatedPieces';
import { getPieceColor } from '../constants/pieces';

interface DistrictCardProps {
  feature: DistrictFeature;
  selected?: boolean;
  onToggle?: () => void;
}

function PixelGrid({ shape, color }: { shape: boolean[][]; color: string }) {
  const GRID = 12;
  const rows = shape.length;
  const cols = Math.max(...shape.map(r => r.length));
  const rowOff = Math.floor((GRID - rows) / 2);
  const colOff = Math.floor((GRID - cols) / 2);

  const cells = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const sr = r - rowOff;
      const sc = c - colOff;
      const on = sr >= 0 && sr < rows && sc >= 0 && sc < cols && shape[sr][sc];
      cells.push(
        <div key={`${r}-${c}`} className={on ? 'pixel-on' : 'pixel-off'}
             style={on ? { backgroundColor: color } : undefined} />
      );
    }
  }
  return (
    <div className="pixel-grid" style={{
      gridTemplateColumns: `repeat(${GRID}, 1fr)`,
      gridTemplateRows: `repeat(${GRID}, 1fr)`,
    }}>
      {cells}
    </div>
  );
}

function computeViewBox(rings: number[][][]): string {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      const ny = -y;
      if (ny < minY) minY = ny;
      if (ny > maxY) maxY = ny;
    }
  }
  const pad = Math.max(maxX - minX, maxY - minY) * 0.05;
  return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
}

function coordsToPath(coordinates: number[][][]): string {
  return coordinates
    .map((ring) => {
      const points = ring.map(([x, y]) => `${x},${-y}`);
      return `M${points.join('L')}Z`;
    })
    .join('');
}

export default function DistrictCard({ feature, selected, onToggle }: DistrictCardProps) {
  const { geometry, properties } = feature;
  const label = getDistrictLabel(properties.STATEFP, properties.CD119FP);

  let allRings: number[][][];
  if (geometry.type === 'Polygon') {
    allRings = geometry.coordinates;
  } else {
    allRings = geometry.coordinates.flat();
  }

  const pathD = coordsToPath(allRings);

  const pieceId = `d${properties.GEOID}`;
  const piece = DISTRICT_PIECES[pieceId];
  const color = getPieceColor(pieceId);

  return (
    <div className={`district-card${selected ? ' district-card-selected' : ''}`} onClick={onToggle}>
      <div className="district-card-shapes">
        <svg className="district-svg" viewBox={piece?.viewBox ?? computeViewBox(allRings)} preserveAspectRatio="xMidYMid meet">
          <path d={pathD} fill={color} fillRule="nonzero" stroke="none" />
        </svg>
        {piece && <PixelGrid shape={piece.shape} color={color} />}
      </div>
      <div className="district-label">{label}</div>
      {piece && (
        <div className="district-stats">
          <span className={
            piece.gerrymanderScore >= 67 ? 'score-red' :
            piece.gerrymanderScore >= 34 ? 'score-yellow' : 'score-green'
          }>
            Score: {piece.gerrymanderScore}
          </span>
          {' · '}
          {piece.areaSqMi.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq mi &middot;{' '}
          {piece.perimeterMi.toLocaleString(undefined, { maximumFractionDigits: 0 })} mi perimeter
        </div>
      )}
    </div>
  );
}
