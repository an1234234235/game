import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { ExplorationScene } from './scenes/ExplorationScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { FloorClearScene } from './scenes/FloorClearScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './ui/layout.js';
import './style.css';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#111716',
  render: {
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [MenuScene, IntroScene, ExplorationScene, BattleScene, FloorClearScene],
});

window.addEventListener('beforeunload', () => game.destroy(true));