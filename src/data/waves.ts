import type { WaveEvent } from '../types'

export interface StageDef {
  name: string
  bg: string // sea background colour
  band: number // scrolling wave-band colour
  hpMul: number
  speedMul: number
  fireMul: number
  bossHp: number
  bossAt: number // seconds; boss also waits until the screen is clear
  waves: WaveEvent[]
}

// One base timeline, scaled per stage by the multipliers below — the classic
// "same waves, harder + different sky" arcade progression.
const BASE: WaveEvent[] = [
  { at: 1.5, pattern: 'sineDown', shape: 'vee', count: 5, hp: 1, reds: true },
  { at: 8, pattern: 'sweepLR', shape: 'line', count: 6, hp: 1, reds: false },
  { at: 15, pattern: 'sineDown', shape: 'arc', count: 6, hp: 1, reds: true },
  { at: 23, pattern: 'dive', shape: 'line', count: 4, hp: 2, reds: false },
  { at: 31, pattern: 'sineDown', shape: 'vee', count: 7, hp: 1, reds: true },
  { at: 40, pattern: 'sweepLR', shape: 'line', count: 6, hp: 2, reds: false }
]

export const STAGES: StageDef[] = [
  { name: 'Pacific', bg: '#0b3a66', band: 0x3f8fd0, hpMul: 1, speedMul: 1.0, fireMul: 1.0, bossHp: 70, bossAt: 48, waves: BASE },
  { name: 'Sunset', bg: '#7a3b1f', band: 0xe0913f, hpMul: 1, speedMul: 1.2, fireMul: 1.4, bossHp: 95, bossAt: 48, waves: BASE },
  { name: 'Midnight', bg: '#0a1430', band: 0x4a5db0, hpMul: 2, speedMul: 1.4, fireMul: 1.8, bossHp: 130, bossAt: 48, waves: BASE }
]
