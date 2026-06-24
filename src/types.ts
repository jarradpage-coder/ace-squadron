export type MovePattern = 'sineDown' | 'sweepLR' | 'dive'

export interface WaveEvent {
  at: number // seconds into the stage
  pattern: MovePattern
  count: number
  hp: number
  reds: boolean // a "red formation" — clearing it whole drops a power-up
}
