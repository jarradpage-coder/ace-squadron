import type { WaveEvent } from '../types'

// Stage 1 timeline (~66s of waves, then the boss). Data-driven so adding
// content later is just editing this array.
export const STAGE1: WaveEvent[] = [
  { at: 1.5, pattern: 'sineDown', count: 5, hp: 1, reds: true },
  { at: 9, pattern: 'sweepLR', count: 6, hp: 1, reds: false },
  { at: 17, pattern: 'sineDown', count: 5, hp: 1, reds: true },
  { at: 26, pattern: 'dive', count: 4, hp: 2, reds: false },
  { at: 35, pattern: 'sineDown', count: 7, hp: 1, reds: true },
  { at: 45, pattern: 'sweepLR', count: 6, hp: 2, reds: false },
  { at: 55, pattern: 'dive', count: 5, hp: 2, reds: true }
]

export const BOSS_AT = 66 // seconds; boss also waits until the screen is clear
