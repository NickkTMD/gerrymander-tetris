import { useReducer, useEffect, useRef, useState, useMemo } from 'react'
import './App.css'
import Board from './components/Board'
import SidePanel from './components/SidePanel'
import FeatureFlagsPanel from './components/FeatureFlagsPanel'
import { createGameReducer, initialState } from './game/reducer'
import { mergePieceOntoBoard } from './game/logic'
import { useGameLoop } from './hooks/useGameLoop'
import { useSoundDispatch } from './hooks/useSoundDispatch'
import { audioEngine } from './audio/AudioEngine'
import { addScore } from './leaderboard'
import GameLogo from './components/GameLogo'
import { DEFAULT_FEATURE_FLAGS } from './types/featureFlags'
import type { FeatureFlags } from './types/featureFlags'

function App() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const reducer = useMemo(() => createGameReducer(flags), [flags]);
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const dispatch = useSoundDispatch(rawDispatch, state);
  const [muted, setMuted] = useState(false);
  useGameLoop(dispatch, state.status, state.tickIntervalMs);

  const prevStatus = useRef(state.status);
  useEffect(() => {
    if (prevStatus.current !== 'gameover' && state.status === 'gameover') {
      addScore('Player', state.score);
    }
    prevStatus.current = state.status;
  }, [state.status, state.score]);

  const displayGrid = mergePieceOntoBoard(state.board, state.activePiece);

  return (
    <>
    <div className="game-header">
      <GameLogo />
      <button
        className="mute-button"
        onClick={() => { audioEngine.toggleMute(); setMuted(audioEngine.muted); }}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? '\u{1F507}' : '\u{1F50A}'}
      </button>
    </div>
    <div className="game-container">
      <div className="controls-hint">
        {state.status !== 'idle' && (
          <>
            <h2>Controls</h2>
            <div className="hint-text">
              ← → / A D Move<br />
              ↑ / W Rotate<br />
              ↓ / S Soft drop<br />
              Space Hard drop<br />
              P/Esc Pause
            </div>
          </>
        )}
        {state.status !== 'playing' && (
          <FeatureFlagsPanel
            flags={flags}
            onToggle={(key) => setFlags(prev => ({ ...prev, [key]: !prev[key] }))}
          />
        )}
      </div>
      <div className="board-wrapper">
        <Board grid={displayGrid} />
        {state.status === 'idle' && (
          <div className="overlay overlay-start">
            <button className="start-button" onClick={() => dispatch({ type: 'START_GAME' })}>
              Start
            </button>
          </div>
        )}
        {state.status === 'paused' && (
          <div className="overlay">PAUSED</div>
        )}
        {state.status === 'gameover' && (
          <div className="overlay overlay-gameover">
            <div>GAME OVER</div>
            <button className="start-button" onClick={() => dispatch({ type: 'START_GAME' })}>
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
    </div>    </>
  )
}

export default App
