/**
 * Background music — procedural loop via Web Audio API.
 * C minor pentatonic, 120 BPM. No external audio files.
 */

import { useEffect, useRef } from 'react';
import { audioEngine } from './AudioEngine';
import type { GameStatus } from '../types/tetris';

// ── note frequencies ──────────────────────────────────────────────────────────
const N: Record<string, number> = {
  C2: 65.41, G2: 98.00,
  C3: 130.81, Eb3: 155.56, F3: 174.61, G3: 196.00, Bb3: 233.08,
  C4: 261.63, Eb4: 311.13, F4: 349.23, G4: 392.00, Bb4: 466.16,
  C5: 523.25, Eb5: 622.25, F5: 698.46,
};

// Each step = one 8th note.  16 steps = 2 bars at 120 BPM.
const STEP_SEC = 0.25; // 8th note at 120 BPM
const PATTERN_STEPS = 16;

// Bass line — root / fifth / minor-seventh movement
const BASS: (string | null)[] = [
  'C3',  null, 'G3',  null,  'Bb3', null, 'G3',  null,
  'C3',  null, 'F3',  null,  'G3',  null, 'Eb3', null,
];

// Melody — simple pentatonic phrase
const MELODY: (string | null)[] = [
  null,  'G4',  null,  'Bb4', null,  'C5',  null,  'Bb4',
  'G4',  null,  'Eb4', null,  'F4',  'G4',  null,  null,
];

// Counter-melody (softer, higher register, offset)
const COUNTER: (string | null)[] = [
  null, null,  'Eb5', null,  null,  'F5',  null,  'Eb5',
  null, 'C5',  null,  null,  null,  'Bb4', null,  'C5',
];

// ── oscillator helpers ────────────────────────────────────────────────────────
type OscType = OscillatorType;

function scheduleNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  peak: number,
  type: OscType = 'triangle',
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

// ── pattern scheduler ─────────────────────────────────────────────────────────
function schedulePattern(ctx: AudioContext, dest: AudioNode, patternStart: number): void {
  for (let i = 0; i < PATTERN_STEPS; i++) {
    const t = patternStart + i * STEP_SEC;

    const bass = BASS[i];
    if (bass) {
      scheduleNote(ctx, dest, N[bass], t, STEP_SEC * 1.4, 0.18, 'triangle');
    }

    const mel = MELODY[i];
    if (mel) {
      scheduleNote(ctx, dest, N[mel], t, STEP_SEC * 0.85, 0.07, 'sine');
    }

    const cnt = COUNTER[i];
    if (cnt) {
      scheduleNote(ctx, dest, N[cnt], t, STEP_SEC * 0.75, 0.045, 'sine');
    }
  }
}

const PATTERN_SEC = PATTERN_STEPS * STEP_SEC; // 4 seconds per loop

// ── public hook ───────────────────────────────────────────────────────────────
export function useMusic(status: GameStatus): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextPatternRef = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => {
    if (status !== 'playing') {
      activeRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const ctx = audioEngine.ensureContext();
    const dest = audioEngine.output;
    if (!dest) return;

    activeRef.current = true;

    // Schedule two patterns immediately, then keep scheduling one pattern
    // ahead so there's never a gap.
    const LOOKAHEAD = 0.05; // seconds of scheduling latency buffer
    nextPatternRef.current = ctx.currentTime + LOOKAHEAD;
    schedulePattern(ctx, dest, nextPatternRef.current);
    schedulePattern(ctx, dest, nextPatternRef.current + PATTERN_SEC);
    nextPatternRef.current += PATTERN_SEC * 2;

    function loop() {
      if (!activeRef.current) return;
      const ctx = audioEngine.context;
      const dest = audioEngine.output;
      if (!ctx || !dest) return;

      // Schedule next pattern when we're within one pattern-length of running out
      const scheduleAhead = PATTERN_SEC + 0.1;
      const timeUntilNext = nextPatternRef.current - ctx.currentTime;

      if (timeUntilNext <= scheduleAhead) {
        schedulePattern(ctx, dest, nextPatternRef.current);
        nextPatternRef.current += PATTERN_SEC;
      }

      timerRef.current = setTimeout(loop, (PATTERN_SEC / 2) * 1000);
    }

    timerRef.current = setTimeout(loop, (PATTERN_SEC / 2) * 1000);

    return () => {
      activeRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);
}
