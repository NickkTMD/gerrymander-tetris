import type { GameState } from '../types/tetris';
import type { GameAction } from '../game/reducer';

export type SoundEvent = 'move' | 'rotate' | 'softDrop' | 'hardDrop' | 'lock'
  | 'lineClear' | 'levelUp' | 'gameOver' | 'gameStart' | 'pauseToggle';

export interface SoundEntry {
  sound: SoundEvent;
  lineCount?: number;
}

export function resolveSounds(
  action: GameAction, prevState: GameState, nextState: GameState
): SoundEntry[] {
  // No sound if state didn't change
  if (prevState === nextState) return [];

  const sounds: SoundEntry[] = [];

  switch (action.type) {
    case 'START_GAME':
      sounds.push({ sound: 'gameStart' });
      break;

    case 'TOGGLE_PAUSE':
      if (prevState.status !== nextState.status) {
        sounds.push({ sound: 'pauseToggle' });
      }
      break;

    case 'MOVE_LEFT':
    case 'MOVE_RIGHT':
      if (prevState.activePiece && nextState.activePiece &&
          prevState.activePiece.col !== nextState.activePiece.col) {
        sounds.push({ sound: 'move' });
      }
      break;

    case 'ROTATE':
      if (prevState.activePiece && nextState.activePiece &&
          prevState.activePiece.shape !== nextState.activePiece.shape) {
        sounds.push({ sound: 'rotate' });
      }
      break;

    case 'MOVE_DOWN': {
      const pieceLocked = (prevState.activePiece && !nextState.activePiece) ||
        (prevState.activePiece && nextState.activePiece &&
         prevState.activePiece.type !== nextState.activePiece.type);
      if (prevState.hardDropping) {
        // During hard drop animation: silent on each step; only play lock when piece lands
        if (pieceLocked) sounds.push({ sound: 'lock' });
      } else {
        if (prevState.activePiece && nextState.activePiece &&
            prevState.activePiece.row !== nextState.activePiece.row) {
          sounds.push({ sound: 'softDrop' });
        } else if (pieceLocked) {
          sounds.push({ sound: 'lock' });
        }
      }
      break;
    }

    case 'HARD_DROP':
      // Play hardDrop sound immediately; lock sound plays when MOVE_DOWN locks the piece
      sounds.push({ sound: 'hardDrop' });
      break;

    case 'TICK':
      // Silent unless piece locks
      if (prevState.activePiece && nextState.activePiece &&
          prevState.activePiece.type !== nextState.activePiece.type) {
        sounds.push({ sound: 'lock' });
      } else if (prevState.activePiece && !nextState.activePiece) {
        sounds.push({ sound: 'lock' });
      }
      break;
  }

  // Outcome-based sounds (append after action sounds)
  if (nextState.linesCleared > prevState.linesCleared) {
    const cleared = nextState.linesCleared - prevState.linesCleared;
    sounds.push({ sound: 'lineClear', lineCount: cleared });
  }

  if (nextState.level > prevState.level) {
    sounds.push({ sound: 'levelUp' });
  }

  if (nextState.status === 'gameover' && prevState.status !== 'gameover') {
    sounds.push({ sound: 'gameOver' });
  }

  return sounds;
}
