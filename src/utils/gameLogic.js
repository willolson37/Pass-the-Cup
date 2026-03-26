export const OUTCOMES = {
  SINGLE: 'single',
  DOUBLE: 'double',
  TRIPLE: 'triple',
  HOME_RUN: 'homeRun',
  OUT: 'out',
  STRIKEOUT: 'strikeout',
  DOUBLE_PLAY: 'doublePly',
  WALK: 'walk',
  HBP: 'hbp',
  ERROR: 'error',
}

export const OUTCOME_LABELS = {
  [OUTCOMES.SINGLE]: 'Single',
  [OUTCOMES.DOUBLE]: 'Double',
  [OUTCOMES.TRIPLE]: 'Triple',
  [OUTCOMES.HOME_RUN]: 'Home Run',
  [OUTCOMES.OUT]: 'Out',
  [OUTCOMES.STRIKEOUT]: 'Strikeout',
  [OUTCOMES.DOUBLE_PLAY]: 'Double Play',
  [OUTCOMES.WALK]: 'Walk',
  [OUTCOMES.HBP]: 'Hit By Pitch',
  [OUTCOMES.ERROR]: 'Error',
}

export function createInitialState(playerNames) {
  const players = playerNames.map((name, idx) => ({
    id: idx,
    name,
    balance: -1,
  }))
  return {
    players,
    pot: playerNames.length,
    currentPlayerIndex: 0,
    events: [],
  }
}

let eventIdCounter = 0

export function processAtBat(state, outcome, mlbContext = null) {
  const { players, pot, currentPlayerIndex, events } = state
  const currentPlayer = players[currentPlayerIndex]
  const numPlayers = players.length

  let newPot = pot
  let newPlayers = players.map(p => ({ ...p }))
  let balanceChange = 0
  let description = ''

  switch (outcome) {
    case OUTCOMES.SINGLE: {
      const take = Math.min(1, pot)
      newPlayers[currentPlayerIndex].balance += take
      newPot = pot - take
      balanceChange = take
      description = `${currentPlayer.name} hit a Single — takes $${take} from the pot`
      break
    }
    case OUTCOMES.DOUBLE: {
      const take = Math.min(2, pot)
      newPlayers[currentPlayerIndex].balance += take
      newPot = pot - take
      balanceChange = take
      description = `${currentPlayer.name} hit a Double — takes $${take} from the pot`
      break
    }
    case OUTCOMES.TRIPLE: {
      const take = Math.min(3, pot)
      newPlayers[currentPlayerIndex].balance += take
      newPot = pot - take
      balanceChange = take
      description = `${currentPlayer.name} hit a Triple — takes $${take} from the pot`
      break
    }
    case OUTCOMES.HOME_RUN: {
      const potTaken = pot
      // HR hitter takes the entire pot
      newPlayers[currentPlayerIndex].balance += potTaken
      // All players re-ante $1 (including HR hitter)
      newPlayers = newPlayers.map(p => ({ ...p, balance: p.balance - 1 }))
      newPot = numPlayers
      // Net balance change for HR hitter: potTaken - 1 (took pot, paid re-ante)
      balanceChange = potTaken - 1
      description = `${currentPlayer.name} hit a HOME RUN — takes $${potTaken} from the pot! Everyone re-antes $1`
      break
    }
    case OUTCOMES.OUT: {
      newPlayers[currentPlayerIndex].balance -= 1
      newPot = pot + 1
      balanceChange = -1
      description = `${currentPlayer.name} made an Out — adds $1 to the pot`
      break
    }
    case OUTCOMES.STRIKEOUT: {
      newPlayers[currentPlayerIndex].balance -= 2
      newPot = pot + 2
      balanceChange = -2
      description = `${currentPlayer.name} struck out — adds $2 to the pot`
      break
    }
    case OUTCOMES.DOUBLE_PLAY: {
      newPlayers[currentPlayerIndex].balance -= 2
      newPot = pot + 2
      balanceChange = -2
      description = `${currentPlayer.name} grounded into a Double Play — adds $2 to the pot`
      break
    }
    case OUTCOMES.ERROR: {
      newPlayers[currentPlayerIndex].balance -= 1
      newPot = pot + 1
      balanceChange = -1
      description = `${currentPlayer.name} reached on an Error — adds $1 to the pot`
      break
    }
    case OUTCOMES.WALK: {
      balanceChange = 0
      description = `${currentPlayer.name} walked — cup passes`
      break
    }
    case OUTCOMES.HBP: {
      balanceChange = 0
      description = `${currentPlayer.name} was hit by pitch — cup passes`
      break
    }
    default:
      break
  }

  const nextPlayerIndex = (currentPlayerIndex + 1) % numPlayers

  const newEvent = {
    id: `evt-${Date.now()}-${eventIdCounter++}`,
    playerName: currentPlayer.name,
    outcome,
    description,
    potBefore: pot,
    potAfter: newPot,
    balanceChange,
    mlbContext,
    timestamp: Date.now(),
  }

  return {
    ...state,
    players: newPlayers,
    pot: newPot,
    currentPlayerIndex: nextPlayerIndex,
    events: [newEvent, ...events],
  }
}

