import { useRef } from 'react';
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

export default function PixelCarousel({ districts, hoveredId, onHover, onClick, selectedIds }: PixelCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="pixel-carousel-wrapper">
      <div className="pixel-carousel" ref={scrollRef}>
        {districts.map((d) => {
          const pieceId = `d${d.properties.GEOID}`;
          const piece = DISTRICT_PIECES[pieceId];
          if (!piece) return null;
          const color = getPieceColor(pieceId);
          const label = getDistrictLabel(d.properties.STATEFP, d.properties.CD119FP);
          const isHovered = pieceId === hoveredId;
          const isSelected = selectedIds.has(pieceId);

          return (
            <div
              key={d.properties.GEOID}
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
        })}
      </div>
    </div>
  );
}
