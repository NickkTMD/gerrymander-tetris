import { PIECES, getPieceColor, getPieceName } from '../constants/pieces';

interface SidePanelProps {
  score?: number;
  nextPiece?: string;
  level?: number;
  linesCleared?: number;
}

// Max pixel dimension for the preview box (fits within the 140px side panel with padding)
const MAX_PREVIEW_PX = 108;

export default function SidePanel({
  score = 0,
  nextPiece = 'district1',
  level = 0,
  linesCleared = 0,
}: SidePanelProps) {
  const piece = PIECES[nextPiece];
  const shape = piece?.shape ?? [[true]];
  const rows = shape.length;
  const cols = Math.max(...shape.map(r => r.length));
  const color = getPieceColor(nextPiece);

  // Scale cell size so the piece always fits inside the preview box
  const cellSize = Math.max(3, Math.min(14, Math.floor(MAX_PREVIEW_PX / Math.max(rows, cols))));

  return (
    <div className="side-panel">
      <div className="side-section">
        <h2>Score</h2>
        <div className="score-display">{score}</div>
      </div>
      <div className="side-section">
        <h2>Level</h2>
        <div className="score-display">{level}</div>
      </div>
      <div className="side-section">
        <h2>Lines</h2>
        <div className="score-display">{linesCleared}</div>
      </div>
      <div className="side-section">
        <h2>Next</h2>
        <div
          className="next-preview"
          style={{
            '--preview-cols': cols,
            '--preview-rows': rows,
            '--cell-size': `${cellSize}px`,
          } as React.CSSProperties}
        >
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => {
              const filled = shape[r]?.[c] ?? false;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`cell cell-sm ${filled ? 'cell-filled' : 'cell-empty'}`}
                  style={filled ? { backgroundColor: color } as React.CSSProperties : undefined}
                />
              );
            })
          )}
        </div>
        <div className="next-label">{getPieceName(nextPiece)}</div>
      </div>
    </div>
  );
}
