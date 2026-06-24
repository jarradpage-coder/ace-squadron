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
