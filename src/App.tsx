import { useReducer, useEffect, useRef, useState, useMemo } from 'react'
import './App.css'
import Board from './components/Board'
import SidePanel from './components/SidePanel'
import FeatureFlagsPanel from './components/FeatureFlagsPanel'
import { createGameReducer, initialState } from './game/reducer'
import { mergePieceOntoBoard } from './game/logic'
import type { SandCell } from './types/tetris'
import { useGameLoop } from './hooks/useGameLoop'
import { useSoundDispatch } from './hooks/useSoundDispatch'
import { audioEngine } from './audio/AudioEngine'
import { addScore } from './leaderboard'
import { DEFAULT_FEATURE_FLAGS } from './types/featureFlags'
import type { FeatureFlags } from './types/featureFlags'

function App() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const reducer = useMemo(() => createGameReducer(flags), [flags]);
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const dispatch = useSoundDispatch(rawDispatch, state);
  const [muted, setMuted] = useState(false);
  const isSandSettling = state.sandCells !== null;
  useGameLoop(dispatch, state.status, state.tickIntervalMs, state.hardDropping, isSandSettling, state.sandSpeedMs);

  const prevStatus = useRef(state.status);
  useEffect(() => {
    if (prevStatus.current !== 'gameover' && state.status === 'gameover') {
      addScore('Player', state.score);
    }
    prevStatus.current = state.status;
  }, [state.status, state.score]);

  let displayGrid = mergePieceOntoBoard(state.board, state.activePiece);
  if (state.sandCells) {
    displayGrid = displayGrid.map(row => [...row]);
    for (const cell of state.sandCells as SandCell[]) {
      if (cell.row >= 0) displayGrid[cell.row][cell.col] = cell.type;
    }
  }

  const isPlaying = state.status === 'playing';

  return (
    <div className="game-page">
      <div className="game-container">
        <div className="controls-hint">
          <h2>Controls</h2>
          <div className="hint-text">
            ← → / A D &nbsp; Move<br />
            ↑ / W &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Rotate<br />
            ↓ / S &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Soft drop<br />
            Space &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Hard drop<br />
            P / Esc &nbsp;&nbsp;&nbsp; Pause
          </div>
          <FeatureFlagsPanel
            flags={flags}
            onToggle={(key) => setFlags(prev => ({ ...prev, [key]: !prev[key] }))}
            disabled={isPlaying}
          />
          <button
            className="mute-button"
            onClick={() => { audioEngine.toggleMute(); setMuted(audioEngine.muted); }}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? 'Audio: Off' : 'Audio: On'}
          </button>
        </div>
        <div className="board-wrapper">
          <Board grid={displayGrid} activePiece={state.activePiece} sandMode={flags.sandMode} />
          {state.status === 'idle' && (
            <div className="overlay">
              <span className="overlay-idle-label">Gerrymander Tetris</span>
              <button className="start-button" onClick={() => dispatch({ type: 'START_GAME' })}>
                Start
              </button>
            </div>
          )}
          {state.status === 'paused' && (
            <div className="overlay">
              <span className="overlay-paused-text">Paused</span>
            </div>
          )}
          {state.status === 'gameover' && (
            <div className="overlay overlay-gameover">
              <div className="overlay-gameover-stamp">Game Over</div>
              <button className="start-button overlay-gameover-button" onClick={() => dispatch({ type: 'START_GAME' })}>
                Play Again
              </button>
            </div>
          )}
        </div>
        <SidePanel
          score={state.score}
          nextPiece={state.nextPieceType}
          level={state.level}
          linesCleared={state.linesCleared}
        />
      </div>
    </div>
  )
}

export default App
