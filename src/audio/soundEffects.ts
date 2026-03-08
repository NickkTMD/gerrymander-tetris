type Ctx = AudioContext;
type Dest = AudioNode;

export function playMove(ctx: Ctx, dest: Dest): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 220;
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.03);
}

export function playRotate(ctx: Ctx, dest: Dest): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.08);
}

export function playSoftDrop(ctx: Ctx, dest: Dest): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.05);
}

export function playHardDrop(ctx: Ctx, dest: Dest): void {
  const t = ctx.currentTime;

  // White noise through lowpass
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  noise.connect(filter).connect(noiseGain).connect(dest);
  noise.start(t);
  noise.stop(t + 0.15);

  // Sine sweep down
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
  oscGain.gain.setValueAtTime(0.15, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(oscGain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.15);
}

export function playLock(ctx: Ctx, dest: Dest): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 180;
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.06);
}

export function playLineClear(ctx: Ctx, dest: Dest, count: number): void {
  const t = ctx.currentTime;
  const isTetris = count >= 4;
  const notes = isTetris
    ? [523.25, 659.25, 783.99, 1046.5, 1318.5] // C5, E5, G5, C6, E6
    : [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isTetris ? 'square' : 'sine';
    osc.frequency.value = freq;
    const noteStart = t + i * 0.06;
    const noteDur = isTetris ? 0.12 : 0.08;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur);
    osc.connect(gain).connect(dest);
    osc.start(noteStart);
    osc.stop(noteStart + noteDur);
  });

  // Tetris shimmer
  if (isTetris) {
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.value = 1568; // G6
    shimmerGain.gain.setValueAtTime(0.08, t + 0.2);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    // Tremolo via gain modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 20;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(shimmerGain.gain);
    shimmer.connect(shimmerGain).connect(dest);
    lfo.start(t + 0.2);
    shimmer.start(t + 0.2);
    lfo.stop(t + 0.4);
    shimmer.stop(t + 0.4);
  }
}

export function playLevelUp(ctx: Ctx, dest: Dest): void {
  const t = ctx.currentTime;
  const notes = [523.25, 659.25]; // C5, E5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const noteStart = t + i * 0.15;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.2);
    osc.connect(gain).connect(dest);
    osc.start(noteStart);
    osc.stop(noteStart + 0.2);
  });
}

export function playGameOver(ctx: Ctx, dest: Dest): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.8);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, t);
  filter.frequency.exponentialRampToValueAtTime(200, t + 0.8);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  osc.connect(filter).connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.8);
}

export function playGameStart(ctx: Ctx, dest: Dest): void {
  const t = ctx.currentTime;
  const notes = [261.63, 329.63, 392.0]; // C4, E4, G4
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const noteStart = t + i * 0.08;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.1);
    osc.connect(gain).connect(dest);
    osc.start(noteStart);
    osc.stop(noteStart + 0.1);
  });
}

export function playPauseToggle(ctx: Ctx, dest: Dest): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 350;
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.04);
}
