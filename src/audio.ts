// Procedural retro SFX + a simple music loop via WebAudio.
// Self-generated, so it's 100% ours, offline, and zero-asset.
type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle'

import { loadSoundOn, saveSoundOn } from './config'

export class Sfx {
  private ctx?: AudioContext
  private master?: GainNode
  muted = false
  private musicTimer?: number
  private step = 0

  constructor() {
    this.muted = !loadSoundOn() // remember the player's choice across sessions
  }

  // Must be called from a user gesture (mobile Safari locks audio until then).
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctor: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctor()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.35
    this.master.connect(this.ctx.destination)
    // iOS suspends the context when the PWA is backgrounded/locked — resume on return.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
    })
  }

  private blip(f0: number, f1: number, dur: number, vol: number, kind: Wave = 'square'): void {
    if (!this.ctx || !this.master || this.muted) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = kind
    o.frequency.setValueAtTime(f0, t)
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(this.master)
    o.start(t)
    o.stop(t + dur)
  }

  private noise(dur: number, vol: number): void {
    if (!this.ctx || !this.master || this.muted) return
    const t = this.ctx.currentTime
    const len = Math.floor(this.ctx.sampleRate * dur)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const g = this.ctx.createGain()
    g.gain.value = vol
    src.connect(g)
    g.connect(this.master)
    src.start(t)
  }

  shoot(): void {
    this.blip(900, 320, 0.07, 0.14, 'square')
  }
  enemyShoot(): void {
    this.blip(320, 150, 0.12, 0.08, 'sawtooth')
  }
  explosion(): void {
    this.noise(0.28, 0.25)
    this.blip(200, 40, 0.28, 0.18, 'triangle')
  }
  hit(): void {
    this.blip(180, 60, 0.3, 0.3, 'square')
    this.noise(0.25, 0.25)
  }
  powerup(): void {
    this.blip(420, 900, 0.16, 0.2, 'square')
    this.blip(620, 1300, 0.18, 0.14, 'triangle')
  }
  loop(): void {
    this.blip(220, 1200, 0.32, 0.18, 'sine')
  }
  bossDie(): void {
    this.noise(0.8, 0.4)
    this.blip(300, 30, 0.8, 0.22, 'sawtooth')
  }

  private static BASS = [110, 0, 0, 110, 98, 0, 98, 0, 110, 0, 0, 110, 130, 0, 123, 0]
  private static LEAD = [0, 330, 0, 440, 0, 294, 0, 392, 0, 330, 0, 440, 0, 392, 0, 523]

  startMusic(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
    if (!this.ctx || this.musicTimer) return
    this.step = 0
    this.musicTimer = window.setInterval(() => {
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
      const i = this.step % 16
      const b = Sfx.BASS[i]
      const l = Sfx.LEAD[i]
      if (b > 0) this.blip(b, b, 0.16, 0.06, 'triangle')
      if (l > 0) this.blip(l, l, 0.1, 0.03, 'square')
      this.step++
    }, 150)
  }

  stopMusic(): void {
    if (this.musicTimer) {
      clearInterval(this.musicTimer)
      this.musicTimer = undefined
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    saveSoundOn(!this.muted)
    if (this.muted) this.stopMusic()
    else this.startMusic()
    return this.muted
  }
}
