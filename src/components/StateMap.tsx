import { useMemo, memo } from 'react';
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

interface DistrictPathProps {
  pathData: string;
  color: string;
  label: string;
  pieceId: string;
  isSelected: boolean;
  isHovered: boolean;
  dimmed: boolean;
  onToggleDistrict?: (id: string) => void;
  onHoverDistrict?: (id: string | null) => void;
}

// Memoized so only the path(s) whose visual state actually changed re-render
const DistrictPath = memo(function DistrictPath({
  pathData, color, label, pieceId,
  isSelected, isHovered, dimmed,
  onToggleDistrict, onHoverDistrict,
}: DistrictPathProps) {
  let opacity = 0.7;
  if (isHovered || isSelected) opacity = 1;
  else if (dimmed) opacity = 0.3;

  return (
    <path
      d={pathData}
      fill={color}
      fillOpacity={opacity}
      stroke={isHovered ? '#E8E3D8' : isSelected ? '#E8E3D8' : '#444'}
      strokeWidth={isHovered ? 0.025 : isSelected ? 0.02 : 0.006}
      fillRule="nonzero"
      className="state-map-district"
      onClick={onToggleDistrict ? () => onToggleDistrict(pieceId) : undefined}
      onMouseEnter={onHoverDistrict ? () => onHoverDistrict(pieceId) : undefined}
      onMouseLeave={onHoverDistrict ? () => onHoverDistrict(null) : undefined}
    >
      <title>{label}</title>
    </path>
  );
});

const StateMap = memo(function StateMap({
  districts, selectedIds, hoveredId, onToggleDistrict, onHoverDistrict,
}: StateMapProps) {
  if (districts.length === 0) return null;

  // Geometry is computed once per state — never changes after load
  const { viewBox, districtMeta } = useMemo(() => {
    const bbox = computeBBox(districts);
    const width = bbox.maxX - bbox.minX;
    const height = bbox.maxY - bbox.minY;
    const pad = Math.max(width, height) * 0.04;
    const vb = `${bbox.minX - pad} ${-(bbox.maxY + pad)} ${width + pad * 2} ${height + pad * 2}`;

    const meta = districts.map(d => ({
      geoid: d.properties.GEOID,
      pieceId: `d${d.properties.GEOID}`,
      pathData: featureToPath(d),
      color: getPieceColor(`d${d.properties.GEOID}`),
      label: getDistrictLabel(d.properties.STATEFP, d.properties.CD119FP),
    }));

    return { viewBox: vb, districtMeta: meta };
  }, [districts]);

  const dimmed = hoveredId !== null;

  return (
    <svg
      className="state-map-svg"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      onMouseLeave={() => onHoverDistrict?.(null)}
    >
      {districtMeta.map(({ geoid, pieceId, pathData, color, label }) => (
        <DistrictPath
          key={geoid}
          pathData={pathData}
          color={color}
          label={label}
          pieceId={pieceId}
          isSelected={selectedIds.has(pieceId)}
          isHovered={pieceId === hoveredId}
          dimmed={dimmed}
          onToggleDistrict={onToggleDistrict}
          onHoverDistrict={onHoverDistrict}
        />
      ))}
    </svg>
  );
}, (prev, next) => {
  // Skip re-render entirely if non-hover props are unchanged and hoveredId
  // doesn't affect any district in this state
  if (
    prev.districts !== next.districts ||
    prev.selectedIds !== next.selectedIds ||
    prev.onToggleDistrict !== next.onToggleDistrict ||
    prev.onHoverDistrict !== next.onHoverDistrict
  ) return false;

  if (prev.hoveredId === next.hoveredId) return true;

  // Re-render only if the old or new hovered district belongs to this state
  const belongsHere = (id: string | null) =>
    id !== null && next.districts.some(d => `d${d.properties.GEOID}` === id);

  return !belongsHere(prev.hoveredId) && !belongsHere(next.hoveredId);
});

export default StateMap;
