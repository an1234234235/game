import Phaser from 'phaser';
import { createInitialGameState } from '../data/gameState.js';
import { addButton, addLabel, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../ui/layout.js';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('intro');
  }

  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d110f).setOrigin(0);
    this.add.rectangle(640, 360, 780, 440, COLORS.panel).setStrokeStyle(2, COLORS.gold);
    addLabel(this, 'THE STORY BEGINS', 640, 150, { display: true, size: '26px', color: '#e7d9a5' }).setOrigin(0.5);
    addLabel(this, 'Aster Vale, a ranger of the Lanternfall frontier, steps into the drowned archive.', 640, 230, { size: '13px', color: '#d5d0bf', align: 'center', wrapWidth: 620 }).setOrigin(0.5);
    addLabel(this, 'The vault hums with frost, memory, and a forgotten crown beneath the floor of the ruins.', 640, 270, { size: '13px', color: '#d5d0bf', align: 'center', wrapWidth: 620 }).setOrigin(0.5);
    addLabel(this, 'Your party follows the echo of the old king. The dungeon will test every choice.', 640, 320, { size: '13px', color: '#d5d0bf', align: 'center', wrapWidth: 620 }).setOrigin(0.5);

    addButton(this, 640, 420, 200, 46, 'BEGIN JOURNEY', () => {
      const gameState = createInitialGameState();
      this.scene.start('exploration', { gameState });
    }, { size: '14px', fill: 0x344239, stroke: COLORS.gold });
  }
}
