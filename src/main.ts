import Phaser from 'phaser'
import { GAME_W, GAME_H } from './config'
import { TitleScene } from './scenes/TitleScene'
import { PlayScene } from './scenes/PlayScene'
import { GameOverScene } from './scenes/GameOverScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b3a66',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  fps: { target: 60 },
  scene: [TitleScene, PlayScene, GameOverScene]
}

const game = new Phaser.Game(config)
// Exposed for debugging/automated verification only.
;(window as unknown as { game: Phaser.Game }).game = game
