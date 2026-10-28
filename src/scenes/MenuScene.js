import Phaser from 'phaser';
import { addButton, addLabel, COLORS, GAME_HEIGHT, GAME_WIDTH } from '../ui/layout.js';
import { loadGameState } from '../systems/SaveSystem.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d110f).setOrigin(0);
    this.add.rectangle(640, 360, 760, 420, COLORS.panel).setStrokeStyle(2, COLORS.gold);
    addLabel(this, 'LANTERNFALL', 640, 160, { display: true, size: '32px', color: '#e7d9a5' }).setOrigin(0.5);
    addLabel(this, 'RPG FANTASY TURN-BASED PROTOTYPE', 640, 205, { size: '12px', color: '#a8b6a2', align: 'center' }).setOrigin(0.5);
    addLabel(this, 'A small tower of ruined light and broken vows.', 640, 250, { size: '11px', color: '#d2d1bd', align: 'center' }).setOrigin(0.5);

    addButton(this, 640, 330, 220, 48, 'NEW GAME', () => this.scene.start('intro'), { size: '14px', fill: 0x344239, stroke: COLORS.gold });
    addButton(this, 640, 392, 220, 48, 'CONTINUE', () => {
      const save = loadGameState('default');
      if (save) {
        this.scene.start('exploration', { gameState: save });
        return;
      }
      this.scene.start('intro');
    }, { size: '14px' });

    addButton(this, 640, 454, 220, 48, 'EXIT', () => window.close(), { size: '14px' });
  }
}
