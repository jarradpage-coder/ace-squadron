import Phaser from 'phaser'
import { GAME_W, GAME_H } from '../config'

// Pooled projectile, reused for both player and enemy bullets.
export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pbullet')
  }

  fire(x: number, y: number, vx: number, vy: number, texture: string): void {
    this.setTexture(texture)
    this.enableBody(true, x, y, true, true)
    this.setVelocity(vx, vy)
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta)
    if (this.y < -30 || this.y > GAME_H + 30 || this.x < -30 || this.x > GAME_W + 30) {
      this.disableBody(true, true)
    }
  }
}