// Returns the minimal list of transactions to settle all debts.
// Uses a greedy algorithm: largest debtor pays largest creditor first.
export function calculateSettlement(players) {
  // Work in integer cents to avoid floating-point drift
  const bal = players.map(p => ({ name: p.name, cents: Math.round(p.balance * 100) }))
  const transactions = []

  for (let guard = 0; guard < 100; guard++) {
    const creditors = bal.filter(b => b.cents >  1).sort((a, b) => b.cents - a.cents)
    const debtors   = bal.filter(b => b.cents < -1).sort((a, b) => a.cents - b.cents)
    if (!creditors.length || !debtors.length) break

    const creditor = creditors[0]
    const debtor   = debtors[0]
    const amount   = Math.min(creditor.cents, -debtor.cents)

    transactions.push({
      from:   debtor.name,
      to:     creditor.name,
      amount: amount / 100,   // back to dollars
    })

    creditor.cents -= amount
    debtor.cents   += amount
  }

  return transactions
}

export function classifyMLBPlay(play) {
  if (!play) return null
  if (play.result?.type !== 'atBat') return null
  if (!play.about?.isComplete) return null

  const event = (play.result?.event || '').trim()
  const eventLower = event.toLowerCase()

  // Exact / specific matches first
  if (eventLower === 'single') return OUTCOMES.SINGLE
  if (eventLower === 'double') return OUTCOMES.DOUBLE
  if (eventLower === 'triple') return OUTCOMES.TRIPLE
  if (eventLower === 'home run') return OUTCOMES.HOME_RUN

  if (
    eventLower === 'walk' ||
    eventLower === 'intent walk' ||
    eventLower === 'intentional walk'
  )
    return OUTCOMES.WALK

  if (eventLower === 'hit by pitch') return OUTCOMES.HBP

  // Strikeout
  if (eventLower.includes('strikeout')) return OUTCOMES.STRIKEOUT

  // Double Play (must come before generic "out" checks)
  if (
    eventLower.includes('double play') ||
    eventLower.includes('grounded into dp') ||
    eventLower.includes('grounded into double play')
  )
    return OUTCOMES.DOUBLE_PLAY

  // Error / Catcher Interference
  if (eventLower.includes('error') || eventLower.includes('catcher interference'))
    return OUTCOMES.ERROR

  // Out — broad catch-all including real MLB event strings
  if (
    play.result?.isOut === true ||
    eventLower.includes('out') ||
    eventLower.includes('flyout') ||
    eventLower.includes('fly out') ||
    eventLower.includes('groundout') ||
    eventLower.includes('ground out') ||
    eventLower.includes('lineout') ||
    eventLower.includes('line out') ||
    eventLower.includes('pop out') ||
    eventLower.includes('popout') ||
    eventLower.includes('forceout') ||
    eventLower.includes('force out') ||
    eventLower.includes('sac') ||
    eventLower.includes("fielder's choice")
  )
    return OUTCOMES.OUT

  return null
}
