import { useMemo } from 'react';
import type { ActivePiece, BoardGrid } from '../types/tetris';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE_PX } from '../constants/board';
import { getPieceColor, getPieceLabel } from '../constants/pieces';

interface BoardProps {
  grid: BoardGrid;
  activePiece: ActivePiece | null;
  sandMode: boolean;
}

export default function Board({ grid, activePiece, sandMode }: BoardProps) {
  const pieceCentroids = useMemo(() => {
    const result: { id: string; top: number; left: number }[] = [];

    // Always compute the active piece label directly from its shape so that a
    // piece partially above the board always gets exactly one label.
    const activeCells = new Set<string>();
    if (activePiece) {
      const { shape, row, col, type } = activePiece;
      let sumR = 0, sumC = 0, count = 0;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const br = row + r;
            const bc = col + c;
            activeCells.add(`${br},${bc}`);
            if (br >= 0) { sumR += br; sumC += bc; count++; }
          }
        }
      }
      if (count > 0) {
        result.push({ id: type, top: (sumR / count + 0.5) * CELL_SIZE_PX, left: (sumC / count + 0.5) * CELL_SIZE_PX });
      }
    }

    if (sandMode) return result;

    // Label every locked piece by connected component (flood fill), skipping
    // active piece cells which are already labelled above.
    const visited = Array.from({ length: grid.length }, () => Array(grid[0].length).fill(false));

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (!grid[r][c] || visited[r][c] || activeCells.has(`${r},${c}`)) continue;
        const type = grid[r][c]!;
        const queue: [number, number][] = [[r, c]];
        visited[r][c] = true;
        let sumR = 0, sumC = 0, count = 0;
        while (queue.length > 0) {
          const [cr, cc] = queue.shift()!;
          sumR += cr; sumC += cc; count++;
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length
                && !visited[nr][nc] && !activeCells.has(`${nr},${nc}`) && grid[nr][nc] === type) {
              visited[nr][nc] = true;
              queue.push([nr, nc]);
            }
          }
        }
        result.push({ id: type, top: (sumR / count + 0.5) * CELL_SIZE_PX, left: (sumC / count + 0.5) * CELL_SIZE_PX });
      }
    }
    return result;
  }, [sandMode, activePiece, grid]);

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
      {pieceCentroids.map(({ id, top, left }, i) => (
        <span
          key={`label-${i}`}
          className="board-label"
          style={{ top, left }}
        >
          {getPieceLabel(id)}
        </span>
      ))}
    </div>
  );
}
