export type MovePattern = 'sineDown' | 'sweepLR' | 'dive'
export type WaveShape = 'vee' | 'line' | 'arc'

// POW types: P=weapon up, S=side fighters, L=+loop, B=smart bomb, D=disarm, 1=1-up
export type PowType = 'P' | 'S' | 'L' | 'B' | 'D' | '1'

export interface WaveEvent {
  at: number // seconds into the stage
  pattern: MovePattern
  shape: WaveShape
  count: number
  hp: number
  reds: boolean // a "red formation" — clearing it whole drops a POW
}
