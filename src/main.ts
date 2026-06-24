import Phaser from 'phaser'
import { PlayScene, GAME_W, GAME_H } from './scenes/PlayScene'

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
  fps: { target: 60 },
  scene: [PlayScene]
}

new Phaser.Game(config)
