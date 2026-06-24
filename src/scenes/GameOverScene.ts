import Phaser from 'phaser'
import { GAME_W, GAME_H, loadHiScore, saveHiScore } from '../config'

interface OverData {
  score: number
  win: boolean
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('over')
  }

  create(data: OverData) {
    this.cameras.main.setBackgroundColor('#0b1f3a')

    const prev = loadHiScore()
    const isHi = data.score > prev
    if (isHi) saveHiScore(data.score)

    this.add
      .text(GAME_W / 2, 250, data.win ? 'TOKYO REACHED!' : 'SHOT DOWN', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        color: data.win ? '#97c459' : '#e24b4a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_W / 2, 326, 'score ' + data.score.toString().padStart(6, '0'), {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#eaf2ff'
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_W / 2, 366, isHi ? 'NEW HIGH SCORE!' : 'best ' + prev.toString().padStart(6, '0'), {
        fontFamily: isHi ? 'system-ui, sans-serif' : 'monospace',
        fontSize: isHi ? '20px' : '16px',
        color: isHi ? '#ffe14d' : '#7fd0ff'
      })
      .setOrigin(0.5)

    const tap = this.add
      .text(GAME_W / 2, GAME_H - 150, 'tap to play again', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#bcd3ee'
      })
      .setOrigin(0.5)
    this.tweens.add({ targets: tap, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 })

    // Brief delay so the tap that ended the run doesn't instantly restart.
    this.time.delayedCall(600, () => {
      this.input.once('pointerdown', () => this.scene.start('play'))
    })
  }
}
