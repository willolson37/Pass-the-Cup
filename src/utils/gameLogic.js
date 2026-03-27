export const POT_MODES = {
  CLOSEST_TO_EVEN: 'closestToEven',
  WALK_OFF: 'walkOff',
  CHOP_IT: 'chopIt',
  LAST_MAN_STANDING: 'lastManStanding',
}

export const POT_MODE_OPTIONS = [
  {
    value: POT_MODES.CLOSEST_TO_EVEN,
    label: 'Closest to Even',
    desc: 'Player nearest $0 wins the pot',
  },
  {
    value: POT_MODES.WALK_OFF,
    label: 'Walk-off',
    desc: 'Last hit of the game wins the pot',
  },
  {
    value: POT_MODES.CHOP_IT,
    label: 'Chop It',
    desc: 'Split remaining pot evenly',
  },
  {
    value: POT_MODES.LAST_MAN_STANDING,
    label: 'Last Man Standing',
    desc: 'Final at-bat takes the pot',
  },
]

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

export const DEFAULT_HOUSE_RULES = {
  single: 1,
  double: 2,
  triple: 3,
  out: 1,
  strikeout: 2,
  doublePly: 2,
  error: 1,
}

// playerData can be string[] (legacy) or [{name, venmo}]
export function createInitialState(playerData, potMode = null, multiplier = 1, houseRules = null) {
  const m = multiplier || 1
  const rules = { ...DEFAULT_HOUSE_RULES, ...(houseRules || {}) }
  const players = playerData.map((pd, idx) => ({
    id: idx,
    name: typeof pd === 'string' ? pd : pd.name,
    venmo: typeof pd === 'string' ? null : (pd.venmo || null),
    balance: -m,
  }))
  return {
    players,
    pot: players.length * m,
    currentPlayerIndex: 0,
    events: [],
    potMode,
    multiplier: m,
    houseRules: rules,
  }
}

let eventIdCounter = 0

