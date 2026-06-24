import Phaser from 'phaser'
import { GAME_H } from '../config'
import type { MovePattern } from '../types'
import type { PlayScene } from '../scenes/PlayScene'

export interface EnemyOpts {
  hp: number
  pattern: MovePattern
  texture: string
  formationId: number
  score: number
  speedMul: number
  fireMul: number
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp = 1
  pattern: MovePattern = 'sineDown'
  baseX = 0
  spawnT = 0
  amp = 60
  vy = 85
  fireMul = 1
  nextFire = 0
  formationId = -1
  score = 100

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy')
  }

  spawn(x: number, y: number, opts: EnemyOpts): void {
    this.enableBody(true, x, y, true, true)
    this.setTexture(opts.texture)
    this.hp = opts.hp
    this.pattern = opts.pattern
    this.formationId = opts.formationId
    this.score = opts.score
    this.fireMul = opts.fireMul
    this.baseX = x
    this.spawnT = this.scene.time.now
    this.amp = Phaser.Math.Between(40, 85)
    this.vy = (opts.pattern === 'dive' ? 150 : 85) * opts.speedMul
    this.nextFire = this.scene.time.now + Phaser.Math.Between(700, 1900)
    this.setAngle(0)
    this.setScale(1)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(this.width * 0.7, this.height * 0.7)
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta)
    if (!this.active) return
    const scene = this.scene as PlayScene
    if (scene.paused) return
    const elapsed = (time - this.spawnT) / 1000
    const dt = delta / 1000

    switch (this.pattern) {
      case 'sineDown':
        this.y += this.vy * dt
        this.x = this.baseX + Math.sin(elapsed * 2) * this.amp
        break
      case 'sweepLR':
        this.y += this.vy * 0.5 * dt
        this.x = this.baseX + Math.sin(elapsed * 1.4) * 150
        break
      case 'dive':
        this.x = Phaser.Math.Linear(this.x, scene.playerX(), 0.02)
        this.y += this.vy * dt
        break
    }

    if (time > this.nextFire && this.y > 0 && this.y < GAME_H * 0.78) {
      scene.enemyFireAt(this.x, this.y)
      this.nextFire = time + Phaser.Math.Between(1300, 2700) / this.fireMul
    }

    if (this.y > GAME_H + 30) scene.enemyEscaped(this)
  }

  // Shift this enemy's timers forward after a pause so movement/fire stay continuous.
  shiftTimers(d: number): void {
    this.nextFire += d
    this.spawnT += d
  }

  // returns true if destroyed
  damage(n: number): boolean {
    this.hp -= n
    if (this.hp <= 0) return true
    this.setScale(1.25)
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.setScale(1)
    })
    return false
  }
}
