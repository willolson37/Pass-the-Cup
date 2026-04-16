import { useReducer, useEffect, useCallback } from 'react'
import { createInitialState, processAtBat } from './utils/gameLogic.js'
import { useAuth } from './hooks/useAuth.js'
import Home from './components/Home.jsx'
import PlayerSetup from './components/Setup/PlayerSetup.jsx'
import GameBoard from './components/Game/GameBoard.jsx'
import GameSelector from './components/LiveGame/GameSelector.jsx'
import LiveGameBoard from './components/LiveGame/LiveGameBoard.jsx'
import AuthScreen from './components/Auth/AuthScreen.jsx'
import PricingScreen from './components/Paywall/PricingScreen.jsx'
import SpectatorView from './components/SpectatorView.jsx'
import HistoryScreen from './components/History/HistoryScreen.jsx'

const LS_KEY = 'ptc-state'
const HISTORY_KEY = 'ptc-history'

const initialAppState = {
  screen: 'home',
  mode: null,
  playerNames: [],
  gameState: null,
  liveConfig: null,
  previousGameState: null, // single-step undo
  spectatorCode: null,
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

function saveToHistory(gameState) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const history = raw ? JSON.parse(raw) : []
    const winner = [...gameState.players].sort((a, b) => b.balance - a.balance)[0]
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      players: gameState.players.map(p => ({ name: p.name, finalBalance: p.balance })),
      winner: winner?.name || '',
      potMode: gameState.potMode || null,
      multiplier: gameState.multiplier || 1,
      totalAtBats: gameState.events?.length || 0,
    }
    history.unshift(entry)
    // Keep last 50 games
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
  } catch {
    // ignore storage errors
  }
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SELECT_MODE':
      return { ...state, mode: action.mode, screen: 'setup' }

    case 'SETUP_COMPLETE': {
      const gameState = createInitialState(
        action.playerData,
        action.potMode,
        action.multiplier,
        action.houseRules,
      )
      const nextScreen = action.nextScreen || (state.mode === 'live' ? 'liveSelect' : 'game')
      return {
        ...state,
        playerNames: action.playerData.map(pd => typeof pd === 'string' ? pd : pd.name),
        gameState,
        screen: nextScreen,
        previousGameState: null,
      }
    }

    case 'AT_BAT': {
      const newGameState = processAtBat(
        state.gameState,
        action.outcome,
        action.mlbContext || null,
      )
      return {
        ...state,
        gameState: newGameState,
        previousGameState: state.gameState, // save for undo
      }
    }

    case 'UNDO_AT_BAT': {
      if (!state.previousGameState) return state
      return {
        ...state,
        gameState: state.previousGameState,
        previousGameState: null,
      }
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
      return { ...state, screen: 'setup', gameState: null, liveConfig: null, previousGameState: null }

    case 'GO_TO_SCREEN':
      return { ...state, screen: action.screen }

    case 'JOIN_GAME':
      return { ...state, screen: 'spectator', spectatorCode: action.code }

    case 'LEAVE_SPECTATOR':
      return { ...state, screen: 'home', spectatorCode: null }

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

  const { user, profile, loading, hasLiveAccess, signOut, refreshProfile } = useAuth()

  // Persist state on every change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(appState))
    } catch {
      // storage might be full or unavailable — ignore
    }
  }, [appState])

  // Handle ?payment=success and ?join=CODE URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', window.location.pathname)
      refreshProfile().then(() => {
        dispatch({ type: 'GO_TO_SCREEN', screen: 'liveSelect' })
      })
    }
    const joinCode = params.get('join')
    if (joinCode) {
      window.history.replaceState({}, '', window.location.pathname)
      dispatch({ type: 'JOIN_GAME', code: joinCode.toUpperCase() })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onSelectMode = useCallback((mode) => {
    dispatch({ type: 'SELECT_MODE', mode })
  }, [])

  const onSetupComplete = useCallback((playerData, potMode, multiplier, houseRules) => {
    dispatch({ type: 'SETUP_COMPLETE', playerData, potMode, multiplier, houseRules })
  }, [])

  const onSetupCompleteLive = useCallback((playerData, potMode, multiplier, houseRules) => {
    dispatch({ type: 'SETUP_COMPLETE', playerData, potMode, multiplier, houseRules, nextScreen: 'liveSelect' })
  }, [])

  const onAtBat = useCallback((outcome, mlbContext = null) => {
    dispatch({ type: 'AT_BAT', outcome, mlbContext })
  }, [])

  const onUndoAtBat = useCallback(() => {
    dispatch({ type: 'UNDO_AT_BAT' })
  }, [])

  const onSelectGame = useCallback((gameInfo) => {
    dispatch({ type: 'SELECT_GAME', gameInfo })
  }, [])

  const onResetGame = useCallback((currentGameState) => {
    // Save to history if there were at-bats
    if (currentGameState && currentGameState.events?.length > 0) {
      saveToHistory(currentGameState)
    }
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

  const onJoinGame = useCallback((code) => {
    dispatch({ type: 'JOIN_GAME', code })
  }, [])

  // After auth/pricing, re-check access and proceed
  const onAuthSuccess = useCallback(() => {
    if (hasLiveAccess()) {
      dispatch({ type: 'GO_TO_SCREEN', screen: 'liveSelect' })
    } else {
      dispatch({ type: 'GO_TO_SCREEN', screen: 'pricing' })
    }
  }, [hasLiveAccess])

  // When user state changes while on auth screen, auto-advance
  useEffect(() => {
    if (!loading && user && appState.screen === 'auth') {
      if (hasLiveAccess()) {
        dispatch({ type: 'GO_TO_SCREEN', screen: 'liveSelect' })
      } else {
        dispatch({ type: 'GO_TO_SCREEN', screen: 'pricing' })
      }
    }
  }, [user, loading, appState.screen, hasLiveAccess])

  const { screen, mode, playerNames, gameState, liveConfig, previousGameState, spectatorCode } = appState

  const handleSetupComplete = mode === 'live' ? onSetupCompleteLive : onSetupComplete

  return (
    <div className="app">
      {screen === 'home' && (
        <Home
          onSelectMode={onSelectMode}
          onJoinGame={onJoinGame}
          onViewHistory={() => dispatch({ type: 'GO_TO_SCREEN', screen: 'history' })}
          user={user}
          profile={profile}
          hasLiveAccess={hasLiveAccess}
          onSignOut={signOut}
        />
      )}

      {screen === 'setup' && (
        <PlayerSetup
          mode={mode}
          onComplete={handleSetupComplete}
          onBack={onResetGame}
        />
      )}

      {screen === 'auth' && (
        <AuthScreen onBack={() => dispatch({ type: 'BACK_TO_SETUP' })} />
      )}

      {screen === 'pricing' && (
        <PricingScreen
          user={user}
          onBack={() => dispatch({ type: 'BACK_TO_SETUP' })}
          onSuccess={() => dispatch({ type: 'SETUP_COMPLETE', playerData: appState.playerNames, nextScreen: 'liveSelect' })}
        />
      )}

      {screen === 'game' && gameState && (
        <GameBoard
          gameState={gameState}
          onAtBat={onAtBat}
          onUndo={previousGameState ? onUndoAtBat : null}
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
          onUndo={previousGameState ? onUndoAtBat : null}
          onReset={onResetGame}
          playerNames={playerNames}
        />
      )}

      {screen === 'spectator' && spectatorCode && (
        <SpectatorView
          code={spectatorCode}
          onLeave={() => dispatch({ type: 'LEAVE_SPECTATOR' })}
        />
      )}

      {screen === 'history' && (
        <HistoryScreen
          onBack={() => dispatch({ type: 'GO_TO_SCREEN', screen: 'home' })}
        />
      )}
    </div>
  )
}
