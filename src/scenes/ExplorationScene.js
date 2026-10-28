import Phaser from 'phaser';
import { createInitialGameState } from '../data/gameState.js';
import { ENEMIES } from '../data/enemies.js';
import { createEncounterEnemyGroup, getFloorDefinition, getFloorEncounters } from '../data/floors.js';
import { saveGameState } from '../systems/SaveSystem.js';
import { addButton, addLabel, addMeter, addPanel, COLORS, GAME_HEIGHT, GAME_WIDTH } from '../ui/layout.js';

const TILE = 48;
const MAP_ORIGIN = { x: 314, y: 159 };
const MAP_WIDTH = 14;
const MAP_HEIGHT = 9;
const WALLS = new Set([
  '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0', '9,0', '10,0', '11,0', '12,0', '13,0',
  '0,1', '13,1', '0,2', '13,2', '0,3', '13,3', '0,4', '13,4', '0,5', '13,5', '0,6', '13,6', '0,7', '13,7',
  '0,8', '1,8', '2,8', '3,8', '4,8', '5,8', '6,8', '7,8', '8,8', '9,8', '10,8', '11,8', '12,8', '13,8',
  '5,2', '5,3', '5,4', '8,5', '9,5', '3,6',
]);

export class ExplorationScene extends Phaser.Scene {
  constructor() {
    super('exploration');
    this.gameState = createInitialGameState();
    this.moveReadyAt = 0;
    this.modalOpen = false;
    this.paused = false;
    this.notice = 'The air is still. Something stirs deeper in the ruins.';
  }

  init(data) {
    if (data?.gameState) this.gameState = data.gameState;
    this.nearbyLabel = null;
    this.modalOpen = false;
    this.paused = false;
    this.moveReadyAt = 0;
    this.notice = this.notice ?? 'The air is still. Something stirs deeper in the ruins.';
  }

  create() {
    this.drawFrame();
    this.drawHud();
    this.drawMap();
    this.drawSidebar();
    this.setupInput();
    this.refreshActors();
  }

