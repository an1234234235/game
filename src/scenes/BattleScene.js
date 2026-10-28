import Phaser from 'phaser';
import { ASSET_PATHS } from '../data/assetManifest.js';
import { performEnemyTurn, performPlayerAction, createBattleState, COMMANDS } from '../systems/CombatSystem.js';
import { applyBattleRewards, getFloorReward } from '../systems/ProgressionSystem.js';
import { saveGameState } from '../systems/SaveSystem.js';
import { addButton, addLabel, addPanel, COLORS, GAME_HEIGHT, GAME_WIDTH } from '../ui/layout.js';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('battle');
    this.encounter = null;
  }

  preload() {
    const floor = Number(this.gameState?.dungeon?.floor ?? 1);
    this.backgroundModel = floor === 1
      ? ASSET_PATHS.backgrounds.archive
      : floor === 4
        ? ASSET_PATHS.backgrounds.forest
        : null;
    if (this.backgroundModel) this.load.image(this.backgroundModel.key, this.backgroundModel.path);

    const models = this.enemyDefinitions.map((enemy) => (
      (enemy.assetKey && ASSET_PATHS.enemies[enemy.assetKey])
      || (enemy.assetKey && ASSET_PATHS.bosses[enemy.assetKey])
      || ASSET_PATHS.bosses.iceKing
    ));
    this.enemyModels = [...new Map(models.map((model) => [model.key, model])).values()];
    this.enemyModels.forEach((model) => {
      if (model.frameCount) {
        this.load.spritesheet(model.key, model.path, {
          frameWidth: model.frameWidth,
          frameHeight: model.frameHeight,
        });
      } else {
        this.load.image(model.key, model.path);
      }
    });
    this.load.on('loaderror', (file) => {
      if (this.enemyModels.some((model) => model.key === file.key)) {
        console.error(`Unable to load enemy model: ${file.src}`);
      }
    });
  }

  init(data) {
    this.returnScene = data.returnScene ?? 'exploration';
    this.gameState = data.gameState;
    this.currentEncounter = data.encounter ?? { id: 'legacy-boss', kind: 'boss' };
    this.enemyDefinitions = data.enemyGroup ?? [data.enemy].filter(Boolean);
    this.battle = createBattleState(this.gameState.player, this.enemyDefinitions.length ? this.enemyDefinitions : undefined);
  }

  create() {
    this.drawFrame();
    this.drawCombatants();
    this.drawTurnOrder();
    this.drawCommands();
    this.drawLog();
    this.refresh();
    this.queueEnemyTurns();
  }

  drawFrame() {
    if (this.backgroundModel && this.textures.exists(this.backgroundModel.key)) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.backgroundModel.key)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.7);
      this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.ink, 0.48).setOrigin(0);
    } else {
      this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.ink).setOrigin(0);
    }
    this.add.rectangle(12, 12, GAME_WIDTH - 24, GAME_HEIGHT - 24).setOrigin(0).setStrokeStyle(1, COLORS.line);
    addLabel(this, 'LANTERNFALL', 28, 22, { display: true, size: '25px', color: '#e2c77b' });
    addLabel(this, 'ENCOUNTER  /  THE SUNKEN ARCHIVE', 30, 57, { size: '11px', color: '#9aa697' });
    addLabel(this, `${this.currentEncounter.kind === 'boss' ? 'BOSS' : 'MONSTER'} ENCOUNTER`, 900, 31, { size: '11px', color: '#c4c2ad' });
    this.add.rectangle(28, 80, 1224, 1, COLORS.line).setOrigin(0);
    if (this.backgroundModel && this.textures.exists(this.backgroundModel.key)) {
      this.add.rectangle(28, 98, 1224, 300, 0x17201d, 0.48)
        .setOrigin(0)
        .setStrokeStyle(2, COLORS.line);
    } else {
      addPanel(this, 28, 98, 1224, 300, { fill: 0x17201d });
    }
    addPanel(this, 28, 414, 346, 226);
    addPanel(this, 390, 414, 496, 226);
    addPanel(this, 902, 414, 350, 226);
    addLabel(this, 'PLAYER FORMATION', 48, 117, { size: '11px', color: '#d5b66c' });
    addLabel(this, 'DANGER FIELD', 50, 440, { size: '11px', color: '#d5b66c' });
    addLabel(this, 'BATTLE LOG', 410, 440, { size: '11px', color: '#d5b66c' });
    addLabel(this, 'COMMANDS', 922, 440, { size: '11px', color: '#d5b66c' });
    this.add.rectangle(28, 647, 1224, 1, COLORS.line).setOrigin(0);
    addLabel(this, 'TURN-BASED PROTOTYPE  /  ACTIONS RESOLVE ONE AT A TIME', 30, 665, { size: '10px', color: '#829084' });
  }

  drawCombatants() {
    this.partyViews = [];
    this.gameState.party.forEach((member, index) => {
      const x = 118 + index * 206;
      const y = 246;
      addPanel(this, x, y, 176, 126, { fill: 0x202b26, stroke: index === 0 ? COLORS.gold : 0x536255 });
      this.add.rectangle(x + 88, y + 49, 78, 58, 0x18201c).setStrokeStyle(2, index === 0 ? COLORS.green : COLORS.blue);
      addLabel(this, index === 0 ? 'PLAYER_SPRITE' : `${member.classId.toUpperCase()}_SPRITE`, x + 88, y + 49, {
        size: '8px', color: '#e4dec8', align: 'center', wrapWidth: 72,
      }).setOrigin(0.5);
      addLabel(this, member.name, x + 12, y + 83, { size: '11px' });
      addLabel(this, member.role, x + 12, y + 102, { size: '9px', color: '#9aa697' });
      this.partyViews.push({ x, member });
    });

    this.enemyViews = this.battle.enemies.map((enemy, index) => {
      const x = [790, 980, 1170][index];
      const model = this.enemyModels.find((candidate) => (
        candidate.key === ASSET_PATHS.enemies[enemy.assetKey]?.key
        || candidate.key === ASSET_PATHS.bosses[enemy.assetKey]?.key
      )) ?? ASSET_PATHS.bosses.iceKing;
      const card = this.add.rectangle(x, 264, 150, 236, 0x202b26, 0.78)
        .setStrokeStyle(2, COLORS.line)
        .setInteractive({ useHandCursor: true });
      const sprite = this.add.sprite(x, 222, model.key).setOrigin(0.5).setDisplaySize(128, 128);
      if (model.frameCount) {
        const animationKey = `${model.key}-idle`;
        if (!this.anims.exists(animationKey)) {
          this.anims.create({
            key: animationKey,
            frames: this.anims.generateFrameNumbers(model.key, { start: 0, end: model.frameCount - 1 }),
            frameRate: 8,
            repeat: -1,
          });
        }
        sprite.play(animationKey);
      }
      const name = addLabel(this, enemy.name, x, 304, {
        display: true, size: '12px', color: '#ead8c2', align: 'center', wrapWidth: 138,
      }).setOrigin(0.5);
      const level = addLabel(this, `LV ${String(enemy.level).padStart(2, '0')}`, x, 328, {
        size: '9px', color: '#c99a8e', align: 'center',
      }).setOrigin(0.5);
      this.add.rectangle(x - 62, 350, 124, 8, COLORS.shadow).setOrigin(0);
      const hpBar = this.add.rectangle(x - 62, 354, 124, 8, COLORS.red).setOrigin(0, 0.5);
      card.on('pointerdown', () => this.selectEnemy(enemy.instanceId));
      return { enemyId: enemy.instanceId, card, sprite, name, level, hpBar };
    });

    this.playerVitals = addPanel(this, 48, 474, 306, 142, { fill: 0x202b26, accent: false });
    this.playerName = addLabel(this, '', 64, 490, { size: '13px' });
    this.playerHpText = addLabel(this, '', 64, 525, { size: '11px', color: '#c7c8b2' });
    this.playerMpText = addLabel(this, '', 64, 571, { size: '11px', color: '#c7c8b2' });
  }

  drawTurnOrder() {
    addPanel(this, 414, 474, 448, 48, { fill: 0x202b26, accent: false });
    addLabel(this, 'TURN ORDER', 430, 490, { size: '9px', color: '#9aa697' });
    this.turnStatus = addLabel(this, '', 844, 490, { size: '9px', color: '#d5b66c', align: 'right' }).setOrigin(1, 0);
    this.turnOrderText = addLabel(this, '', 430, 509, { size: '11px', color: '#e4dec8' });
    this.selectionText = addLabel(this, '', 414, 540, { size: '11px', color: '#d5b66c' });
    this.logText = addLabel(this, '', 414, 564, { size: '10px', color: '#c7c8b2', wrapWidth: 448, lineSpacing: 3 });
  }

  drawCommands() {
    this.commandButtons = [];
    COMMANDS.forEach((command, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      this.commandButtons.push(addButton(this, 994 + col * 150, 491 + row * 43, 136, 34, command.toUpperCase(), () => this.chooseCommand(command), {
        size: '10px', fill: command === 'Attack' ? 0x39443a : COLORS.panelRaised,
        stroke: command === 'Attack' ? COLORS.gold : COLORS.line,
      }));
    });
    this.resultTitle = addLabel(this, '', 922, 480, { size: '13px', color: '#d5b66c' });
    this.resultButton = addButton(this, 989, 519, 136, 34, 'REPLAY', () => this.replay(), { size: '10px' });
    this.returnButton = addButton(this, 1147, 519, 150, 34, 'RETURN TO DUNGEON', () => this.returnToDungeon(), { size: '9px' });
    this.setResultButtonsVisible(false);
  }

  drawLog() {
    this.actionHint = addLabel(this, 'Choose a command to begin.', 922, 601, { size: '9px', color: '#829084', wrapWidth: 290 });
  }

  chooseCommand(command) {
    if (this.battle.actionLocked || this.battle.turn !== 'player' || this.battle.result) {
      this.actionHint.setText('Action in progress. Wait for your turn.');
      return;
    }
    this.battle = performPlayerAction(this.battle, command, this.battle.selectedEnemyId);
    this.refresh();
    this.queueEnemyTurns();
  }

  selectEnemy(enemyId) {
    if (!this.battle.enemies.some((enemy) => enemy.instanceId === enemyId && enemy.hp > 0)) return;
    this.battle.selectedEnemyId = enemyId;
    this.refresh();
  }

  queueEnemyTurns() {
    if (this.battle.result || this.battle.turn !== 'enemy' || this.battleTimer?.getProgress() < 1) return;
    this.battleTimer = this.time.delayedCall(500, () => {
      this.battle = performEnemyTurn(this.battle);
      this.refresh();
      this.queueEnemyTurns();
    });
  }

  refresh() {
    const { player, enemies, turn, result, round, log, selection, initiative, currentActorId } = this.battle;
    const currentActor = initiative.find((actor) => actor.id === currentActorId);
    this.playerName.setText(`${player.name}  /  WARRIOR`);
    this.playerHpText.setText(`HP  ${player.hp} / ${player.maxHp}`);
    this.playerMpText.setText(`MP  ${player.mp} / ${player.maxMp}`);
    this.enemyViews.forEach((view) => {
      const enemy = enemies.find((candidate) => candidate.instanceId === view.enemyId);
      if (!enemy) return;
      const alive = enemy.hp > 0;
      view.sprite.setAlpha(alive ? 1 : 0.22);
      view.name.setAlpha(alive ? 1 : 0.45);
      view.level.setAlpha(alive ? 1 : 0.45);
      view.hpBar.width = 124 * Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
      view.card.setStrokeStyle(2, enemy.instanceId === this.battle.selectedEnemyId ? COLORS.gold : COLORS.line);
      view.card.setAlpha(alive ? 1 : 0.45);
      if (view.card.input) view.card.input.enabled = alive && !result;
    });
    const initiativeLabel = initiative
      .map((actor) => `${actor.name.split(' ')[0].slice(0, 8)} ${actor.spd}`)
      .join(' > ');
    this.turnOrderText.setText(`ROUND ${round}   ${initiativeLabel}`);
    this.selectionText.setText(selection);
    this.turnStatus.setText(result ? this.resultLabel(result) : `${currentActor?.name ?? 'UNKNOWN'}'S TURN`);
    this.logText.setText(log.slice(-3).join('\n'));
    this.resultTitle.setText(result ? `${this.resultLabel(result)}  /  ROUND ${round}` : '');
    this.actionHint.setText(result ? this.resultLabel(result) : turn === 'enemy' ? 'Enemy action resolving…' : 'Choose an action. One action per turn.');
    this.setResultButtonsVisible(Boolean(result));
    this.syncPlayerToGameState();
  }

  syncPlayerToGameState() {
    this.gameState.player.currentHp = this.battle.player.hp;
    this.gameState.player.currentMp = this.battle.player.mp;
    const activePartyMember = this.gameState.party[0];
    activePartyMember.currentHp = this.battle.player.hp;
    activePartyMember.currentMp = this.battle.player.mp;
    if (this.battle.result === 'victory' && this.currentEncounter.kind === 'boss') {
      this.gameState.dungeon.enemyDefeated = true;
      saveGameState(this.gameState, 'default');
    }
  }

  resultLabel(result) {
    return result === 'victory' ? 'VICTORY' : result === 'defeat' ? 'DEFEAT' : 'ESCAPED';
  }

  setResultButtonsVisible(visible) {
    this.commandButtons.forEach(({ bg, text }) => {
      bg.setVisible(!visible);
      text.setVisible(!visible);
      if (visible) {
        bg.disableInteractive();
      } else {
        bg.setInteractive({ useHandCursor: true });
      }
      if (bg.input) {
        bg.input.enabled = !visible;
      }
    });

    this.actionHint?.setVisible(!visible);

    [this.resultButton, this.returnButton].forEach(({ bg, text }) => {
      bg.setVisible(visible);
      text.setVisible(visible);
      if (visible) {
        bg.setInteractive({ useHandCursor: true });
      } else {
        bg.disableInteractive();
      }
      if (bg.input) {
        bg.input.enabled = visible;
      }
    });

    this.resultTitle.setVisible(visible);
  }

  replay() {
    if (!this.battle.result) return;
    this.battleTimer?.remove(false);
    this.gameState.player.currentHp = this.gameState.player.stats.hp;
    this.gameState.player.currentMp = this.gameState.player.stats.mp;
    this.gameState.party[0].currentHp = this.gameState.party[0].stats.hp;
    this.gameState.party[0].currentMp = this.gameState.party[0].stats.mp;
    this.scene.restart({
      returnScene: this.returnScene,
      gameState: this.gameState,
      encounter: this.currentEncounter,
      enemyGroup: this.enemyDefinitions,
    });
  }

  returnToDungeon() {
    if (!this.battle.result) return;
    this.battleTimer?.remove(false);
    saveGameState(this.gameState, 'default');

    if (this.battle.result === 'victory') {
      if (this.currentEncounter.kind !== 'boss') {
        const floor = this.gameState.dungeon.floor ?? 1;
        this.gameState = applyBattleRewards(this.gameState, { floor, xp: 12, gold: 8 });
        const defeated = this.gameState.dungeon.defeatedEncounters ?? [];
        this.gameState.dungeon.defeatedEncounters = [...new Set([...defeated, this.currentEncounter.id])];
        saveGameState(this.gameState, 'default');
        this.scene.start(this.returnScene, { gameState: this.gameState });
        return;
      }
      const reward = getFloorReward(this.gameState.dungeon.floor ?? 1);
      this.scene.start('floor-clear', {
        gameState: this.gameState,
        reward,
      });
      return;
    }

    this.scene.start(this.returnScene, { gameState: this.gameState });
  }
}