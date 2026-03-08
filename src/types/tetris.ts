export type PieceType = string;

export type CellValue = PieceType | null;

export type BoardGrid = CellValue[][];

export type PieceShape = boolean[][];

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export interface ActivePiece {
  type: PieceType;
  shape: PieceShape;
  row: number;
  col: number;
}

export interface GameState {
  board: BoardGrid;
  activePiece: ActivePiece | null;
  nextPieceType: PieceType;
  score: number;
  linesCleared: number;
  level: number;
  status: GameStatus;
  tickIntervalMs: number;
}