  drawFrame() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.ink).setOrigin(0);
    this.add.rectangle(12, 12, GAME_WIDTH - 24, GAME_HEIGHT - 24).setOrigin(0).setStrokeStyle(1, COLORS.line);
    addLabel(this, 'LANTERNFALL', 28, 22, { display: true, size: '25px', color: '#e2c77b' });
    addLabel(this, 'FIELD NOTES  /  THE SUNKEN ARCHIVE', 30, 57, { size: '11px', color: '#9aa697' });
    const floor = this.gameState.dungeon.floor ?? 1;
    addLabel(this, `EXPLORATION   •   FLOOR ${String(floor).padStart(2, '0')}`, 1045, 31, { size: '12px', color: '#c4c2ad' });
    this.add.rectangle(28, 80, 1224, 1, COLORS.line).setOrigin(0);
    addPanel(this, 26, 99, 250, 534);
    addPanel(this, 292, 99, 696, 534, { fill: 0x17201d });
    addPanel(this, 1004, 99, 250, 534);
    addLabel(this, 'ADVENTURER', 44, 117, { size: '11px', color: '#d5b66c' });
    addLabel(this, 'FLOOR MAP  /  ROOMS', 314, 117, { size: '11px', color: '#d5b66c' });
    addLabel(this, 'FIELD ACTIONS', 1022, 117, { size: '11px', color: '#d5b66c' });
    this.add.rectangle(28, 647, 1224, 1, COLORS.line).setOrigin(0);
    addLabel(this, 'WASD / ARROWS  MOVE     E  INTERACT     ESC  CLOSE PANEL', 30, 665, { size: '11px', color: '#9aa697' });
    addLabel(this, 'PLACEHOLDER BUILD  /  NO ART ASSETS LOADED', 930, 665, { size: '10px', color: '#758277' });
  }

  drawHud() {
    const player = this.gameState.player;
    addLabel(this, player.name.toUpperCase(), 44, 146, { display: true, size: '18px' });
    addLabel(this, 'WARRIOR   /   LEVEL 01', 44, 174, { size: '11px', color: '#9aa697' });
    this.playerHpLabel = addLabel(this, '', 44, 213, { size: '12px' });
    this.playerMpLabel = addLabel(this, '', 44, 255, { size: '12px' });
    this.add.rectangle(44, 196, 214, 1, COLORS.line).setOrigin(0);
    addLabel(this, 'VITALS', 44, 188, { size: '10px', color: '#d5b66c' });
    this.add.rectangle(44, 238, 214, 9, COLORS.shadow).setOrigin(0);
    this.hpBar = this.add.rectangle(44, 242, 214, 9, COLORS.green).setOrigin(0, 0.5);
    this.add.rectangle(44, 280, 214, 9, COLORS.shadow).setOrigin(0);
    this.mpBar = this.add.rectangle(44, 284, 214, 9, COLORS.blue).setOrigin(0, 0.5);
    this.levelTag = addLabel(this, 'LV 01', 222, 153, { size: '11px', color: '#d5b66c' }).setOrigin(1, 0);
    addLabel(this, 'PARTY ROSTER', 44, 316, { size: '10px', color: '#d5b66c' });
    this.gameState.party.forEach((member, index) => {
      const y = 343 + index * 39;
      this.add.rectangle(44, y, 214, 31, 0x202b26).setOrigin(0).setStrokeStyle(1, 0x435248);
      addLabel(this, member.name, 54, y + 8, { size: '11px' });
      addLabel(this, member.classId.toUpperCase(), 245, y + 8, { size: '9px', color: '#9aa697' }).setOrigin(1, 0);
    });
    addLabel(this, 'EXPLORER STATUS', 44, 480, { size: '10px', color: '#d5b66c' });
    addLabel(this, 'No active effects', 44, 501, { size: '11px', color: '#9aa697' });
    this.noticeLabel = addLabel(this, this.notice, 44, 544, { size: '11px', color: '#c7c8b2', wrapWidth: 210, lineSpacing: 4 });
    this.refreshHud();
  }

  drawMap() {
    const mapX = MAP_ORIGIN.x;
    const mapY = MAP_ORIGIN.y;
    const floor = getFloorDefinition(this.gameState.dungeon.floor ?? 1);
    addLabel(this, floor.name.toUpperCase(), mapX + 204, mapY - 18, { size: '9px', color: '#758277' });
    this.mapGraphics = this.add.graphics();
    this.mapGraphics.fillStyle(0x222c27, 1);
    this.mapGraphics.fillRect(mapX, mapY, MAP_WIDTH * TILE, MAP_HEIGHT * TILE);
    this.mapGraphics.lineStyle(1, 0x536255, 0.65);
    for (let row = 0; row < MAP_HEIGHT; row += 1) {
      for (let col = 0; col < MAP_WIDTH; col += 1) {
        const px = mapX + col * TILE;
        const py = mapY + row * TILE;
        this.mapGraphics.fillStyle((row + col) % 2 ? 0x344239 : 0x39483d, 1);
        this.mapGraphics.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        if (WALLS.has(`${col},${row}`)) {
          this.mapGraphics.fillStyle(COLORS.wall, 1);
          this.mapGraphics.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          this.mapGraphics.lineStyle(2, 0x718071, 1);
          this.mapGraphics.strokeRect(px + 5, py + 5, TILE - 10, TILE - 10);
        }
        this.mapGraphics.lineStyle(1, 0x536255, 0.45);
        this.mapGraphics.strokeRect(px, py, TILE, TILE);
      }
    }

    this.drawMarker(3, 6, 'CHEST', 0xd5b66c);
    this.drawMarker(7, 2, 'NPC', 0x75a6bf);
    this.playerMarker = this.drawActor(2, 2, 'PLAYER_SPRITE', 0x7caa79);
    this.enemyMarkers = getFloorEncounters(floor.floor).map((encounter) => {
      const label = encounter.kind === 'boss' ? 'BOSS' : 'MONSTER';
      const color = encounter.kind === 'boss' ? 0xd36e61 : 0xc28b62;
      return { encounter, marker: this.drawActor(encounter.x, encounter.y, label, color) };
    });
    addLabel(this, 'ENTRY HALL', mapX + TILE * 1.4, mapY + TILE * 5.9, { size: '8px', color: '#899589' });
    addLabel(this, 'ECHO ARCHIVE', mapX + TILE * 5.7, mapY + TILE * 6.8, { size: '8px', color: '#899589' });
    addLabel(this, 'BOSS CHAMBER', mapX + TILE * 10.2, mapY + TILE * 1.3, { size: '8px', color: '#c89582' });
    addLabel(this, 'WALL / BLOCKED', mapX + 10, mapY + MAP_HEIGHT * TILE + 17, { size: '9px', color: '#899589' });
  }

  drawMarker(col, row, label, color) {
    const x = MAP_ORIGIN.x + col * TILE;
    const y = MAP_ORIGIN.y + row * TILE;
    this.add.rectangle(x + TILE / 2, y + TILE / 2, 24, 24, color).setStrokeStyle(2, 0x151b18);
    addLabel(this, label, x + TILE / 2, y + TILE - 7, { size: '8px', color: '#f0e7ca' }).setOrigin(0.5, 1);
  }

  drawActor(col, row, label, color) {
    const x = MAP_ORIGIN.x + col * TILE + TILE / 2;
    const y = MAP_ORIGIN.y + row * TILE + TILE / 2;
    const box = this.add.rectangle(x, y, 40, 40, 0x19211d).setStrokeStyle(2, color);
    const text = addLabel(this, label, x, y, { size: '8px', color: '#f0e7ca', align: 'center' }).setOrigin(0.5);
    return { box, text };
  }

  refreshActors() {
    const { playerX, playerY, defeatedEncounters = [] } = this.gameState.dungeon;
    const x = MAP_ORIGIN.x + playerX * TILE + TILE / 2;
    const y = MAP_ORIGIN.y + playerY * TILE + TILE / 2;
    this.playerMarker.box.setPosition(x, y);
    this.playerMarker.text.setPosition(x, y);
    this.enemyMarkers.forEach(({ encounter, marker }) => {
      const defeated = defeatedEncounters.includes(encounter.id);
      const bossLocked = encounter.kind === 'boss' && this.enemyMarkers.some(({ encounter: other }) => (
        other.kind === 'monster' && !defeatedEncounters.includes(other.id)
      ));
      marker.box.setVisible(!defeated);
      marker.text.setVisible(!defeated);
      marker.box.setAlpha(bossLocked ? 0.35 : 1);
      marker.text.setAlpha(bossLocked ? 0.35 : 1);
    });
    this.refreshHud();
  }

  drawSidebar() {
    const buttons = [
      ['INVENTORY', () => this.openModal('INVENTORY', 'Potion x3\nNo other items carried.')],
      ['FORMATION', () => this.openModal('FORMATION', this.gameState.party.map((member, i) => `${String(i + 1).padStart(2, '0')}  ${member.name}  /  ${member.role}`).join('\n'))],
      ['WORLD MAP', () => this.openModal('WORLD MAP', 'THE SUNKEN ARCHIVE\n\nFloor 01 discovered.\nUnmapped passages lie ahead.')],
      ['PAUSE MENU', () => this.togglePause()],
    ];
    buttons.forEach(([label, callback], index) => {
      addButton(this, 1129, 171 + index * 48, 214, 38, label, callback, { size: '11px' });
    });

    addLabel(this, 'NEARBY', 1022, 369, { size: '10px', color: '#d5b66c' });
    this.nearbyLabel = addLabel(this, '', 1022, 393, { size: '11px', color: '#c7c8b2', wrapWidth: 214, lineSpacing: 6 });
    addButton(this, 1129, 556, 214, 42, 'INTERACT  [E]', () => this.interact(), {
      fill: 0x39443a, stroke: COLORS.gold, textColor: '#ead493', size: '12px', bold: true,
    });
    addLabel(this, 'A short walk, a long shadow.', 1022, 591, { size: '9px', color: '#829084' });
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ESC');
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.modalOpen) this.closeModal();
      else this.togglePause();
    });
    this.input.keyboard.on('keydown-E', () => this.interact());
  }

  update(time) {
    if (this.paused || this.modalOpen || time < this.moveReadyAt) return;
    let dx = 0;
    let dy = 0;
    if (Phaser.Input.Keyboard.JustDown(this.keys.LEFT) || Phaser.Input.Keyboard.JustDown(this.keys.A)) dx = -1;
    else if (Phaser.Input.Keyboard.JustDown(this.keys.RIGHT) || Phaser.Input.Keyboard.JustDown(this.keys.D)) dx = 1;
    else if (Phaser.Input.Keyboard.JustDown(this.keys.UP) || Phaser.Input.Keyboard.JustDown(this.keys.W)) dy = -1;
    else if (Phaser.Input.Keyboard.JustDown(this.keys.DOWN) || Phaser.Input.Keyboard.JustDown(this.keys.S)) dy = 1;
    if (dx || dy) this.movePlayer(dx, dy, time);
  }

  movePlayer(dx, dy, time) {
    const { playerX, playerY } = this.gameState.dungeon;
    const nextX = playerX + dx;
    const nextY = playerY + dy;
    const enemyBlocked = !this.gameState.dungeon.enemyDefeated && nextX === 10 && nextY === 4;
    if (nextX < 1 || nextX > MAP_WIDTH - 2 || nextY < 1 || nextY > MAP_HEIGHT - 2 || WALLS.has(`${nextX},${nextY}`) || enemyBlocked) {
      this.moveReadyAt = time + 100;
      return;
    }
    this.gameState.dungeon.playerX = nextX;
    this.gameState.dungeon.playerY = nextY;
    this.moveReadyAt = time + 115;
    saveGameState(this.gameState, 'default');
    this.refreshActors();
  }

  interact() {
    if (this.paused || this.modalOpen) return;
    const { playerX, playerY, defeatedEncounters = [] } = this.gameState.dungeon;
    const encounters = getFloorEncounters(this.gameState.dungeon.floor ?? 1);
    const encounter = encounters.find((candidate) => (
      Math.abs(playerX - candidate.x) + Math.abs(playerY - candidate.y) <= 1
      && !defeatedEncounters.includes(candidate.id)
    ));
    if (encounter) {
      const monstersRemain = encounters.some((candidate) => (
        candidate.kind === 'monster' && !defeatedEncounters.includes(candidate.id)
      ));
      if (encounter.kind === 'boss' && monstersRemain) {
        this.notice = 'The boss chamber is sealed. Clear the nearby rooms first.';
        this.noticeLabel.setText(this.notice);
        return;
      }
      saveGameState(this.gameState, 'default');
      const enemyGroup = createEncounterEnemyGroup(encounter).map((enemyId) => ENEMIES[enemyId]);
      this.scene.start('battle', {
        returnScene: 'exploration',
        gameState: this.gameState,
        encounter,
        enemyGroup,
      });
      return;
    }
    const locations = [
      { x: 3, y: 6, text: 'The chest is sealed. A keyhole glints in the low light.' },
      { x: 7, y: 2, text: 'The archivist turns a page and says nothing.' },
    ];
    const nearby = locations.find((spot) => Math.abs(playerX - spot.x) + Math.abs(playerY - spot.y) <= 1);
    this.notice = nearby?.text ?? 'Nothing nearby answers your call.';
    this.noticeLabel.setText(this.notice);
  }

  refreshHud() {
    const player = this.gameState.player;
    if (!this.playerHpLabel) return;
    this.playerHpLabel.setText(`HP   ${player.currentHp} / ${player.stats.hp}`);
    this.playerMpLabel.setText(`MP   ${player.currentMp} / ${player.stats.mp}`);
    this.hpBar.width = 214 * Phaser.Math.Clamp(player.currentHp / player.stats.hp, 0, 1);
    this.mpBar.width = 214 * Phaser.Math.Clamp(player.currentMp / player.stats.mp, 0, 1);
    if (this.nearbyLabel) {
      const { playerX, playerY, defeatedEncounters = [] } = this.gameState.dungeon;
      const encounters = getFloorEncounters(this.gameState.dungeon.floor ?? 1);
      const encounter = encounters.find((candidate) => (
        Math.abs(playerX - candidate.x) + Math.abs(playerY - candidate.y) <= 1
        && !defeatedEncounters.includes(candidate.id)
      ));
      const monstersRemain = encounters.some((candidate) => (
        candidate.kind === 'monster' && !defeatedEncounters.includes(candidate.id)
      ));
      this.nearbyLabel.setText(encounter
        ? encounter.kind === 'boss' && monstersRemain
          ? 'Boss chamber sealed.\nClear the other rooms.'
          : `${ENEMIES[encounter.enemyId].name}\n[E] Begin encounter`
        : 'Explore the rooms.\n[E] Examine nearby');
    }
  }

  openModal(title, body) {
    if (this.modalOpen) return;
    this.modalOpen = true;
    this.modalLayer = this.add.container(0, 0);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x080c0a, 0.76).setOrigin(0);
    const panel = this.add.rectangle(640, 360, 500, 290, COLORS.panel).setStrokeStyle(2, COLORS.gold);
    const heading = addLabel(this, title, 420, 255, { display: true, size: '23px', color: '#e2c77b' });
    const content = addLabel(this, body, 420, 307, { size: '13px', color: '#d4d4c0', wrapWidth: 420, lineSpacing: 8 });
    this.modalLayer.add([shade, panel, heading, content]);
    addButton(this, 840, 459, 100, 34, 'CLOSE', () => this.closeModal(), { size: '11px' });
    this.modalCloseButton = this.children.list.slice(-2);
  }

  closeModal() {
    if (!this.modalOpen) return;
    this.modalOpen = false;
    this.modalLayer.destroy(true);
    this.modalCloseButton?.forEach((item) => item.destroy());
    this.modalCloseButton = null;
  }

  togglePause() {
    if (this.modalOpen) return;
    if (this.paused) {
      this.closePause();
      return;
    }
    this.paused = true;
    this.pauseLayer = this.add.container(0, 0);
    this.pauseLayer.add([
      this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x080c0a, 0.78).setOrigin(0),
      this.add.rectangle(640, 360, 420, 245, COLORS.panel).setStrokeStyle(2, COLORS.gold),
      addLabel(this, 'FIELD PAUSED', 490, 265, { display: true, size: '24px', color: '#e2c77b' }),
      addLabel(this, 'The expedition waits where you left it.', 490, 314, { size: '12px', color: '#c7c8b2' }),
    ]);
    addButton(this, 490, 388, 170, 40, 'RESUME', () => this.togglePause(), { size: '12px' });
    addButton(this, 680, 388, 110, 40, 'CLOSE', () => this.togglePause(), { size: '12px' });
    this.pauseButtons = this.children.list.slice(-4);
  }

  closePause() {
    this.paused = false;
    this.pauseLayer?.destroy(true);
    this.pauseLayer = null;
    this.pauseButtons?.forEach((item) => item.destroy());
    this.pauseButtons = null;
  }
}