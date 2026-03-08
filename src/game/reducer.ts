import type { GameState } from '../types/tetris';
import { createEmptyBoard } from '../constants/board';
import {
  rotateCW,
  canPlace,
  lockPiece,
  clearFullRows,
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
  | { type: 'TOGGLE_PAUSE' };

export const initialState: GameState = {
  board: createEmptyBoard(),
  activePiece: null,
  nextPieceType: getRandomPieceType(),
  score: 0,
  linesCleared: 0,
  level: 0,
  status: 'idle',
  tickIntervalMs: 250,
};

function lockAndSpawn(state: GameState): GameState {
  if (!state.activePiece) return state;

  let board = lockPiece(state.board, state.activePiece);
  const { board: clearedBoard, rowsCleared } = clearFullRows(board);
  board = clearedBoard;

  const newLines = state.linesCleared + rowsCleared;
  const newLevel = Math.floor(newLines / 10);
  const scoreGain = computeScore(rowsCleared, state.level);

  const nextPiece = spawnPiece(state.nextPieceType);
  if (!canPlace(board, nextPiece.shape, nextPiece.row, nextPiece.col)) {
    return {
      ...state,
      board,
      activePiece: null,
      score: state.score + scoreGain,
      linesCleared: newLines,
      level: newLevel,
      status: 'gameover',
      tickIntervalMs: computeTickInterval(newLevel),
    };
  }

  return {
    ...state,
    board,
    activePiece: nextPiece,
    nextPieceType: getRandomPieceType(),
    score: state.score + scoreGain,
    linesCleared: newLines,
    level: newLevel,
    tickIntervalMs: computeTickInterval(newLevel),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
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
        tickIntervalMs: 250,
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
      return lockAndSpawn(state);
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
      if (state.status !== 'playing' || !state.activePiece) return state;
      const p = state.activePiece;
      let dropRow = p.row;
      while (canPlace(state.board, p.shape, dropRow + 1, p.col)) {
        dropRow++;
      }
      const dropDistance = dropRow - p.row;
      const stateWithDrop = {
        ...state,
        activePiece: { ...p, row: dropRow },
        score: state.score + dropDistance * 2,
      };
      return lockAndSpawn(stateWithDrop);
    }

    default:
      return state;
  }
}
