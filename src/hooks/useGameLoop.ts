import { useEffect } from 'react';
import type { GameStatus } from '../types/tetris';
import type { GameAction } from '../game/reducer';

export function useGameLoop(
  dispatch: React.Dispatch<GameAction>,
  status: GameStatus,
  tickIntervalMs: number
) {
  // Tick interval
  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), tickIntervalMs);
    return () => clearInterval(id);
  }, [dispatch, status, tickIntervalMs]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' && (status === 'idle' || status === 'gameover')) {
        e.preventDefault();
        dispatch({ type: 'START_GAME' });
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          dispatch({ type: 'MOVE_LEFT' });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          dispatch({ type: 'MOVE_RIGHT' });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          dispatch({ type: 'MOVE_DOWN' });
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          dispatch({ type: 'ROTATE' });
          break;
        case ' ':
          e.preventDefault();
          dispatch({ type: 'HARD_DROP' });
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          dispatch({ type: 'TOGGLE_PAUSE' });
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, status]);
}
