import type { DistrictFeature } from '../types/district';
import { getDistrictLabel } from '../data/stateNames';
import { getPieceColor } from '../constants/pieces';

interface StateMapProps {
  districts: DistrictFeature[];
  selectedIds: Set<string>;
  hoveredId: string | null;
  onToggleDistrict?: (id: string) => void;
  onHoverDistrict?: (id: string | null) => void;
}

function computeBBox(districts: DistrictFeature[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of districts) {
    const coords = d.geometry.type === 'Polygon'
      ? d.geometry.coordinates
      : d.geometry.coordinates.flat();
    for (const ring of coords) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

function featureToPath(feature: DistrictFeature): string {
  const coords = feature.geometry.type === 'Polygon'
    ? feature.geometry.coordinates
    : feature.geometry.coordinates.flat();
  return coords
    .map((ring) => {
      const points = ring.map(([x, y]) => `${x},${-y}`);
      return `M${points.join('L')}Z`;
    })
    .join('');
}

export default function StateMap({ districts, selectedIds, hoveredId, onToggleDistrict, onHoverDistrict }: StateMapProps) {
  if (districts.length === 0) return null;

  const bbox = computeBBox(districts);
  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;
  const pad = Math.max(width, height) * 0.04;
  const vb = `${bbox.minX - pad} ${-(bbox.maxY + pad)} ${width + pad * 2} ${height + pad * 2}`;

  const dimmed = hoveredId !== null;

  return (
    <svg
      className="state-map-svg"
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      onMouseLeave={() => onHoverDistrict?.(null)}
    >
      {districts.map((d) => {
        const pieceId = `d${d.properties.GEOID}`;
        const color = getPieceColor(pieceId);
        const isSelected = selectedIds.has(pieceId);
        const isHovered = pieceId === hoveredId;
        const label = getDistrictLabel(d.properties.STATEFP, d.properties.CD119FP);

        let opacity = 0.7;
        if (isHovered || isSelected) opacity = 1;
        else if (dimmed) opacity = 0.3;

        return (
          <path
            key={d.properties.GEOID}
            d={featureToPath(d)}
            fill={color}
            fillOpacity={opacity}
            stroke={isHovered ? '#fff' : isSelected ? '#fff' : '#222'}
            strokeWidth={isHovered ? 0.025 : isSelected ? 0.02 : 0.008}
            fillRule="nonzero"
            className="state-map-district"
            onClick={() => onToggleDistrict?.(pieceId)}
            onMouseEnter={() => onHoverDistrict?.(pieceId)}
          >
            <title>{label}</title>
          </path>
        );
      })}
    </svg>
  );
}
