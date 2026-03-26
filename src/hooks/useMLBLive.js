import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchLiveFeed } from '../utils/mlbApi.js'
import { classifyMLBPlay } from '../utils/gameLogic.js'

export function useMLBLive({
  gamePk,
  trackTeam,
  onNewPlay,
  enabled,
  intervalMs = 15000,
}) {
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState(null)
  const [gameStatus, setGameStatus] = useState(null)
  const [currentBatter, setCurrentBatter] = useState(null)
  const [currentInning, setCurrentInning] = useState(null)
  const [currentHalfInning, setCurrentHalfInning] = useState(null)

  const lastAtBatIndexRef = useRef(-1)
  const intervalRef = useRef(null)
  const onNewPlayRef = useRef(onNewPlay)

  // Keep the ref current without triggering re-renders
  useEffect(() => {
    onNewPlayRef.current = onNewPlay
  }, [onNewPlay])

  const poll = useCallback(async () => {
    if (!gamePk) return
    try {
      const feed = await fetchLiveFeed(gamePk)

      const allPlays = feed.liveData?.plays?.allPlays || []
      const status = feed.gameData?.status?.abstractGameState || null
      const batter =
        feed.liveData?.plays?.currentPlay?.matchup?.batter?.fullName || null
      const inningOrdinal = feed.liveData?.linescore?.currentInningOrdinal || null
      const halfInning = feed.liveData?.linescore?.inningHalf || null

      setGameStatus(status)
      setCurrentBatter(batter)
      setCurrentInning(inningOrdinal)
      setCurrentHalfInning(halfInning)
      setError(null)

      const lastIdx = lastAtBatIndexRef.current

      // Filter new completed plays
      const newPlays = allPlays.filter(
        (play) =>
          play.about?.isComplete === true &&
          play.about?.atBatIndex > lastIdx,
      )

      // Apply team filter
      const teamFiltered = newPlays.filter((play) => {
        if (trackTeam === 'home') return play.about?.halfInning === 'bottom'
        if (trackTeam === 'away') return play.about?.halfInning === 'top'
        return true // 'both'
      })

      // Sort by atBatIndex ascending
      teamFiltered.sort((a, b) => a.about.atBatIndex - b.about.atBatIndex)

      for (const play of teamFiltered) {
        const outcome = classifyMLBPlay(play)
        if (outcome !== null) {
          const mlbContext = {
            batterName: play.matchup?.batter?.fullName || null,
            inning: play.about?.inning || null,
            halfInning: play.about?.halfInning || null,
            event: play.result?.event || null,
          }
          onNewPlayRef.current(outcome, mlbContext)
        }
      }

      // Update lastAtBatIndex to max seen across ALL new complete plays (not just team-filtered)
      const newComplete = allPlays.filter(
        (play) =>
          play.about?.isComplete === true && play.about?.atBatIndex > lastIdx,
      )
      if (newComplete.length > 0) {
        const maxIdx = Math.max(...newComplete.map((p) => p.about.atBatIndex))
        lastAtBatIndexRef.current = maxIdx
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch live feed')
    }
  }, [gamePk, trackTeam])

  useEffect(() => {
    if (!enabled || !gamePk) {
      setIsPolling(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    setIsPolling(true)
    // Fire immediately
    poll()

    intervalRef.current = setInterval(poll, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, gamePk, intervalMs, poll])

  return {
    isPolling,
    error,
    gameStatus,
    currentBatter,
    currentInning,
    currentHalfInning,
  }
}
