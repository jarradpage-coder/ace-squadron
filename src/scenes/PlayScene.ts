import Phaser from 'phaser'
import {
  GAME_W,
  GAME_H,
  PLAYER_FOLLOW,
  PLAYER_OFFSET_Y,
  PLAYER_FIRE_MS,
  PLAYER_HITBOX,
  START_LIVES,
  LOOPS_PER_LIFE,
  LOOP_INVULN_MS,
  RESPAWN_INVULN_MS,
  SCORE_ENEMY,
  SCORE_POWERUP,
  SCORE_BOSS,
  WEAPON_MAX,
  MAX_LOOPS,
  DISARM_MS,
  LOOP_BONUS,
  STAGE_COUNT
} from '../config'
import { createTextures } from '../textures'
import { Sfx } from '../audio'
import { Bullet } from '../objects/Bullet'
import { Enemy } from '../objects/Enemy'
import { PowerUp } from '../objects/PowerUp'
import { STAGES, type StageDef } from '../data/waves'
import type { WaveEvent } from '../types'

interface Formation {
  count: number
  killed: number
  escaped: number
  reds: boolean
  lastX: number
  lastY: number
}

const LOOP_BTN_R = 46

export class PlayScene extends Phaser.Scene {
  private sfx!: Sfx

  private player!: Phaser.Physics.Arcade.Sprite
  private wingLeft!: Phaser.GameObjects.Image
  private wingRight!: Phaser.GameObjects.Image

  private playerBullets!: Phaser.Physics.Arcade.Group
  private enemyBullets!: Phaser.Physics.Arcade.Group
  private enemies!: Phaser.Physics.Arcade.Group
  private powerups!: Phaser.Physics.Arcade.Group

  private boss?: Phaser.Physics.Arcade.Sprite
  private bossHp = 0
  private bossMaxHp = 0
  private bossPhase = 1
  private bossDir = 1
  private bossNextFire = 0
  private bossSpawned = false
  private bossFireMul = 1
  private bossColliders: Phaser.Physics.Arcade.Collider[] = []

  private waves: Phaser.GameObjects.Rectangle[] = []
  private formations = new Map<number, Formation>()
  private formationCounter = 0
  private waveIndex = 0
  private startTime = 0

  private targetX = GAME_W / 2
  private targetY = GAME_H - 150
  private dragId = -1

  private weaponLevel = 0
  private hasWings = false
  private lives = START_LIVES
  private loops = LOOPS_PER_LIFE
  private score = 0
  private invulnUntil = 0
  private disarmUntil = 0
  private nextFireAt = 0
  private gameOver = false
  private stage = 1
  private stageClearing = false

