import Phaser from 'phaser'
import { GAME_W, GAME_H, qualifies, addScore, loadScores } from '../config'

interface OverData {
  score: number
  win: boolean
  shots: number
  hits: number
}

export class GameOverScene extends Phaser.Scene {
  private score = 0
  private slots = ['A', 'A', 'A']
  private slotTexts: Phaser.GameObjects.Text[] = []
  private entryUI?: Phaser.GameObjects.Container

  constructor() {
    super('over')
  }

  create(data: OverData) {
    this.cameras.main.setBackgroundColor('#0b1f3a')
    this.score = data.score
    this.slots = ['A', 'A', 'A']
    this.slotTexts = []
    this.entryUI = undefined

    const acc = data.shots > 0 ? Math.round((100 * data.hits) / data.shots) : 0

    this.add
      .text(GAME_W / 2, 96, data.win ? 'TOKYO REACHED!' : 'SHOT DOWN', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        color: data.win ? '#97c459' : '#e24b4a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
    this.add
      .text(GAME_W / 2, 150, 'score ' + data.score.toString().padStart(6, '0'), {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#eaf2ff'
      })
      .setOrigin(0.5)
    this.add
      .text(GAME_W / 2, 182, 'accuracy ' + acc + '%', { fontFamily: 'monospace', fontSize: '16px', color: '#7fd0ff' })
      .setOrigin(0.5)

    if (qualifies(data.score)) {
      this.showInitialsEntry()
    } else {
      this.showLeaderboard(-1)
    }
  }

  private showInitialsEntry() {
    const prompt = this.add
      .text(GAME_W / 2, 232, 'NEW HIGH SCORE!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffe14d',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
    const hint = this.add
      .text(GAME_W / 2, 262, 'tap a letter to change it', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#bcd3ee'
      })
      .setOrigin(0.5)

    const startX = GAME_W / 2 - 48
    for (let i = 0; i < 3; i++) {
      const tx = this.add
        .text(startX + i * 48, 312, this.slots[i], { fontFamily: 'monospace', fontSize: '44px', color: '#f2e2b6' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
      tx.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, evt: Phaser.Types.Input.EventData) => {
        evt.stopPropagation()
        this.cycleSlot(i)
      })
      this.slotTexts.push(tx)
    }

    const enter = this.add
      .text(GAME_W / 2, 380, '[ ENTER ]', { fontFamily: 'monospace', fontSize: '24px', color: '#7fd0ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    enter.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, evt: Phaser.Types.Input.EventData) => {
      evt.stopPropagation()
      this.submitInitials()
    })

    this.entryUI = this.add.container(0, 0, [prompt, hint, ...this.slotTexts, enter])
  }

  private cycleSlot(i: number) {
    const c = this.slots[i].charCodeAt(0)
    this.slots[i] = String.fromCharCode(c >= 90 ? 65 : c + 1) // A..Z wrap
    this.slotTexts[i].setText(this.slots[i])
  }

  private submitInitials() {
    addScore(this.slots.join(''), this.score)
    this.entryUI?.destroy()
    this.entryUI = undefined
    this.showLeaderboard(this.score)
  }

  private showLeaderboard(highlightScore: number) {
    const top = loadScores()
    const startY = 250
    this.add
      .text(GAME_W / 2, startY - 30, 'BEST PILOTS', { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#bcd3ee' })
      .setOrigin(0.5)
    if (top.length === 0) {
      this.add
        .text(GAME_W / 2, startY, 'no scores yet', { fontFamily: 'monospace', fontSize: '16px', color: '#7fd0ff' })
        .setOrigin(0.5)
    }
    let highlighted = false
    top.forEach((e, i) => {
      const hi = !highlighted && e.score === highlightScore
      if (hi) highlighted = true
      const row = i + 1 + '.  ' + e.initials + '   ' + e.score.toString().padStart(6, '0')
      this.add
        .text(GAME_W / 2, startY + i * 30, row, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: hi ? '#ffe14d' : '#eaf2ff'
        })
        .setOrigin(0.5)
    })

    const tap = this.add
      .text(GAME_W / 2, GAME_H - 90, 'tap to play again', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#bcd3ee'
      })
      .setOrigin(0.5)
    this.tweens.add({ targets: tap, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 })
    this.time.delayedCall(500, () => this.input.once('pointerdown', () => this.scene.start('play')))
  }
}
