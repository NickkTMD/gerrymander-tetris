import { useMemo } from 'react';
import type { BoardGrid } from '../types/tetris';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE_PX } from '../constants/board';
import { getPieceColor, getPieceLabel } from '../constants/pieces';

interface BoardProps {
  grid: BoardGrid;
}

export default function Board({ grid }: BoardProps) {
  // Compute centroids for each placed piece
  const pieceCentroids = useMemo(() => {
    const groups: Record<string, { sumR: number; sumC: number; count: number }> = {};
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (cell) {
          if (!groups[cell]) groups[cell] = { sumR: 0, sumC: 0, count: 0 };
          groups[cell].sumR += r;
          groups[cell].sumC += c;
          groups[cell].count++;
        }
      }
    }
    return Object.entries(groups).map(([id, g]) => ({
      id,
      top: ((g.sumR / g.count) + 0.5) * CELL_SIZE_PX,
      left: ((g.sumC / g.count) + 0.5) * CELL_SIZE_PX,
    }));
  }, [grid]);

  return (
    <div
      className="board"
      style={{
        '--board-cols': BOARD_COLS,
        '--board-rows': BOARD_ROWS,
        '--cell-size': `${CELL_SIZE_PX}px`,
        position: 'relative',
      } as React.CSSProperties}
    >
      {grid.flatMap((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            className={`cell ${cell ? 'cell-filled' : 'cell-empty'}`}
            style={cell ? { backgroundColor: getPieceColor(cell) } as React.CSSProperties : undefined}
          />
        ))
      )}
      {pieceCentroids.map(({ id, top, left }) => (
        <span
          key={`label-${id}`}
          className="board-label"
          style={{ top, left }}
        >
          {getPieceLabel(id)}
        </span>
      ))}
    </div>
  );
}
