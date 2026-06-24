import Phaser from 'phaser'
import { GAME_H, POW_CYCLE_MS } from '../config'
import type { PowType } from '../types'
import type { PlayScene } from '../scenes/PlayScene'

interface PowDef {
  t: PowType
  color: number
  letter: string
}

// The POW cycles through these — grab it on the colour/letter you want.
const TYPES: PowDef[] = [
  { t: 'P', color: 0x97c459, letter: 'P' }, // weapon up
  { t: 'S', color: 0xcdd6da, letter: 'S' }, // side fighters
  { t: 'L', color: 0xffe14d, letter: 'L' }, // +1 loop
  { t: 'B', color: 0xffffff, letter: 'B' }, // smart bomb
  { t: 'D', color: 0xffb347, letter: 'D' }, // disarm
  { t: '1', color: 0x7fd0ff, letter: '1' } // extra life
]

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  private label: Phaser.GameObjects.Text
  private idx = 0
  private nextCycle = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pow')
    this.setDepth(60)
    this.label = scene.add
      .text(x, y, 'P', { fontFamily: 'monospace', fontSize: '16px', color: '#0b1f3a', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(61)
      .setVisible(false)
  }

  spawn(x: number, y: number): void {
    this.idx = 0
    this.nextCycle = this.scene.time.now + POW_CYCLE_MS
    this.enableBody(true, x, y, true, true)
    this.setVelocity(Phaser.Math.Between(-15, 15), 60)
    this.applyType()
    this.label.setPosition(x, y)
    this.label.setVisible(true)
  }

  private applyType(): void {
    const def = TYPES[this.idx]
    this.setTint(def.color)
    this.label.setText(def.letter)
  }

  currentType(): PowType {
    return TYPES[this.idx].t
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta)
    if (!this.active) return
    if ((this.scene as PlayScene).paused) return
    if (time > this.nextCycle) {
      this.idx = (this.idx + 1) % TYPES.length
      this.nextCycle = time + POW_CYCLE_MS
      this.applyType()
    }
    this.label.setPosition(this.x, this.y)
    if (this.y > GAME_H + 30) this.deactivate()
  }

  shiftTimers(d: number): void {
    this.nextCycle += d // keep the colour-cycle continuous across a pause
  }

  deactivate(): void {
    this.label.setVisible(false)
    this.disableBody(true, true)
  }
}
