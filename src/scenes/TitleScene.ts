import Phaser from 'phaser'
import { GAME_W, GAME_H, loadHiScore } from '../config'
import { createTextures } from '../textures'
import { Sfx } from '../audio'

export class TitleScene extends Phaser.Scene {
  private waves: Phaser.GameObjects.Rectangle[] = []

  constructor() {
    super('title')
  }

  create() {
    createTextures(this)
    if (!this.registry.has('sfx')) this.registry.set('sfx', new Sfx())

    this.cameras.main.setBackgroundColor('#0b3a66')
    this.waves = []
    for (let i = 0; i < 8; i++) {
      this.waves.push(this.add.rectangle(GAME_W / 2, i * 110, GAME_W, 4, 0x3f8fd0, 0.18))
    }

    this.add.image(GAME_W / 2, GAME_H * 0.46, 'player').setScale(2.6)
    this.add
      .text(GAME_W / 2, 210, 'ACE SQUADRON', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '46px',
        color: '#f2e2b6',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
    this.add
      .text(GAME_W / 2, 256, 'an original 1942-inspired shooter', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#bcd3ee'
      })
      .setOrigin(0.5)

    const hi = loadHiScore()
    this.add
      .text(GAME_W / 2, GAME_H - 190, 'HI ' + hi.toString().padStart(6, '0'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#7fd0ff'
      })
      .setOrigin(0.5)

    const tap = this.add
      .text(GAME_W / 2, GAME_H - 130, 'tap to start', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#eaf2ff'
      })
      .setOrigin(0.5)
    this.tweens.add({ targets: tap, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 })

    this.input.once('pointerdown', () => {
      ;(this.registry.get('sfx') as Sfx).unlock()
      this.scene.start('play')
    })
  }

  update(_time: number, delta: number) {
    const dy = (delta / 1000) * 60
    for (const r of this.waves) {
      r.y += dy
      if (r.y > GAME_H + 4) r.y -= GAME_H + 120
    }
  }
}