  private scoreText!: Phaser.GameObjects.Text
  private livesText!: Phaser.GameObjects.Text
  private stageText!: Phaser.GameObjects.Text
  private loopText!: Phaser.GameObjects.Text
  private muteText!: Phaser.GameObjects.Text
  private message!: Phaser.GameObjects.Text
  private bannerText!: Phaser.GameObjects.Text
  private loopBtn!: Phaser.GameObjects.Arc
  private loopBtnLabel!: Phaser.GameObjects.Text
  private bossBar!: Phaser.GameObjects.Graphics
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super('play')
  }

  create() {
    createTextures(this)
    this.sfx = this.registry.get('sfx') as Sfx

    // Reset all per-run state (scenes are reused across restarts).
    this.gameOver = false
    this.weaponLevel = 0
    this.hasWings = false
    this.lives = START_LIVES
    this.loops = LOOPS_PER_LIFE
    this.score = 0
    this.invulnUntil = this.time.now + RESPAWN_INVULN_MS
    this.disarmUntil = 0
    this.nextFireAt = 0
    this.formationCounter = 0
    this.stageClearing = false
    this.bossColliders = []
    this.dragId = -1
    this.targetX = GAME_W / 2
    this.targetY = GAME_H - 150

    this.waves = []
    for (let i = 0; i < 8; i++) {
      this.waves.push(this.add.rectangle(GAME_W / 2, i * 110, GAME_W, 4, 0x3f8fd0, 0.18))
    }

    // Pools (runChildUpdate drives each pooled sprite's preUpdate — required).
    this.playerBullets = this.physics.add.group({ classType: Bullet, maxSize: 96, runChildUpdate: true })
    this.enemyBullets = this.physics.add.group({ classType: Bullet, maxSize: 220, runChildUpdate: true })
    this.enemies = this.physics.add.group({ classType: Enemy, maxSize: 64, runChildUpdate: true })
    this.powerups = this.physics.add.group({ classType: PowerUp, maxSize: 8, runChildUpdate: true })

    this.player = this.physics.add.sprite(this.targetX, this.targetY, 'player')
    ;(this.player.body as Phaser.Physics.Arcade.Body).setSize(PLAYER_HITBOX, PLAYER_HITBOX, true)
    this.wingLeft = this.add.image(0, 0, 'wingman').setVisible(false)
    this.wingRight = this.add.image(0, 0, 'wingman').setVisible(false)

    this.physics.add.overlap(this.playerBullets, this.enemies, (b, e) =>
      this.bulletHitEnemy(b as unknown as Bullet, e as unknown as Enemy)
    )
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.enemyTouchesPlayer(e as unknown as Enemy))
    this.physics.add.overlap(this.player, this.enemyBullets, (_p, b) => this.bulletHitsPlayer(b as unknown as Bullet))
    this.physics.add.overlap(this.player, this.powerups, (_p, pu) => this.collectPowerup(pu as unknown as PowerUp))

    this.buildHud()
    this.setupInput()

    this.sfx.startMusic()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.sfx.stopMusic())

    this.startStage(1)
  }

  // ---- Stages ------------------------------------------------------------
  private startStage(n: number) {
    this.stage = n
    const s = STAGES[n - 1]
    this.cameras.main.setBackgroundColor(s.bg)
    for (const r of this.waves) r.setFillStyle(s.band, 0.18)
    this.clearAll()
    this.formations.clear()
    this.waveIndex = 0
    this.startTime = this.time.now
    this.bossSpawned = false
    this.bossPhase = 1
    this.removeBossColliders()
    this.boss = undefined
    this.bossBar.clear()
    this.disarmUntil = 0
    this.stageText.setText('STAGE ' + n)
    this.banner('STAGE ' + n + '  ·  ' + s.name.toUpperCase())
  }

  private clearAll() {
    this.enemies.getChildren().forEach((o) => {
      const e = o as Enemy
      if (e.active) e.disableBody(true, true)
    })
    this.enemyBullets.getChildren().forEach((o) => {
      const b = o as Bullet
      if (b.active) b.disableBody(true, true)
    })
    this.playerBullets.getChildren().forEach((o) => {
      const b = o as Bullet
      if (b.active) b.disableBody(true, true)
    })
    this.powerups.getChildren().forEach((o) => {
      const p = o as PowerUp
      if (p.active) p.deactivate()
    })
  }

  // ---- HUD ---------------------------------------------------------------
  private buildHud() {
    const font = { fontFamily: 'monospace', fontSize: '18px', color: '#eaf2ff' }
    this.scoreText = this.add.text(12, 12, '', font).setDepth(1000)
    this.livesText = this.add.text(12, 36, '', { ...font, color: '#f2e2b6' }).setDepth(1000)
    this.stageText = this.add
      .text(GAME_W / 2, 14, '', { fontFamily: 'monospace', fontSize: '14px', color: '#bcd3ee' })
      .setOrigin(0.5, 0)
      .setDepth(1000)

    this.muteText = this.add
      .text(GAME_W - 12, 12, 'AUDIO', { fontFamily: 'monospace', fontSize: '14px', color: '#7fd0ff' })
      .setOrigin(1, 0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true })
    this.muteText.setColor(this.sfx.muted ? '#5f6e7a' : '#7fd0ff')
    this.muteText.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, evt: Phaser.Types.Input.EventData) => {
        evt.stopPropagation()
        const muted = this.sfx.toggleMute()
        this.muteText.setColor(muted ? '#5f6e7a' : '#7fd0ff')
      }
    )

    this.loopBtn = this.add
      .circle(GAME_W - 58, GAME_H - 76, LOOP_BTN_R, 0xffffff, 0.1)
      .setStrokeStyle(2, 0x7fd0ff)
      .setDepth(1000)
    this.loopBtnLabel = this.add
      .text(GAME_W - 58, GAME_H - 76, 'LOOP', { fontFamily: 'monospace', fontSize: '15px', color: '#d6f0ff' })
      .setOrigin(0.5)
      .setDepth(1001)
    this.loopText = this.add
      .text(GAME_W - 58, GAME_H - 18, '', { fontFamily: 'monospace', fontSize: '14px', color: '#aee0ff' })
      .setOrigin(0.5)
      .setDepth(1000)

    this.message = this.add
      .text(GAME_W / 2, GAME_H * 0.46, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        color: '#ffe14d',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0)

    this.bannerText = this.add
      .text(GAME_W / 2, GAME_H * 0.3, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        color: '#f2e2b6',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0)

    this.bossBar = this.add.graphics().setDepth(1000)
    this.updateHud()
  }

  private updateHud() {
    this.scoreText.setText('SCORE ' + this.score.toString().padStart(6, '0'))
    this.livesText.setText('SHIPS ' + '▲'.repeat(Math.max(0, this.lives)))
    this.loopText.setText('x' + this.loops)
    const ready = this.loops > 0
    this.loopBtn.setStrokeStyle(2, ready ? 0x7fd0ff : 0x44525c)
    this.loopBtnLabel.setColor(ready ? '#d6f0ff' : '#56636d')
  }

  private flash(text: string) {
    this.message.setText(text).setAlpha(1).setScale(1)
    this.tweens.add({ targets: this.message, alpha: 0, scale: 1.3, duration: 900, ease: 'Cubic.easeIn' })
  }

  private banner(text: string) {
    this.bannerText.setText(text).setAlpha(1).setScale(0.8)
    this.tweens.add({ targets: this.bannerText, scale: 1, duration: 300, ease: 'Back.easeOut' })
    this.tweens.add({ targets: this.bannerText, alpha: 0, delay: 1300, duration: 600 })
  }

  // ---- Input -------------------------------------------------------------
  private setupInput() {
    this.input.addPointer(2)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.input.keyboard!.on('keydown-SPACE', () => this.doLoop())

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.overMuteButton(p)) return
      if (this.overLoopButton(p)) {
        this.doLoop()
        return
      }
      this.dragId = p.id
      this.aimAt(p)
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id === this.dragId && p.isDown) this.aimAt(p)
    })
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.id === this.dragId) this.dragId = -1
    })
  }

  private overLoopButton(p: Phaser.Input.Pointer): boolean {
    return Phaser.Math.Distance.Between(p.x, p.y, this.loopBtn.x, this.loopBtn.y) <= LOOP_BTN_R + 8
  }

  private overMuteButton(p: Phaser.Input.Pointer): boolean {
    return this.muteText.getBounds().contains(p.x, p.y)
  }

  private aimAt(p: Phaser.Input.Pointer) {
    this.targetX = Phaser.Math.Clamp(p.x, 16, GAME_W - 16)
    this.targetY = Phaser.Math.Clamp(p.y - PLAYER_OFFSET_Y, 40, GAME_H - 20)
  }

  // ---- Loop dodge --------------------------------------------------------
  private doLoop() {
    if (this.gameOver || this.loops <= 0 || !this.player.active) return
    if (this.invulnUntil > this.time.now + 300) return
    this.loops--
    this.invulnUntil = this.time.now + LOOP_INVULN_MS
    this.sfx.loop()
    for (const b of this.enemyBullets.getChildren()) {
      const bullet = b as Bullet
      if (bullet.active) bullet.disableBody(true, true)
    }
    this.tweens.add({
      targets: this.player,
      angle: this.player.angle + 360,
      duration: LOOP_INVULN_MS,
      ease: 'Cubic.easeOut'
    })
    this.updateHud()
  }

  // ---- Firing ------------------------------------------------------------
  private autoFire() {
    const y = this.player.y - 18
    const fire = (x: number, vx = 0) => {
      const b = this.playerBullets.get() as Bullet | null
      if (b) b.fire(x, y, vx, -560, 'pbullet')
    }
    const x = this.player.x
    if (this.weaponLevel >= 2) {
      fire(x - 18)
      fire(x - 10)
      fire(x - 3)
      fire(x + 3)
      fire(x + 10)
      fire(x + 18)
    } else if (this.weaponLevel >= 1) {
      fire(x - 12)
      fire(x - 4)
      fire(x + 4)
      fire(x + 12)
    } else {
      fire(x - 5)
      fire(x + 5)
    }
    if (this.hasWings) {
      fire(this.wingLeft.x)
      fire(this.wingRight.x)
    }
    this.sfx.shoot()
  }

  // ---- Enemy callbacks ---------------------------------------------------
  playerX(): number {
    return this.player?.active ? this.player.x : GAME_W / 2
  }

  enemyFireAt(x: number, y: number) {
    if (this.gameOver || this.stageClearing || !this.player.active) return
    if (this.time.now < this.disarmUntil) return
    const b = this.enemyBullets.get() as Bullet | null
    if (!b) return
    const ang = Phaser.Math.Angle.Between(x, y, this.player.x, this.player.y)
    const sp = 200
    b.fire(x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, 'ebullet')
    this.sfx.enemyShoot()
  }

  enemyEscaped(e: Enemy) {
    const fid = e.formationId
    if (fid >= 0) {
      const f = this.formations.get(fid)
      if (f) {
        f.escaped++
        if (f.killed + f.escaped >= f.count) this.formations.delete(fid)
      }
    }
    e.disableBody(true, true)
  }

  // ---- Collisions --------------------------------------------------------
  private bulletHitEnemy(bullet: Bullet, enemy: Enemy) {
    if (!bullet.active || !enemy.active) return
    bullet.disableBody(true, true)
    if (enemy.damage(1)) this.killEnemy(enemy)
  }

  // Score + red-formation bookkeeping for a killed enemy (shared by normal kills
  // and the smart bomb, so neither path can desync formation tracking).
  private creditKill(enemy: Enemy) {
    this.score += enemy.score
    const fid = enemy.formationId
    if (fid >= 0) {
      const f = this.formations.get(fid)
      if (f) {
        f.killed++
        f.lastX = enemy.x
        f.lastY = enemy.y
        if (f.reds && f.killed >= f.count) this.spawnPowerup(f.lastX, f.lastY)
        if (f.killed + f.escaped >= f.count) this.formations.delete(fid)
      }
    }
  }

  private killEnemy(enemy: Enemy) {
    this.creditKill(enemy)
    this.explode(enemy.x, enemy.y, 0xe24b4a)
    this.sfx.explosion()
    enemy.disableBody(true, true)
    this.updateHud()
  }

  private spawnPowerup(x: number, y: number) {
    const pu = this.powerups.get() as PowerUp | null
    if (pu) pu.spawn(x, y)
  }

  private collectPowerup(pu: PowerUp) {
    if (!pu.active) return
    const t = pu.currentType()
    pu.deactivate()
    this.sfx.powerup()
    switch (t) {
      case 'P':
        this.weaponLevel = Math.min(this.weaponLevel + 1, WEAPON_MAX)
        this.flash('POWER UP')
        break
      case 'S':
        this.hasWings = true
        this.wingLeft.setVisible(true)
        this.wingRight.setVisible(true)
        this.flash('SIDE FIGHTERS')
        break
      case 'L':
        this.loops = Math.min(this.loops + 1, MAX_LOOPS)
        this.flash('+1 LOOP')
        break
      case 'B':
        this.smartBomb()
        this.flash('BOMB!')
        break
      case 'D':
        this.disarmUntil = this.time.now + DISARM_MS
        this.flash('DISARMED')
        break
      case '1':
        this.lives++
        this.flash('1UP')
        break
    }
    this.score += SCORE_POWERUP
    this.updateHud()
  }

  private smartBomb() {
    let shown = 0
    for (const o of this.enemies.getChildren()) {
      const e = o as Enemy
      if (e.active) {
        this.creditKill(e) // proper score + red-formation POW bookkeeping
        if (shown < 12) {
          this.explode(e.x, e.y, 0xffb347) // cap explosion churn on a full screen
          shown++
        }
        e.disableBody(true, true)
      }
    }
    for (const o of this.enemyBullets.getChildren()) {
      const b = o as Bullet
      if (b.active) b.disableBody(true, true)
    }
    this.cameras.main.flash(200, 255, 255, 255)
    this.sfx.explosion()
    // A bomb also takes a chunk out of the boss — the fight that matters.
    if (this.boss) {
      this.bossHp -= Math.ceil(this.bossMaxHp * 0.15)
      if (this.bossPhase === 1 && this.bossHp <= this.bossMaxHp * 0.5) {
        this.bossPhase = 2
        this.flash('FULL POWER!')
      }
      if (this.bossHp <= 0) this.killBoss()
    }
    this.updateHud()
  }

  private enemyTouchesPlayer(enemy: Enemy) {
    if (!enemy.active) return
    if (this.time.now < this.invulnUntil) return
    this.explode(enemy.x, enemy.y, 0xe24b4a)
    enemy.disableBody(true, true)
    this.hurtPlayer()
  }

  private bulletHitsPlayer(bullet: Bullet) {
    if (!bullet.active) return
    if (this.time.now < this.invulnUntil) return
    bullet.disableBody(true, true)
    this.hurtPlayer()
  }

  private hurtPlayer() {
    if (this.gameOver || this.time.now < this.invulnUntil) return
    this.lives--
    this.sfx.hit()
    this.explode(this.player.x, this.player.y, 0xf2e2b6)
    this.cameras.main.shake(200, 0.012)
    this.weaponLevel = 0
    this.hasWings = false
    this.wingLeft.setVisible(false)
    this.wingRight.setVisible(false)
    this.loops = LOOPS_PER_LIFE
    this.invulnUntil = this.time.now + RESPAWN_INVULN_MS
    if (this.lives <= 0) {
      this.endGame(false)
      return
    }
    this.updateHud()
  }

  // ---- Boss --------------------------------------------------------------
  private spawnBoss(s: StageDef) {
    this.bossSpawned = true
    this.bossMaxHp = s.bossHp
    this.bossHp = s.bossHp
    this.bossPhase = 1
    this.bossDir = 1
    this.bossFireMul = s.fireMul
    this.bossNextFire = this.time.now + 1200
    const boss = this.physics.add.sprite(GAME_W / 2, -60, 'boss')
    ;(boss.body as Phaser.Physics.Arcade.Body).setSize(boss.width * 0.8, boss.height * 0.7, true)
    this.boss = boss
    this.tweens.add({ targets: boss, y: 130, duration: 1500, ease: 'Sine.easeOut' })
    this.bossColliders = [
      this.physics.add.overlap(this.playerBullets, boss, (b) => this.bulletHitBoss(b as unknown as Bullet)),
      this.physics.add.overlap(this.player, boss, () => this.hurtPlayer())
    ]
    this.flash('WARNING: BOMBER')
  }

  private removeBossColliders() {
    this.bossColliders.forEach((c) => this.physics.world.removeCollider(c))
    this.bossColliders = []
  }

  private bulletHitBoss(bullet: Bullet) {
    if (!bullet.active || !this.boss) return
    bullet.disableBody(true, true)
    this.bossHp--
    this.boss.setAlpha(0.6)
    this.time.delayedCall(40, () => this.boss?.setAlpha(1))
    if (this.bossPhase === 1 && this.bossHp <= this.bossMaxHp * 0.5) {
      this.bossPhase = 2
      this.flash('FULL POWER!')
    }
    if (this.bossHp <= 0) this.killBoss()
  }

  private killBoss() {
    if (!this.boss) return
    const bx = this.boss.x
    const by = this.boss.y
    this.score += SCORE_BOSS
    this.sfx.bossDie()
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 120, () =>
        this.explode(bx + Phaser.Math.Between(-80, 80), by + Phaser.Math.Between(-30, 30), 0xffb347)
      )
    }
    this.cameras.main.shake(500, 0.02)
    this.removeBossColliders()
    this.boss.destroy()
    this.boss = undefined
    this.bossBar.clear()
    this.onBossDefeated()
  }

  private onBossDefeated() {
    const bonus = this.loops * LOOP_BONUS
    if (bonus > 0) {
      this.score += bonus
      this.flash('LOOP BONUS +' + bonus)
    }
    this.updateHud()
    if (this.stage >= STAGE_COUNT) {
      this.endGame(true)
      return
    }
    this.stageClearing = true
    this.time.delayedCall(1900, () => {
      if (this.gameOver) return
      this.loops = LOOPS_PER_LIFE
      this.stageClearing = false
      this.startStage(this.stage + 1)
      this.updateHud()
    })
  }

  private bossFire() {
    if (!this.boss || this.time.now < this.disarmUntil) return
    const bx = this.boss.x
    const by = this.boss.y + 40
    const shoot = (ang: number) => {
      const b = this.enemyBullets.get() as Bullet | null
      if (b) b.fire(bx, by, Math.cos(ang) * 220, Math.sin(ang) * 220, 'ebullet')
    }
    if (this.bossPhase === 1) {
      shoot(Math.PI / 2 - 0.3)
      shoot(Math.PI / 2)
      shoot(Math.PI / 2 + 0.3)
    } else {
      const toP = Phaser.Math.Angle.Between(bx, by, this.player.x, this.player.y)
      for (let i = -2; i <= 2; i++) shoot(toP + i * 0.22)
    }
    this.sfx.enemyShoot()
  }

  private updateBoss(time: number, dt: number) {
    if (!this.boss) return
    if (this.boss.y >= 128) {
      this.boss.x += this.bossDir * 90 * dt
      if (this.boss.x < 110) {
        this.boss.x = 110
        this.bossDir = 1
      } else if (this.boss.x > GAME_W - 110) {
        this.boss.x = GAME_W - 110
        this.bossDir = -1
      }
      if (time > this.bossNextFire) {
        this.bossFire()
        this.bossNextFire = time + (this.bossPhase === 2 ? 750 : 1200) / this.bossFireMul
      }
    }
    this.bossBar.clear()
    this.bossBar.fillStyle(0x331111).fillRect(40, 18, GAME_W - 80, 8)
    this.bossBar.fillStyle(0xe24b4a).fillRect(40, 18, (GAME_W - 80) * (this.bossHp / this.bossMaxHp), 8)
  }

  // ---- FX ----------------------------------------------------------------
  private explode(x: number, y: number, tint: number) {
    for (let i = 0; i < 9; i++) {
      const p = this.add.image(x, y, 'particle').setTint(tint).setDepth(500)
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const dist = Phaser.Math.Between(10, 46)
      this.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        alpha: 0,
        scale: 0,
        duration: 320,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      })
    }
  }

  // ---- Flow --------------------------------------------------------------
  private endGame(win: boolean) {
    if (this.gameOver) return
    this.gameOver = true
    this.sfx.stopMusic()
    if (!win) {
      this.player.setVisible(false)
      this.wingLeft.setVisible(false)
      this.wingRight.setVisible(false)
      this.boss?.setVisible(false)
      this.bossBar.clear()
    }
    this.time.delayedCall(win ? 1300 : 700, () => this.scene.start('over', { score: this.score, win }))
  }

  // ---- Wave director -----------------------------------------------------
  private spawnWave(w: WaveEvent, s: StageDef) {
    const fid = this.formationCounter++
    if (w.reds)
      this.formations.set(fid, { count: w.count, killed: 0, escaped: 0, reds: true, lastX: GAME_W / 2, lastY: 120 })
    const texture = w.reds ? 'enemy' : 'enemyGrey'
    const hp = w.hp * s.hpMul
    const score = SCORE_ENEMY * hp
    const spread = Math.min(GAME_W - 80, w.count * 52)
    const x0 = GAME_W / 2 - spread / 2
    const mid = (w.count - 1) / 2
    for (let i = 0; i < w.count; i++) {
      const e = this.enemies.get() as Enemy | null
      if (!e) break
      const x = w.count === 1 ? GAME_W / 2 : x0 + (spread / (w.count - 1)) * i
      const d = Math.abs(i - mid)
      let yOff = -40
      if (w.shape === 'vee') yOff = -40 - d * 26
      else if (w.shape === 'arc') yOff = -40 - (mid - d) * 24
      e.spawn(Phaser.Math.Clamp(x, 30, GAME_W - 30), yOff, {
        hp,
        pattern: w.pattern,
        texture,
        formationId: w.reds ? fid : -1,
        score,
        speedMul: s.speedMul,
        fireMul: s.fireMul
      })
    }
  }

  // ---- Main loop ---------------------------------------------------------
  update(time: number, delta: number) {
    const dt = delta / 1000

    const dy = (delta / 1000) * 90
    for (const r of this.waves) {
      r.y += dy
      if (r.y > GAME_H + 4) r.y -= GAME_H + 120
    }

    if (this.gameOver) return

    if (this.cursors.left.isDown) this.targetX = Phaser.Math.Clamp(this.targetX - 360 * dt, 16, GAME_W - 16)
    if (this.cursors.right.isDown) this.targetX = Phaser.Math.Clamp(this.targetX + 360 * dt, 16, GAME_W - 16)
    if (this.cursors.up.isDown) this.targetY = Phaser.Math.Clamp(this.targetY - 360 * dt, 40, GAME_H - 20)
    if (this.cursors.down.isDown) this.targetY = Phaser.Math.Clamp(this.targetY + 360 * dt, 40, GAME_H - 20)

    if (this.player.active) {
      this.player.x = Phaser.Math.Linear(this.player.x, this.targetX, PLAYER_FOLLOW)
      this.player.y = Phaser.Math.Linear(this.player.y, this.targetY, PLAYER_FOLLOW)
      this.wingLeft.x = this.player.x - 28
      this.wingLeft.y = this.player.y + 14
      this.wingRight.x = this.player.x + 28
      this.wingRight.y = this.player.y + 14

      const invuln = this.time.now < this.invulnUntil
      this.player.setAlpha(invuln && Math.floor(this.time.now / 80) % 2 === 0 ? 0.35 : 1)

      if (time > this.nextFireAt) {
        this.autoFire()
        this.nextFireAt = time + PLAYER_FIRE_MS
      }
    }

    const s = STAGES[this.stage - 1]
    const elapsed = (time - this.startTime) / 1000
    while (!this.stageClearing && this.waveIndex < s.waves.length && s.waves[this.waveIndex].at <= elapsed) {
      this.spawnWave(s.waves[this.waveIndex], s)
      this.waveIndex++
    }

    if (
      !this.bossSpawned &&
      !this.stageClearing &&
      elapsed >= s.bossAt &&
      this.waveIndex >= s.waves.length &&
      this.enemies.countActive(true) === 0
    ) {
      this.spawnBoss(s)
    }

    this.updateBoss(time, dt)
  }
}
