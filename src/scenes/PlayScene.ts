import Phaser from 'phaser'

// Fixed logical resolution (portrait). The Scale Manager fits this to the phone.
export const GAME_W = 450
export const GAME_H = 800

const SHIP_W = 44
const SHIP_H = 52

export class PlayScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Rectangle
  private targetX = GAME_W / 2
  private targetY = GAME_H - 150
  private dragOffsetX = 0
  private dragOffsetY = 0
  private waves: Phaser.GameObjects.Rectangle[] = []
  private fpsText!: Phaser.GameObjects.Text

  constructor() {
    super('play')
  }

  create() {
    // Scrolling "wave" bands so motion and frame rate are visible at a glance.
    for (let i = 0; i < 8; i++) {
      this.waves.push(this.add.rectangle(GAME_W / 2, i * 110, GAME_W, 4, 0x3f8fd0, 0.18))
    }

    // Placeholder ship — a coloured rectangle, as planned for Phase 0.
    this.ship = this.add
      .rectangle(this.targetX, this.targetY, SHIP_W, SHIP_H, 0xf2e2b6)
      .setStrokeStyle(2, 0x8a6d1f)

    this.add
      .text(GAME_W / 2, 64, 'Ace Squadron', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        color: '#eaf2ff'
      })
      .setOrigin(0.5)
    this.add
      .text(GAME_W / 2, 104, 'Phase 0 · drag anywhere to fly', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#bcd3ee'
      })
      .setOrigin(0.5)

    this.fpsText = this.add.text(10, GAME_H - 26, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#7fd0ff'
    })

    // Relative-drag controls: the ship keeps its offset from the finger so it
    // never teleports under your thumb. (The "ship sits above the finger" feel
    // and auto-fire arrive in Phase 1.)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragOffsetX = this.ship.x - p.x
      this.dragOffsetY = this.ship.y - p.y
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return
      this.targetX = Phaser.Math.Clamp(p.x + this.dragOffsetX, SHIP_W / 2, GAME_W - SHIP_W / 2)
      this.targetY = Phaser.Math.Clamp(p.y + this.dragOffsetY, SHIP_H, GAME_H - 20)
    })
  }

  update(_time: number, delta: number) {
    // Smooth follow.
    this.ship.x = Phaser.Math.Linear(this.ship.x, this.targetX, 0.3)
    this.ship.y = Phaser.Math.Linear(this.ship.y, this.targetY, 0.3)

    // Scroll the wave bands downward and recycle them.
    const dy = (delta / 1000) * 80
    for (const r of this.waves) {
      r.y += dy
      if (r.y > GAME_H + 4) r.y -= GAME_H + 120
    }

    this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} fps`)
  }
}
