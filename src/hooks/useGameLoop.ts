import { useEffect } from 'react';
import type { GameStatus } from '../types/tetris';
import type { GameAction } from '../game/reducer';

const DAS_DELAY_MS = 150;    // ms before auto-repeat kicks in for left/right
const DAS_REPEAT_MS = 50;    // ms between left/right auto-repeat steps
const SOFT_DROP_REPEAT_MS = 50;  // ms between soft drop steps when held
const HARD_DROP_STEP_MS = 8;     // ms per row during hard drop animation

export function useGameLoop(
  dispatch: React.Dispatch<GameAction>,
  status: GameStatus,
  tickIntervalMs: number,
  hardDropping: boolean,
  isSandSettling: boolean,
  sandSpeedMs: number,
) {
  // Gravity tick — suspended while sand is settling
  useEffect(() => {
    if (status !== 'playing' || isSandSettling) return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), tickIntervalMs);
    return () => clearInterval(id);
  }, [dispatch, status, tickIntervalMs, isSandSettling]);

  // Hard drop animation: rapidly step MOVE_DOWN until the piece locks
  useEffect(() => {
    if (!hardDropping || status !== 'playing') return;
    const id = setInterval(() => dispatch({ type: 'MOVE_DOWN' }), HARD_DROP_STEP_MS);
    return () => clearInterval(id);
  }, [dispatch, hardDropping, status]);

  // Sand settling animation: step each sand cell down one row at a time.
  // sandSpeedMs is set at lock time and can be changed by player input.
  useEffect(() => {
    if (!isSandSettling || status !== 'playing') return;
    const id = setInterval(() => dispatch({ type: 'SAND_TICK' }), sandSpeedMs);
    return () => clearInterval(id);
  }, [dispatch, isSandSettling, status, sandSpeedMs]);

  // Keyboard controls with DAS for left/right/down
  useEffect(() => {
    type DasEntry = { delay: ReturnType<typeof setTimeout>; repeat: ReturnType<typeof setInterval> | null };
    const dasTimers: Record<string, DasEntry> = {};

    function startDAS(key: string, action: GameAction, repeatMs: number) {
      if (dasTimers[key]) return;
      dispatch(action);
      dasTimers[key] = {
        delay: setTimeout(() => {
          if (dasTimers[key]) {
            dasTimers[key].repeat = setInterval(() => dispatch(action), repeatMs);
          }
        }, DAS_DELAY_MS),
        repeat: null,
      };
    }

    function stopDAS(key: string) {
      const t = dasTimers[key];
      if (t) {
        clearTimeout(t.delay);
        if (t.repeat !== null) clearInterval(t.repeat);
        delete dasTimers[key];
      }
    }

    const keydown = (e: KeyboardEvent) => {
      if (e.repeat) return; // ignore browser auto-repeat; we handle it ourselves

      if (e.key === ' ' && (status === 'idle' || status === 'gameover')) {
        e.preventDefault();
        dispatch({ type: 'START_GAME' });
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (status === 'playing' || status === 'paused') {
          e.preventDefault();
          dispatch({ type: 'TOGGLE_PAUSE' });
          return;
        }
      }

      if (isSandSettling) {
        switch (e.key) {
          case 'ArrowDown':
          case 's':
          case 'S':
            e.preventDefault();
            dispatch({ type: 'SET_SAND_SPEED', ms: SOFT_DROP_REPEAT_MS });
            break;
          case ' ':
            e.preventDefault();
            dispatch({ type: 'SET_SAND_SPEED', ms: HARD_DROP_STEP_MS });
            break;
        }
        return;
      }

      if (status !== 'playing') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          startDAS(e.key, { type: 'MOVE_LEFT' }, DAS_REPEAT_MS);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          startDAS(e.key, { type: 'MOVE_RIGHT' }, DAS_REPEAT_MS);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (!hardDropping) startDAS(e.key, { type: 'MOVE_DOWN' }, SOFT_DROP_REPEAT_MS);
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
      }
    };

    const keyup = (e: KeyboardEvent) => {
      stopDAS(e.key);
      if (isSandSettling) {
        switch (e.key) {
          case 'ArrowDown':
          case 's':
          case 'S':
            dispatch({ type: 'SET_SAND_SPEED', ms: tickIntervalMs });
            break;
        }
      }
    };

    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      Object.keys(dasTimers).forEach(stopDAS);
    };
  }, [dispatch, status, hardDropping, isSandSettling]);
}
