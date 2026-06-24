// Fixed logical resolution (portrait). The Scale Manager fits this to the phone.
export const GAME_W = 450
export const GAME_H = 800

export const PLAYER_FOLLOW = 0.3 // lerp factor for ship follow
export const PLAYER_OFFSET_Y = 64 // ship sits this far above the finger
export const PLAYER_FIRE_MS = 150
export const PLAYER_HITBOX = 12 // tiny forgiving hitbox (1942-style)

export const START_LIVES = 3
export const LOOPS_PER_LIFE = 3
export const LOOP_INVULN_MS = 750
export const RESPAWN_INVULN_MS = 1600

export const SCORE_ENEMY = 100
export const SCORE_POWERUP = 250
export const SCORE_BOSS = 5000

export const WEAPON_MAX = 2 // 0 = double, 1 = quad, 2 = six-shot
export const MAX_LOOPS = 5
export const POW_CYCLE_MS = 700 // how fast the POW token cycles colour/type
export const DISARM_MS = 5000
export const LOOP_BONUS = 1000 // per unused loop, banked at stage clear
export const STAGE_COUNT = 3

export const HISCORE_KEY = 'aceSquadron.hiscore.v1'

export function loadHiScore(): number {
  try {
    return Number(localStorage.getItem(HISCORE_KEY) || 0) || 0
  } catch {
    return 0
  }
}

export function saveHiScore(score: number): void {
  try {
    localStorage.setItem(HISCORE_KEY, String(score))
  } catch {
    /* private mode / disabled storage — ignore */
  }
}

// --- Persisted sound setting ---
const SETTINGS_KEY = 'aceSquadron.settings.v1'
export function loadSoundOn(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return s.sound !== false
  } catch {
    return true
  }
}
export function saveSoundOn(on: boolean): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: on }))
  } catch {
    /* ignore */
  }
}

// --- Local leaderboard ---
export interface ScoreEntry {
  initials: string
  score: number
}
const SCORES_KEY = 'aceSquadron.scores.v1'
export const SCORE_SLOTS = 5

export function loadScores(): ScoreEntry[] {
  let list: ScoreEntry[] = []
  try {
    const arr = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]')
    if (Array.isArray(arr)) {
      list = arr
        .filter((e) => e && typeof e.score === 'number')
        .map((e) => ({
          initials: String(e.initials || 'ACE').slice(0, 3).toUpperCase(),
          score: Math.max(0, Math.floor(Number(e.score) || 0))
        }))
    }
  } catch {
    /* ignore corrupt data */
  }
  if (list.length === 0) {
    const oldHi = loadHiScore() // seed from the old single high score
    if (oldHi > 0) list = [{ initials: 'ACE', score: oldHi }]
  }
  return list.sort((a, b) => b.score - a.score).slice(0, SCORE_SLOTS)
}

export function saveScores(list: ScoreEntry[]): void {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(list.slice(0, SCORE_SLOTS)))
  } catch {
    /* ignore */
  }
}

export function qualifies(score: number): boolean {
  if (score <= 0) return false
  const list = loadScores()
  return list.length < SCORE_SLOTS || score > list[list.length - 1].score
}

export function addScore(initials: string, score: number): ScoreEntry[] {
  const list = loadScores()
  list.push({ initials: initials.slice(0, 3).toUpperCase() || 'ACE', score })
  list.sort((a, b) => b.score - a.score)
  const top = list.slice(0, SCORE_SLOTS)
  saveScores(top)
  return top
}
