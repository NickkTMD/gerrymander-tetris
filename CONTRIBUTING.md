# Gerrymander Tetris — Codebase Guide

## What This Project Is

**Gerrymander Tetris** is an educational web game that turns US congressional districts into Tetris pieces. Real district shapes from the 119th Congress are rasterized into grids, colored by political lean, and dropped as playable pieces onto a 20×35 board. Clearing lines scores points. The 25 most gerrymandered districts are the default piece set.

The app has three pages:
- `/` — the Tetris game
- `/library` — browse/filter all 435 congressional districts, view their geomaps and rasterizations
- `/leaderboard` — high score table (currently mock data)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, React Router 7 |
| Language | TypeScript 5.9 (strict mode) |
| Build | Vite 7 |
| Audio | Web Audio API (synthesized, no audio files) |
| Geo data | TopoJSON / GeoJSON via Census Bureau |
| Scripts | Node.js + `tsx` for data pipeline |

---

## Project Structure

```
gerrymander-tetris/
├── src/
│   ├── game/            # Core Tetris logic and state machine
│   ├── hooks/           # useGameLoop, useSoundDispatch
│   ├── components/      # React components (Board, SidePanel, etc.)
│   ├── pages/           # Library.tsx, Leaderboard.tsx
│   ├── audio/           # Sound engine and effects
│   ├── constants/       # Piece definitions, board dimensions, featured districts
│   ├── data/            # Static lookup tables + AUTO-GENERATED piece shapes
│   ├── rasterize/       # Polygon-to-grid algorithms
│   └── types/           # TypeScript interfaces
├── scripts/             # Data pipeline: download + rasterize districts
├── public/data/         # districts.topo.json (pre-downloaded Census data)
└── App.tsx              # Root game component, wires everything together
```

---

## Getting Started

```bash
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # TypeScript check + Vite production bundle → dist/
npm run lint      # ESLint
```

There are no tests configured. Game logic functions are pure and easily unit-testable if you add Vitest.

---

## Architecture Overview

### State Management

The game uses a single `useReducer` in `App.tsx`. All game state lives in one `GameState` object:

```typescript
// src/types/tetris.ts
interface GameState {
  board: BoardGrid;              // 35 rows × 20 cols; cell = piece ID string or null
  activePiece: ActivePiece | null;
  nextPieceType: string;
  score: number;
  linesCleared: number;
  level: number;                 // Math.floor(linesCleared / 10)
  status: 'idle' | 'playing' | 'paused' | 'gameover';
  tickIntervalMs: number;        // Decreases with level
  piecesPlaced: number;
}
```

The reducer is created via `createGameReducer(featureFlags)`, which closes over the flags so feature toggles don't need to pass through every action. The reducer is pure — no side effects.

### Game Loop

`useGameLoop` (src/hooks/useGameLoop.ts) does two things:

1. **Tick interval** — `setInterval` fires every `tickIntervalMs`, dispatching `TICK`. The reducer moves the active piece down one row, locking it if it can't fall further and then clearing full rows.
2. **Keyboard input** — `keydown` listener maps keys to actions:
   - `←` / `a` → `MOVE_LEFT`
   - `→` / `d` → `MOVE_RIGHT`
   - `↑` / `w` → `ROTATE`
   - `↓` / `s` → `SOFT_DROP`
   - `Space` → `HARD_DROP`
   - `p` / `Esc` → `TOGGLE_PAUSE`

### Game Logic (Pure Functions)

All core algorithms are in `src/game/logic.ts`:

| Function | What It Does |
|---|---|
| `canPlace(board, shape, row, col)` | Collision detection: bounds + occupied cells |
| `rotateCW(shape)` | 90° clockwise rotation + wall-kick (tries ±1, ±2, ±3 horizontal offsets) |
| `lockPiece(board, piece)` | Burns active piece into the board grid |
| `clearFullRows(board)` | Removes completed rows, prepends empty rows at top |
| `spawnPiece(type)` | Creates a new active piece centered at top |
| `computeScore(lines, level)` | 100/300/500/800 × (level+1) for 1/2/3/4 lines |
| `computeTickInterval(level)` | `max(100, 800 - level×70)` ms |

### Sound System

Sound is completely decoupled from game logic via `useSoundDispatch` (src/hooks/useSoundDispatch.ts):

1. The hook wraps `dispatch` and intercepts every action.
2. It runs the reducer to get the next state.
3. It passes `(action, prevState, nextState)` to `soundMap`, which returns a list of `SoundEntry` objects.
4. It plays those sounds via `AudioEngine`, then dispatches the action for real.

`soundMap` is a pure function — no side effects. `soundEffects.ts` synthesizes all sounds using Web Audio oscillators and envelopes. There are no audio files.

This design means adding a new sound event requires only editing `soundMap.ts`, with no changes to game logic or the reducer.

---

## Piece System

### Piece IDs

Every piece is identified by a string in the format `d` + GEOID (FIPS state code + district number).

Example: `d0614` = California (FIPS 06), District 14.

### Piece Shape

