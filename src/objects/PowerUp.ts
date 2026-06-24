import Phaser from 'phaser'
import { GAME_H } from '../config'

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup')
  }

  spawn(x: number, y: number): void {
    this.enableBody(true, x, y, true, true)
    this.setVelocity(Phaser.Math.Between(-20, 20), 70)
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta)
    this.setAngle(this.angle + delta * 0.12)
    if (this.y > GAME_H + 30) this.disableBody(true, true)
  }
}