export function processAtBat(state, outcome, mlbContext = null) {
  const { players, pot, currentPlayerIndex, events, multiplier, houseRules } = state
  const m = multiplier || 1
  const rules = { ...DEFAULT_HOUSE_RULES, ...(houseRules || {}) }
  const currentPlayer = players[currentPlayerIndex]
  const numPlayers = players.length

  let newPot = pot
  let newPlayers = players.map(p => ({ ...p }))
  let balanceChange = 0
  let description = ''

  switch (outcome) {
    case OUTCOMES.SINGLE: {
      const take = Math.min(rules.single * m, pot)
      newPlayers[currentPlayerIndex].balance += take
      newPot = pot - take
      balanceChange = take
      description = `${currentPlayer.name} hit a Single — takes $${take} from the pot`
      break
    }
    case OUTCOMES.DOUBLE: {
      const take = Math.min(rules.double * m, pot)
      newPlayers[currentPlayerIndex].balance += take
      newPot = pot - take
      balanceChange = take
      description = `${currentPlayer.name} hit a Double — takes $${take} from the pot`
      break
    }
    case OUTCOMES.TRIPLE: {
      const take = Math.min(rules.triple * m, pot)
      newPlayers[currentPlayerIndex].balance += take
      newPot = pot - take
      balanceChange = take
      description = `${currentPlayer.name} hit a Triple — takes $${take} from the pot`
      break
    }
    case OUTCOMES.HOME_RUN: {
      const potTaken = pot
      newPlayers[currentPlayerIndex].balance += potTaken
      newPlayers = newPlayers.map(p => ({ ...p, balance: p.balance - m }))
      newPot = numPlayers * m
      balanceChange = potTaken - m
      description = `${currentPlayer.name} hit a HOME RUN — takes $${potTaken} from the pot! Everyone re-antes $${m}`
      break
    }
    case OUTCOMES.OUT: {
      const add = rules.out * m
      newPlayers[currentPlayerIndex].balance -= add
      newPot = pot + add
      balanceChange = -add
      description = `${currentPlayer.name} made an Out — adds $${add} to the pot`
      break
    }
    case OUTCOMES.STRIKEOUT: {
      const add = rules.strikeout * m
      newPlayers[currentPlayerIndex].balance -= add
      newPot = pot + add
      balanceChange = -add
      description = `${currentPlayer.name} struck out — adds $${add} to the pot`
      break
    }
    case OUTCOMES.DOUBLE_PLAY: {
      const add = rules.doublePly * m
      newPlayers[currentPlayerIndex].balance -= add
      newPot = pot + add
      balanceChange = -add
      description = `${currentPlayer.name} grounded into a Double Play — adds $${add} to the pot`
      break
    }
    case OUTCOMES.ERROR: {
      const add = rules.error * m
      newPlayers[currentPlayerIndex].balance -= add
      newPot = pot + add
      balanceChange = -add
      description = `${currentPlayer.name} reached on an Error — adds $${add} to the pot`
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

// Distributes remaining pot according to the chosen end-game rule.
// Returns { adjustedPlayers, potWinnerDesc } — use adjustedPlayers for settlement.
export function applyPotMode(gameState) {
  const { players, pot, potMode, currentPlayerIndex, events } = gameState

  if (!pot || pot === 0) {
    return { adjustedPlayers: players.map(p => ({ ...p })), potWinnerDesc: null }
  }

  let adjustedPlayers = players.map(p => ({ ...p }))
  let potWinnerDesc = null

  switch (potMode) {
    case POT_MODES.CLOSEST_TO_EVEN: {
      let closest = players[0]
      for (const p of players) {
        if (Math.abs(p.balance) < Math.abs(closest.balance)) closest = p
      }
      const idx = adjustedPlayers.findIndex(p => p.id === closest.id)
      adjustedPlayers[idx].balance += pot
      potWinnerDesc = `${closest.name} was closest to even — wins $${pot} from the cup`
      break
    }
    case POT_MODES.WALK_OFF: {
      const HIT_OUTCOMES = [OUTCOMES.SINGLE, OUTCOMES.DOUBLE, OUTCOMES.TRIPLE, OUTCOMES.HOME_RUN]
      const lastHit = events.find(e => HIT_OUTCOMES.includes(e.outcome))
      if (lastHit) {
        const idx = adjustedPlayers.findIndex(p => p.name === lastHit.playerName)
        if (idx !== -1) {
          adjustedPlayers[idx].balance += pot
          potWinnerDesc = `${lastHit.playerName} had the last hit — walk-off, wins $${pot} from the cup`
        }
      } else {
        // No hits recorded — chop it
        const perPlayer = Math.floor((pot * 100) / players.length) / 100
        const leftover = Math.round((pot - perPlayer * players.length) * 100) / 100
        adjustedPlayers = adjustedPlayers.map((p, i) => ({
          ...p,
          balance: Math.round((p.balance + perPlayer + (i === 0 ? leftover : 0)) * 100) / 100,
        }))
        potWinnerDesc = `No hits recorded — $${pot} split evenly`
      }
      break
    }
    case POT_MODES.CHOP_IT: {
      const perPlayer = Math.floor((pot * 100) / players.length) / 100
      const leftover = Math.round((pot - perPlayer * players.length) * 100) / 100
      adjustedPlayers = adjustedPlayers.map((p, i) => ({
        ...p,
        balance: Math.round((p.balance + perPlayer + (i === 0 ? leftover : 0)) * 100) / 100,
      }))
      potWinnerDesc = `$${pot} split evenly among all players`
      break
    }
    case POT_MODES.LAST_MAN_STANDING: {
      const lastIdx = (currentPlayerIndex - 1 + players.length) % players.length
      adjustedPlayers[lastIdx].balance += pot
      potWinnerDesc = `${players[lastIdx].name} had the last at-bat — wins $${pot} from the cup`
      break
    }
    default:
      potWinnerDesc = `$${pot} remaining in the cup — carry over or split manually`
      break
  }

  return { adjustedPlayers, potWinnerDesc }
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
