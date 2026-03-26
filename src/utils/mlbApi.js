const BASE = 'https://statsapi.mlb.com'

function getTodaysDate() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function fetchTodaysGames() {
  const date = getTodaysDate()
  const url = `${BASE}/api/v1/schedule?sportId=1&date=${date}&hydrate=linescore,team`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`MLB API error: ${res.status}`)
  const data = await res.json()

  const games = []
  const dates = data.dates || []
  for (const d of dates) {
    for (const game of d.games || []) {
      const abstractState = game.status?.abstractGameState || ''
      const detailedState = game.status?.detailedState || ''
      const codedState = game.status?.codedGameState || ''

      let status = 'Preview'
      if (abstractState === 'Live' || codedState === 'I') {
        status = 'Live'
      } else if (abstractState === 'Final' || codedState === 'F' || codedState === 'O') {
        status = 'Final'
      }

      const linescore = game.linescore || {}
      const inningOrdinal = linescore.currentInningOrdinal || ''
      const inningHalf = linescore.inningHalf || ''
      const homeScore = linescore.teams?.home?.runs ?? game.teams?.home?.score ?? 0
      const awayScore = linescore.teams?.away?.runs ?? game.teams?.away?.score ?? 0

      games.push({
        gamePk: game.gamePk,
        status,
        detailedStatus: detailedState,
        homeTeam: game.teams?.home?.team?.name || 'Home',
        homeTeamAbbr: game.teams?.home?.team?.abbreviation || 'HOM',
        awayTeam: game.teams?.away?.team?.name || 'Away',
        awayTeamAbbr: game.teams?.away?.team?.abbreviation || 'AWY',
        homeScore,
        awayScore,
        inning: inningOrdinal,
        inningHalf,
      })
    }
  }

  // Sort: Live first, then Preview, then Final
  const order = { Live: 0, Preview: 1, Final: 2 }
  games.sort((a, b) => order[a.status] - order[b.status])

  return games
}

export async function fetchLiveFeed(gamePk) {
  const url = `${BASE}/api/v1.1/game/${gamePk}/feed/live`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MLB API error: ${res.status}`)
  return res.json()
}

export async function fetchBoxscoreLineup(gamePk) {
  const feed = await fetchLiveFeed(gamePk)

  const gamePlayers = feed.gameData?.players || {}
  const boxTeams = feed.liveData?.boxscore?.teams || {}

  function buildLineup(side) {
    const teamData = boxTeams[side] || {}
    const battingOrder = teamData.battingOrder || []
    const teamInfo = teamData.team || {}

    const lineup = battingOrder.map((playerId, idx) => {
      const playerKey = `ID${playerId}`
      const player = gamePlayers[playerKey] || {}
      const boxPlayer = teamData.players?.[playerKey] || {}
      return {
        position: idx + 1,
        playerId,
        name: player.fullName || boxPlayer.person?.fullName || `Player ${playerId}`,
        jerseyNumber: boxPlayer.jerseyNumber || '',
      }
    })

    return {
      team: teamInfo.name || (side === 'home' ? 'Home' : 'Away'),
      abbr: teamInfo.abbreviation || (side === 'home' ? 'HOM' : 'AWY'),
      lineup,
    }
  }

  return {
    home: buildLineup('home'),
    away: buildLineup('away'),
  }
}
