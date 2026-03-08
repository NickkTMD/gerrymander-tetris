import { useRef, useLayoutEffect, useCallback } from 'react';
import type { GameState } from '../types/tetris';
import type { GameAction } from '../game/reducer';
import { audioEngine } from '../audio/AudioEngine';
import { resolveSounds } from '../audio/soundMap';
import type { SoundEntry } from '../audio/soundMap';
import {
  playMove, playRotate, playSoftDrop, playHardDrop, playLock,
  playLineClear, playLevelUp, playGameOver, playGameStart, playPauseToggle,
} from '../audio/soundEffects';

function playSoundEntry(entry: SoundEntry, delay: number): void {
  const ctx = audioEngine.ensureContext();
  const dest = audioEngine.output;
  if (!dest) return;

  if (delay <= 0) {
    dispatchSound(ctx, dest, entry);
  } else {
    setTimeout(() => dispatchSound(ctx, dest, entry), delay);
  }
}

function dispatchSound(ctx: AudioContext, dest: AudioNode, entry: SoundEntry): void {
  switch (entry.sound) {
    case 'move': playMove(ctx, dest); break;
    case 'rotate': playRotate(ctx, dest); break;
    case 'softDrop': playSoftDrop(ctx, dest); break;
    case 'hardDrop': playHardDrop(ctx, dest); break;
    case 'lock': playLock(ctx, dest); break;
    case 'lineClear': playLineClear(ctx, dest, entry.lineCount ?? 1); break;
    case 'levelUp': playLevelUp(ctx, dest); break;
    case 'gameOver': playGameOver(ctx, dest); break;
    case 'gameStart': playGameStart(ctx, dest); break;
    case 'pauseToggle': playPauseToggle(ctx, dest); break;
  }
}

export function useSoundDispatch(
  dispatch: React.Dispatch<GameAction>, state: GameState
): React.Dispatch<GameAction> {
  const prevStateRef = useRef<GameState>(state);
  const pendingActionRef = useRef<GameAction | null>(null);

  useLayoutEffect(() => {
    const action = pendingActionRef.current;
    if (!action) {
      prevStateRef.current = state;
      return;
    }
    pendingActionRef.current = null;

    const sounds = resolveSounds(action, prevStateRef.current, state);
    prevStateRef.current = state;

    // Play sounds with staggering for compound events
    sounds.forEach((entry, i) => {
      playSoundEntry(entry, i * 50);
    });
  }, [state]);

  const soundDispatch = useCallback((action: GameAction) => {
    pendingActionRef.current = action;
    dispatch(action);
  }, [dispatch]);

  return soundDispatch;
}
