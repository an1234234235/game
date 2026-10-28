import Phaser from 'phaser';
import { getFloorDefinition } from '../data/floors.js';
import { advanceFloor } from '../systems/ProgressionSystem.js';
import { addButton, addLabel, COLORS, GAME_HEIGHT, GAME_WIDTH } from '../ui/layout.js';

export class FloorClearScene extends Phaser.Scene {
  constructor() {
    super('floor-clear');
  }

  init(data) {
    this.gameState = data?.gameState ?? null;
    this.reward = data?.reward ?? { xp: 0, gold: 0 };
  }

  create() {
    const floor = this.gameState?.dungeon?.floor ?? 1;
    const definition = getFloorDefinition(floor);

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d110f).setOrigin(0);
    this.add.rectangle(640, 360, 720, 340, COLORS.panel).setStrokeStyle(2, COLORS.gold);
    addLabel(this, 'FLOOR CLEARED', 640, 170, { display: true, size: '26px', color: '#e7d9a5' }).setOrigin(0.5);
    addLabel(this, `${definition.name}`, 640, 230, { size: '18px', color: '#d1b879', align: 'center' }).setOrigin(0.5);
    addLabel(this, `Reward: ${this.reward.xp ?? 0} XP  •  ${this.reward.gold ?? 0} Gold`, 640, 286, { size: '14px', color: '#d6d4c5', align: 'center' }).setOrigin(0.5);
    addLabel(this, 'The lantern burns brighter. A hidden passage opens beyond the archive.', 640, 328, { size: '12px', color: '#a8b6a2', align: 'center', wrapWidth: 560 }).setOrigin(0.5);

    addButton(this, 640, 390, 180, 42, 'CONTINUE', () => {
      const nextGameState = advanceFloor(this.gameState, floor);
      this.scene.start('exploration', { gameState: nextGameState });
    }, { size: '13px', fill: 0x344239, stroke: COLORS.gold });
  }
}
