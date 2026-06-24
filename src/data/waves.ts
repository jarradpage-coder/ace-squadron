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

// Each stage has its own timeline for variety; difficulty is layered on top via
// the speed/fire multipliers below.
const stage1: WaveEvent[] = [
  { at: 1.5, pattern: 'sineDown', shape: 'vee', count: 5, hp: 1, reds: true },
  { at: 8, pattern: 'sweepLR', shape: 'line', count: 6, hp: 1, reds: false },
  { at: 15, pattern: 'sineDown', shape: 'arc', count: 6, hp: 1, reds: true },
  { at: 23, pattern: 'dive', shape: 'line', count: 4, hp: 2, reds: false },
  { at: 31, pattern: 'sineDown', shape: 'vee', count: 7, hp: 1, reds: true },
  { at: 40, pattern: 'sweepLR', shape: 'line', count: 6, hp: 2, reds: false }
]

const stage2: WaveEvent[] = [
  { at: 1.5, pattern: 'dive', shape: 'line', count: 5, hp: 1, reds: false },
  { at: 8, pattern: 'sineDown', shape: 'arc', count: 7, hp: 1, reds: true },
  { at: 15, pattern: 'sweepLR', shape: 'line', count: 6, hp: 2, reds: false },
  { at: 22, pattern: 'sineDown', shape: 'vee', count: 6, hp: 1, reds: true },
  { at: 29, pattern: 'dive', shape: 'arc', count: 5, hp: 2, reds: false },
  { at: 37, pattern: 'sineDown', shape: 'arc', count: 7, hp: 1, reds: true },
  { at: 44, pattern: 'sweepLR', shape: 'line', count: 6, hp: 2, reds: false }
]

const stage3: WaveEvent[] = [
  { at: 1.5, pattern: 'sineDown', shape: 'arc', count: 7, hp: 1, reds: true },
  { at: 7, pattern: 'dive', shape: 'line', count: 5, hp: 2, reds: false },
  { at: 13, pattern: 'sweepLR', shape: 'line', count: 7, hp: 1, reds: false },
  { at: 19, pattern: 'sineDown', shape: 'vee', count: 7, hp: 1, reds: true },
  { at: 26, pattern: 'dive', shape: 'arc', count: 6, hp: 2, reds: false },
  { at: 33, pattern: 'sineDown', shape: 'arc', count: 7, hp: 1, reds: true },
  { at: 40, pattern: 'dive', shape: 'line', count: 6, hp: 2, reds: false },
  { at: 46, pattern: 'sweepLR', shape: 'arc', count: 7, hp: 1, reds: true }
]

export const STAGES: StageDef[] = [
  { name: 'Pacific', bg: '#0b3a66', band: 0x3f8fd0, hpMul: 1, speedMul: 1.0, fireMul: 1.0, bossHp: 70, bossAt: 48, waves: stage1 },
  { name: 'Sunset', bg: '#7a3b1f', band: 0xe0913f, hpMul: 1, speedMul: 1.2, fireMul: 1.4, bossHp: 95, bossAt: 50, waves: stage2 },
  { name: 'Midnight', bg: '#0a1430', band: 0x4a5db0, hpMul: 1, speedMul: 1.45, fireMul: 1.85, bossHp: 130, bossAt: 52, waves: stage3 }
]
