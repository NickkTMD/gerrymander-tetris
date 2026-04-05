import type { GameState, BoardGrid } from '../types/tetris';
import type { FeatureFlags } from '../types/featureFlags';
import { createEmptyBoard } from '../constants/board';
import {
  rotateCW,
  canPlace,
  lockPiece,
  clearFullRows,
  clearBottomRows,
  extractSandCells,
  stepSandCells,
  spawnPiece,
  getRandomPieceType,
  computeTickInterval,
  computeScore,
} from './logic';

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'TICK' }
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'MOVE_DOWN' }
  | { type: 'HARD_DROP' }
  | { type: 'ROTATE' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SAND_TICK' }
  | { type: 'SET_SAND_SPEED'; ms: number };

export const initialState: GameState = {
  board: createEmptyBoard(),
  activePiece: null,
  nextPieceType: getRandomPieceType(),
  score: 0,
  linesCleared: 0,
  level: 0,
  status: 'idle',
  tickIntervalMs: computeTickInterval(0),
  piecesPlaced: 0,
  hardDropping: false,
  sandCells: null,
  sandSpeedMs: computeTickInterval(0),
};

export function createGameReducer(flags: FeatureFlags) {
  // Shared logic once all cells are on the board: clear rows, update score, spawn next.
  function finalizeBoard(state: GameState, board: BoardGrid): GameState {
    const { board: clearedBoard, rowsCleared } = clearFullRows(board);
    board = clearedBoard;

    const newPiecesPlaced = state.piecesPlaced + 1;

    if (flags.periodicBottomClear && newPiecesPlaced % 5 === 0) {
      board = clearBottomRows(board, 5);
    }

    const newLines = state.linesCleared + rowsCleared;
    const newLevel = Math.floor(newLines / 10);
    const scoreGain = computeScore(rowsCleared, state.level);

    const nextPiece = spawnPiece(state.nextPieceType);

    return {
      ...state,
      board,
      activePiece: nextPiece,
      nextPieceType: getRandomPieceType(),
      sandCells: null,
      score: state.score + scoreGain,
      linesCleared: newLines,
      level: newLevel,
      tickIntervalMs: computeTickInterval(newLevel),
      piecesPlaced: newPiecesPlaced,
      hardDropping: false,
    };
  }

  // These mirror the constants in useGameLoop.ts.
  const HARD_DROP_STEP_MS = 8;
  const SOFT_DROP_REPEAT_MS = 50;

  function lockAndSpawn(state: GameState, dropMode: 'tick' | 'soft' | 'hard'): GameState {
    if (!state.activePiece) return state;

    // Game over if any cell of the locking piece is above the board
    const { shape, row: pieceRow } = state.activePiece;
    const hasAboveBoard = shape.some((row, r) => row.some((cell, _c) => cell && pieceRow + r < 0));
    if (hasAboveBoard) {
      const board = lockPiece(state.board, state.activePiece);
      return { ...state, board, status: 'gameover', activePiece: null, sandCells: null, hardDropping: false };
    }

    if (flags.sandMode) {
      // Don't lock to board yet — let cells animate downward as sand.
      const sandSpeedMs =
        dropMode === 'hard' ? HARD_DROP_STEP_MS :
        dropMode === 'soft' ? SOFT_DROP_REPEAT_MS :
        state.tickIntervalMs;
      return {
        ...state,
        activePiece: null,
        sandCells: extractSandCells(state.activePiece),
        sandSpeedMs,
        hardDropping: false,
      };
    }

    const board = lockPiece(state.board, state.activePiece);
    return finalizeBoard(state, board);
  }

  return function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'START_GAME': {
        const board = createEmptyBoard();
        const firstType = getRandomPieceType();
        const piece = spawnPiece(firstType);
        return {
          board,
          activePiece: piece,
          nextPieceType: getRandomPieceType(),
          score: 0,
          linesCleared: 0,
          level: 0,
          status: 'playing',
          tickIntervalMs: computeTickInterval(0),
          piecesPlaced: 0,
          hardDropping: false,
          sandCells: null,
          sandSpeedMs: computeTickInterval(0),
        };
      }

      case 'TOGGLE_PAUSE': {
        if (state.status === 'playing') return { ...state, status: 'paused' };
        if (state.status === 'paused') return { ...state, status: 'playing' };
        return state;
      }

      case 'TICK':
      case 'MOVE_DOWN': {
        if (state.status !== 'playing' || !state.activePiece) return state;
        const p = state.activePiece;
        if (canPlace(state.board, p.shape, p.row + 1, p.col)) {
          const newState = {
            ...state,
            activePiece: { ...p, row: p.row + 1 },
          };
          if (action.type === 'MOVE_DOWN') {
            newState.score = state.score + 1; // soft drop bonus
          }
          return newState;
        }
        const dropMode = action.type === 'TICK' ? 'tick' : state.hardDropping ? 'hard' : 'soft';
        return lockAndSpawn(state, dropMode);
      }

      case 'MOVE_LEFT': {
        if (state.status !== 'playing' || !state.activePiece) return state;
        const p = state.activePiece;
        if (canPlace(state.board, p.shape, p.row, p.col - 1)) {
          return { ...state, activePiece: { ...p, col: p.col - 1 } };
        }
        return state;
      }

      case 'MOVE_RIGHT': {
        if (state.status !== 'playing' || !state.activePiece) return state;
        const p = state.activePiece;
        if (canPlace(state.board, p.shape, p.row, p.col + 1)) {
          return { ...state, activePiece: { ...p, col: p.col + 1 } };
        }
        return state;
      }

      case 'ROTATE': {
        if (state.status !== 'playing' || !state.activePiece) return state;
        const p = state.activePiece;
        const rotated = rotateCW(p.shape);
        // Try current position, then wall-kick offsets
        for (const offset of [0, -1, 1, -2, 2, -3, 3]) {
          if (canPlace(state.board, rotated, p.row, p.col + offset)) {
            return {
              ...state,
              activePiece: { ...p, shape: rotated, col: p.col + offset },
            };
          }
        }
        return state;
      }

      case 'HARD_DROP': {
        if (state.status !== 'playing' || !state.activePiece || state.hardDropping) return state;
        return { ...state, hardDropping: true };
      }

      case 'SET_SAND_SPEED': {
        if (!state.sandCells) return state;
        return { ...state, sandSpeedMs: action.ms };
      }

      case 'SAND_TICK': {
        if (state.status !== 'playing' || !state.sandCells) return state;

        const { cells, allSettled } = stepSandCells(state.board, state.sandCells);

        if (!allSettled) {
          return { ...state, sandCells: cells };
        }

        // Game over if any settled sand cell is above the board
        if (cells.some(cell => cell.row < 0)) {
          return { ...state, sandCells: null, status: 'gameover', hardDropping: false };
        }

        // All cells have settled — write them to the board and finalize.
        const board = state.board.map(row => [...row]);
        for (const cell of cells) {
          board[cell.row][cell.col] = cell.type;
        }
        return finalizeBoard({ ...state, sandCells: null }, board);
      }

      default:
        return state;
    }
  };
}
