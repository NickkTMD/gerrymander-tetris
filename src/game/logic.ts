import type { BoardGrid, PieceShape, ActivePiece, SandCell } from '../types/tetris';
import { BOARD_COLS, BOARD_ROWS } from '../constants/board';
import { PIECES, PIECE_TYPES } from '../constants/pieces';

export function rotateCW(shape: PieceShape): PieceShape {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: PieceShape = Array.from({ length: cols }, () =>
    Array(rows).fill(false)
  );
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = shape[r][c];
    }
  }
  return result;
}

export function canPlace(
  board: BoardGrid,
  shape: PieceShape,
  row: number,
  col: number
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const br = row + r;
      const bc = col + c;
      if (br >= BOARD_ROWS || bc < 0 || bc >= BOARD_COLS) return false;
      if (br < 0) continue; // above the board is always empty
      if (board[br][bc] !== null) return false;
    }
  }
  return true;
}

export function lockPiece(board: BoardGrid, piece: ActivePiece): BoardGrid {
  const newBoard = board.map(row => [...row]);
  const { shape, row, col, type } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const br = row + r;
        if (br >= 0) newBoard[br][col + c] = type;
      }
    }
  }
  return newBoard;
}

export function clearFullRows(board: BoardGrid): { board: BoardGrid; rowsCleared: number } {
  const kept = board.filter(row => row.some(cell => cell === null));
  const rowsCleared = BOARD_ROWS - kept.length;
  if (rowsCleared === 0) return { board, rowsCleared: 0 };
  const emptyRows: BoardGrid = Array.from({ length: rowsCleared }, () =>
    Array(BOARD_COLS).fill(null)
  );
  return { board: [...emptyRows, ...kept], rowsCleared };
}

export function clearBottomRows(board: BoardGrid, count: number): BoardGrid {
  const n = Math.min(count, board.length);
  const kept = board.slice(0, board.length - n);
  const emptyRows: BoardGrid = Array.from({ length: n }, () =>
    Array(BOARD_COLS).fill(null)
  );
  return [...emptyRows, ...kept];
}

export function extractSandCells(piece: ActivePiece): SandCell[] {
  const cells: SandCell[] = [];
  const { shape, row: pieceRow, col: pieceCol, type } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        cells.push({ row: pieceRow + r, col: pieceCol + c, type });
      }
    }
  }
  return cells;
}

export function stepSandCells(
  board: BoardGrid,
  cells: SandCell[]
): { cells: SandCell[]; allSettled: boolean } {
  // Process bottommost cells first so they claim lower positions before
  // cells above them try to move into the same spot.
  const sorted = [...cells].sort((a, b) => b.row - a.row);
  const newCells: SandCell[] = [];
  const newPos = new Set<string>();
  let anyMoved = false;

  for (const cell of sorted) {
    const nextRow = cell.row + 1;
    const nextKey = `${nextRow},${cell.col}`;
    const canFall =
      nextRow < BOARD_ROWS &&
      (nextRow < 0 || board[nextRow][cell.col] === null) &&
      !newPos.has(nextKey);

    if (canFall) {
      newCells.push({ ...cell, row: nextRow });
      newPos.add(nextKey);
      anyMoved = true;
    } else {
      newCells.push(cell);
      newPos.add(`${cell.row},${cell.col}`);
    }
  }

  return { cells: newCells, allSettled: !anyMoved };
}

export function mergePieceOntoBoard(board: BoardGrid, piece: ActivePiece | null): BoardGrid {
  if (!piece) return board;
  const display = board.map(row => [...row]);
  const { shape, row, col, type } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const br = row + r;
        const bc = col + c;
        if (br >= 0 && br < BOARD_ROWS && bc >= 0 && bc < BOARD_COLS) {
          display[br][bc] = type;
        }
      }
    }
  }
  return display;
}

export function spawnPiece(pieceType: string): ActivePiece {
  const shape = PIECES[pieceType].shape;
  const cols = shape[0].length;
  const col = Math.floor((BOARD_COLS - cols) / 2);
  return { type: pieceType, shape, row: -shape.length, col };
}

export function getRandomPieceType(): string {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

export function computeTickInterval(level: number): number {
  return Math.max(100, 800 - level * 70);
}

export function computeScore(rowsCleared: number, level: number): number {
  const multipliers = [0, 100, 300, 500, 800];
  const base = rowsCleared >= 4 ? 800 : (multipliers[rowsCleared] ?? 800);
  return base * (level + 1);
}