`src/data/generatedPieces.ts` is auto-generated by the data pipeline and maps each piece ID to a `boolean[][]` — a grid where `true` = filled cell.

`src/constants/pieces.ts` maps piece IDs to `{ shape, color, name }`. The 25 featured pieces are listed in `src/constants/featuredDistricts.ts`.

### Adding New Pieces

To add a district as a playable piece:
1. Make sure it's in `generatedPieces.ts` (run the data pipeline if needed).
2. Add an entry to `src/constants/featuredDistricts.ts`.
3. Add it to the `PIECES` map in `src/constants/pieces.ts` with a name and color.

---

## Data Pipeline

Congressional district shapes go through a two-step pipeline before they appear in the game.

### Step 1: Download

```bash
npm run download-districts
# → public/data/districts.topo.json
```

`scripts/download-districts.ts` fetches TIGER/GENZ 2024 CD119 shapefiles from the Census Bureau, converts them to TopoJSON, and writes the file to `public/data/`.

This file is already committed — you only need to re-run this if the Census data changes.

### Step 2: Rasterize

```bash
npm run rasterize
# → src/data/generatedPieces.ts (OVERWRITES — do not hand-edit)
```

`scripts/rasterize-districts.ts` reads `districts.topo.json`, calls the rasterizer for each feature, and writes the resulting `boolean[][]` arrays as a TypeScript module.

`src/rasterize/rasterizer.ts` handles:
- Bounding box calculation
- Aspect-preserving scaling to fit ~10×10 grid
- Ray-casting point-in-polygon test (src/rasterize/pointInPolygon.ts)
- Multipolygons, holes, and anti-meridian wrapping (Alaska)

---

## Political Lean & Colors

`src/data/stateLeans.ts` maps 2-digit state FIPS codes to a 5-level lean enum:

```
0 = StrongR  →  dark red
1 = LeanR    →  light red
2 = Tossup   →  purple
3 = LeanD    →  light blue
4 = StrongD  →  dark blue
```

All districts within a state share the same color. This is a deliberate simplification — individual district lean is not currently used.

---

## Key Files Quick Reference

| File | Role |
|---|---|
| `src/App.tsx` | Root component; owns `useReducer`, wires hooks |
| `src/game/reducer.ts` | State machine; all action handlers |
| `src/game/logic.ts` | Pure Tetris algorithms |
| `src/hooks/useGameLoop.ts` | Tick interval + keyboard input |
| `src/hooks/useSoundDispatch.ts` | Intercepts dispatch → plays sounds |
| `src/components/Board.tsx` | Renders the 20×35 grid |
| `src/constants/pieces.ts` | PIECES map: ID → shape/color/name |
| `src/constants/featuredDistricts.ts` | The 25 playable pieces |
| `src/data/generatedPieces.ts` | AUTO-GENERATED rasterized shapes |
| `src/data/stateGerrymanderScores.ts` | Top 20 states, efficiency gap, rank |
| `src/data/stateLeans.ts` | FIPS → political lean |
| `src/audio/soundMap.ts` | Maps game events → sound entries |
| `src/audio/soundEffects.ts` | Web Audio synthesis functions |
| `scripts/download-districts.ts` | Census Bureau download step |
| `scripts/rasterize-districts.ts` | Rasterization step |

---

## Feature Flags

`src/types/featureFlags.ts` defines the `FeatureFlags` interface. Flags are toggled via `FeatureFlagsPanel.tsx` (visible only when not playing) and passed into `createGameReducer`. Current flags:

- `periodicBottomClear` — every 5 pieces placed, clears the bottom N rows

---

## Gerrymandering Score

The score (0–100) is a compactness measure based on the isoperimetric quotient:

```
score ≈ (perimeter / sqrt(area))² → normalized to 0–100
```

Higher = more contorted = more likely gerrymandered. Scores and efficiency gap data are stored in `src/data/stateGerrymanderScores.ts`. The efficiency gap is a measure of wasted votes between parties.

---

## TypeScript Conventions

- **Strict mode** — no implicit `any`, no unused variables/params.
- **Discriminated union actions** — the reducer uses `action.type` as the discriminant.
- **No `any` in game types** — all board cells are `string | null`.
- Two separate `tsconfig` files: `tsconfig.app.json` (browser, ES2022) and `tsconfig.node.json` (scripts, Node.js).

---

## Common Contribution Tasks

**Change game speed:** Edit `computeTickInterval` in `src/game/logic.ts`.

**Change scoring:** Edit `computeScore` in `src/game/logic.ts`.

**Add a sound:** Add a synth function in `src/audio/soundEffects.ts`, then map an event to it in `src/audio/soundMap.ts`.

**Add a new playable district:** See "Adding New Pieces" above.

**Add a feature flag:** Add to `FeatureFlags` interface, check it inside `createGameReducer`, add a toggle to `FeatureFlagsPanel.tsx`.

**Change board dimensions:** Edit `BOARD_ROWS` / `COLS` in `src/constants/board.ts` and update `App.css` CSS custom properties accordingly.
