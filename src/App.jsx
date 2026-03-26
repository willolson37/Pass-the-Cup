import { useReducer, useEffect, useCallback } from 'react'
import { createInitialState, processAtBat } from './utils/gameLogic.js'
import Home from './components/Home.jsx'
import PlayerSetup from './components/Setup/PlayerSetup.jsx'
import GameBoard from './components/Game/GameBoard.jsx'
import GameSelector from './components/LiveGame/GameSelector.jsx'
import LiveGameBoard from './components/LiveGame/LiveGameBoard.jsx'

const LS_KEY = 'ptc-state'

const initialAppState = {
  screen: 'home',
  mode: null,
  playerNames: [],
  gameState: null,
  liveConfig: null,
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.screen) return parsed
    return null
  } catch {
    return null
  }
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SELECT_MODE':
      return { ...state, mode: action.mode, screen: 'setup' }

    case 'SETUP_COMPLETE': {
      const gameState = createInitialState(action.playerNames)
      const nextScreen = state.mode === 'live' ? 'liveSelect' : 'game'
      return {
        ...state,
        playerNames: action.playerNames,
        gameState,
        screen: nextScreen,
      }
    }

    case 'AT_BAT': {
      const newGameState = processAtBat(
        state.gameState,
        action.outcome,
        action.mlbContext || null,
      )
      return { ...state, gameState: newGameState }
    }

    case 'SELECT_GAME':
      return {
        ...state,
        liveConfig: {
          gamePk: action.gameInfo.gamePk,
          homeTeam: action.gameInfo.homeTeam,
          awayTeam: action.gameInfo.awayTeam,
          homeTeamAbbr: action.gameInfo.homeTeamAbbr,
          awayTeamAbbr: action.gameInfo.awayTeamAbbr,
          trackTeam: action.gameInfo.trackTeam,
        },
        screen: 'liveGame',
      }

    case 'RESET_GAME':
      return { ...initialAppState }

    case 'BACK_TO_SETUP':
      return { ...state, screen: 'setup', gameState: null, liveConfig: null }

    case 'LOAD_STATE':
      return action.savedState

    default:
      return state
  }
}

export default function App() {
  const [appState, dispatch] = useReducer(appReducer, initialAppState, () => {
    const saved = loadSavedState()
    return saved || initialAppState
  })

  // Persist state on every change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(appState))
    } catch {
      // storage might be full or unavailable — ignore
    }
  }, [appState])

  const onSelectMode = useCallback((mode) => {
    dispatch({ type: 'SELECT_MODE', mode })
  }, [])

  const onSetupComplete = useCallback((playerNames) => {
    dispatch({ type: 'SETUP_COMPLETE', playerNames })
  }, [])

  const onAtBat = useCallback((outcome, mlbContext = null) => {
    dispatch({ type: 'AT_BAT', outcome, mlbContext })
  }, [])

  const onSelectGame = useCallback((gameInfo) => {
    dispatch({ type: 'SELECT_GAME', gameInfo })
  }, [])

  const onResetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' })
    try {
      localStorage.removeItem(LS_KEY)
    } catch {
      // ignore
    }
  }, [])

  const onBackToSetup = useCallback(() => {
    dispatch({ type: 'BACK_TO_SETUP' })
  }, [])

  const { screen, mode, playerNames, gameState, liveConfig } = appState

  return (
    <div className="app">
      {screen === 'home' && <Home onSelectMode={onSelectMode} />}

      {screen === 'setup' && (
        <PlayerSetup
          mode={mode}
          onComplete={onSetupComplete}
          onBack={onResetGame}
        />
      )}

      {screen === 'game' && gameState && (
        <GameBoard
          gameState={gameState}
          onAtBat={onAtBat}
          onReset={onResetGame}
        />
      )}

      {screen === 'liveSelect' && (
        <GameSelector
          playerNames={playerNames}
          onSelectGame={onSelectGame}
          onBack={onBackToSetup}
        />
      )}

      {screen === 'liveGame' && gameState && liveConfig && (
        <LiveGameBoard
          gameState={gameState}
          liveConfig={liveConfig}
          onAtBat={onAtBat}
          onReset={onResetGame}
          playerNames={playerNames}
        />
      )}
    </div>
  )
}
