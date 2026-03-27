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
      const gameState = createInitialState(action.playerNames, action.potMode)
      const nextScreen = action.nextScreen || (state.mode === 'live' ? 'liveSelect' : 'game')
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

    case 'GO_TO_SCREEN':
      return { ...state, screen: action.screen }

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

  // Handle ?payment=success redirect back from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', window.location.pathname)
      refreshProfile().then(() => {
        dispatch({ type: 'GO_TO_SCREEN', screen: 'liveSelect' })
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onSelectMode = useCallback((mode) => {
    dispatch({ type: 'SELECT_MODE', mode })
  }, [])

  const onSetupComplete = useCallback((playerNames, potMode) => {
    dispatch({ type: 'SETUP_COMPLETE', playerNames, potMode })
  }, [])

  // Called when setup is complete for live mode — gate behind auth + subscription
  const onSetupCompleteLive = useCallback((playerNames, potMode) => {
    if (!user) {
      // Not logged in — go to auth screen
      dispatch({ type: 'SETUP_COMPLETE', playerNames, potMode, nextScreen: 'auth' })
    } else if (hasLiveAccess()) {
      // Has access — go to live select
      dispatch({ type: 'SETUP_COMPLETE', playerNames, potMode, nextScreen: 'liveSelect' })
    } else {
      // Logged in but no credits/plan — go to pricing
      dispatch({ type: 'SETUP_COMPLETE', playerNames, potMode, nextScreen: 'pricing' })
    }
  }, [user, hasLiveAccess])

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

  // After auth/pricing, re-check access and proceed
  const onAuthSuccess = useCallback(() => {
    // onAuthStateChange in useAuth handles user state; after login check for access
    // The auth screen will trigger a re-render when user changes, then we can check
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

  const { screen, mode, playerNames, gameState, liveConfig } = appState

  // Choose the correct onSetupComplete based on mode
  const handleSetupComplete = mode === 'live' ? onSetupCompleteLive : onSetupComplete

  return (
    <div className="app">
      {screen === 'home' && (
        <Home
          onSelectMode={onSelectMode}
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
          onSuccess={() => dispatch({ type: 'SETUP_COMPLETE', playerNames: appState.playerNames, nextScreen: 'liveSelect' })}
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
