import { useRef, memo } from 'react';
import { DISTRICT_PIECES } from '../data/generatedPieces';
import { getPieceColor } from '../constants/pieces';
import { getDistrictLabel } from '../data/stateNames';
import type { DistrictFeature } from '../types/district';

interface PixelCarouselProps {
  districts: DistrictFeature[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  selectedIds: Set<string>;
}

function PixelGrid({ shape, color, size }: { shape: boolean[][]; color: string; size: number }) {
  const rows = shape.length;
  const cols = Math.max(...shape.map(r => r.length));
  const cellSize = Math.floor(size / Math.max(rows, cols));

  return (
    <div
      className="carousel-pixel-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: '1px',
      }}
    >
      {shape.flatMap((row, r) =>
        Array.from({ length: cols }, (_, c) => {
          const on = c < row.length && row[c];
          return (
            <div
              key={`${r}-${c}`}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: on ? color : 'transparent',
                borderRadius: 1,
              }}
            />
          );
        })
      )}
    </div>
  );
}

interface CarouselItemProps {
  d: DistrictFeature;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

// Memoized so only the item(s) gaining/losing hover re-render
const CarouselItem = memo(function CarouselItem({
  d, isHovered, isSelected, onHover, onClick,
}: CarouselItemProps) {
  const pieceId = `d${d.properties.GEOID}`;
  const piece = DISTRICT_PIECES[pieceId];
  if (!piece) return null;
  const color = getPieceColor(pieceId);
  const label = getDistrictLabel(d.properties.STATEFP, d.properties.CD119FP);

  return (
    <div
      className={`carousel-item${isHovered ? ' carousel-item-hovered' : ''}${isSelected ? ' carousel-item-selected' : ''}`}
      onMouseEnter={() => onHover(pieceId)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(pieceId)}
    >
      <PixelGrid shape={piece.shape} color={color} size={80} />
      <span className="carousel-item-label">{label}</span>
      <span className={`carousel-item-score ${
        piece.gerrymanderScore >= 67 ? 'score-red' :
        piece.gerrymanderScore >= 34 ? 'score-yellow' : 'score-green'
      }`}>
        {piece.gerrymanderScore}
      </span>
    </div>
  );
});

const PixelCarousel = memo(function PixelCarousel({
  districts, hoveredId, onHover, onClick, selectedIds,
}: PixelCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="pixel-carousel-wrapper">
      <div className="pixel-carousel" ref={scrollRef}>
        {districts.map((d) => {
          const pieceId = `d${d.properties.GEOID}`;
          return (
            <CarouselItem
              key={d.properties.GEOID}
              d={d}
              isHovered={pieceId === hoveredId}
              isSelected={selectedIds.has(pieceId)}
              onHover={onHover}
              onClick={onClick}
            />
          );
        })}
      </div>
    </div>
  );
}, (prev, next) => {
  // Skip re-render if non-hover props are unchanged and hoveredId
  // doesn't affect any district in this state
  if (
    prev.districts !== next.districts ||
    prev.selectedIds !== next.selectedIds ||
    prev.onHover !== next.onHover ||
    prev.onClick !== next.onClick
  ) return false;

  if (prev.hoveredId === next.hoveredId) return true;

  const belongsHere = (id: string | null) =>
    id !== null && next.districts.some(d => `d${d.properties.GEOID}` === id);

  return !belongsHere(prev.hoveredId) && !belongsHere(next.hoveredId);
});

export default PixelCarousel;
