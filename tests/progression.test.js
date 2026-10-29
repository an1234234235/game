import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialGameState } from '../src/data/gameState.js';
import { ENEMIES } from '../src/data/enemies.js';
import { createEncounterEnemyGroup, getFloorEncounters } from '../src/data/floors.js';
import { advanceFloor, applyBattleRewards, createProgressionState } from '../src/systems/ProgressionSystem.js';
import { saveGameState, loadGameState, hasSave, clearSave } from '../src/systems/SaveSystem.js';

test('progression unlocks the next floor and grants rewards', () => {
  const state = createInitialGameState();
  state.dungeon.defeatedEncounters = ['floor-1-wisp-west'];
  const progression = createProgressionState();
  const next = applyBattleRewards({ ...state, progression }, { xp: 45, gold: 30, floor: 1 });
  const advanced = advanceFloor(next, 1);

  assert.equal(advanced.progression.currentFloor, 2);
  assert.ok(advanced.progression.unlockedFloors.includes(2));
  assert.equal(advanced.player.experience, 45);
  assert.equal(advanced.player.gold, 30);
  assert.deepEqual(advanced.dungeon.defeatedEncounters, []);
});

test('every floor has regular monsters before its configured boss', () => {
  for (let floor = 1; floor <= 5; floor += 1) {
    const encounters = getFloorEncounters(floor);
    const monsters = encounters.filter((encounter) => encounter.kind === 'monster');
    const boss = encounters.find((encounter) => encounter.kind === 'boss');

    assert.equal(monsters.length, 2);
    assert.ok(monsters.every((encounter) => ENEMIES[encounter.enemyId]));
    assert.ok(boss);
    assert.equal(ENEMIES[boss.enemyId]?.kind, 'boss');
  }
});

test('regular encounters can generate one to three valid monsters while boss encounters stay singular', () => {
  const [monsterEncounter, , bossEncounter] = getFloorEncounters(1);
  const groupSizes = [0, 0.34, 0.67].map((roll) => createEncounterEnemyGroup(monsterEncounter, () => roll).length);
  const bossGroup = createEncounterEnemyGroup(bossEncounter, () => 0.99);

  assert.deepEqual(groupSizes, [1, 2, 3]);
  assert.deepEqual(bossGroup, ['ice-king']);
});

test('save and load preserve the active party and dungeon progress', () => {
  const state = createInitialGameState();
  state.gameTitle = 'Lanternfall';
  state.player.name = 'Aster Vale';
  state.dungeon.floor = 3;
  state.dungeon.playerX = 6;
  state.dungeon.playerY = 5;
  saveGameState(state, 'slot-1');

  assert.equal(hasSave('slot-1'), true);
  const loaded = loadGameState('slot-1');
  assert.equal(loaded.player.name, 'Aster Vale');
  assert.equal(loaded.dungeon.floor, 3);
  assert.equal(loaded.dungeon.playerX, 6);
  assert.equal(loaded.dungeon.playerY, 5);

  clearSave('slot-1');
  assert.equal(hasSave('slot-1'), false);
});

test('skill tree can unlock, upgrade, and reset skills with proper SP accounting', async () => {
  const { unlockOrUpgradeSkill, resetSkillTreeState } = await import('../src/systems/ProgressionSystem.js');
  const state = createInitialGameState();
  assert.equal(state.player.skillPoints, 3);
  assert.equal(state.player.unlockedSkills.power_strike, 1);

  // Unlock Whirlwind (cost 1 SP)
  const step1 = unlockOrUpgradeSkill(state, 'whirlwind', 1);
  assert.equal(step1.player.skillPoints, 2);
  assert.equal(step1.player.unlockedSkills.whirlwind, 1);
  assert.ok(step1.player.skills.includes('whirlwind'));

  // Upgrade Whirlwind to rank 2 (cost 1 SP)
  const step2 = unlockOrUpgradeSkill(step1, 'whirlwind', 1);
  assert.equal(step2.player.skillPoints, 1);
  assert.equal(step2.player.unlockedSkills.whirlwind, 2);

  // Upgrade Power Strike to rank 2 (cost 1 SP)
  const step3 = unlockOrUpgradeSkill(step2, 'power_strike', 1);
  assert.equal(step3.player.skillPoints, 0);
  assert.equal(step3.player.unlockedSkills.power_strike, 2);

  // Cannot afford next upgrade
  const failedStep = unlockOrUpgradeSkill(step3, 'iron_wall', 1);
  assert.equal(failedStep.player.skillPoints, 0);
  assert.equal(failedStep.player.unlockedSkills.iron_wall, undefined);

  // Reset tree: should refund 2 SP from whirlwind (rank 2) + 1 SP from power_strike (rank 2 - rank 1) = 3 SP refunded
  const reset = resetSkillTreeState(step3);
  assert.equal(reset.player.skillPoints, 3);
  assert.deepEqual(reset.player.unlockedSkills, { power_strike: 1 });
  assert.deepEqual(reset.player.skills, ['power_strike']);
});

test('clearing a floor awards +3 Skill Points to the player', () => {
  const state = createInitialGameState();
  const initialSp = state.player.skillPoints;
  const advanced = advanceFloor(state, 1);

  assert.equal(advanced.player.skillPoints, initialSp + 3);
  assert.equal(advanced.skillPoints, initialSp + 3);
});

test('experience curve requires progressively more EXP at higher levels', async () => {
  const { getRequiredExpForLevel } = await import('../src/systems/ProgressionSystem.js');
  const expLv1 = getRequiredExpForLevel(1);
  const expLv2 = getRequiredExpForLevel(2);
  const expLv3 = getRequiredExpForLevel(3);
  const expLv4 = getRequiredExpForLevel(4);

  assert.ok(expLv1 < expLv2, 'Lv 2 requires more EXP than Lv 1');
  assert.ok(expLv2 < expLv3, 'Lv 3 requires more EXP than Lv 2');
  assert.ok(expLv3 < expLv4, 'Lv 4 requires more EXP than Lv 3');
});

test('defeating higher level monsters awards more EXP and Gold', async () => {
  const { calculateMonsterRewards } = await import('../src/systems/ProgressionSystem.js');
  const lowLevelMonster = [{ name: 'Goblin', level: 1, kind: 'monster' }];
  const highLevelMonster = [{ name: 'Ghost Dancer', level: 3, kind: 'monster' }];
  const bossMonster = [{ name: 'Ice King', level: 5, kind: 'boss' }];

  const lowReward = calculateMonsterRewards(lowLevelMonster, 1);
  const highReward = calculateMonsterRewards(highLevelMonster, 1);
  const bossReward = calculateMonsterRewards(bossMonster, 1);

  assert.ok(highReward.xp > lowReward.xp, 'Level 3 monster yields more EXP than level 1 monster');
  assert.ok(bossReward.xp > highReward.xp, 'Boss yields significantly more EXP than regular monster');
});

test('leveling up awards +2 SP, increases stats, and heals player', async () => {
  const { processExperienceGain, getRequiredExpForLevel } = await import('../src/systems/ProgressionSystem.js');
  const player = {
    level: 1,
    experience: 0,
    skillPoints: 3,
    stats: { hp: 120, mp: 24, atk: 18, matk: 5, def: 13, mdef: 8, spd: 10 },
    currentHp: 60,
    currentMp: 10,
    unlockedSkills: { power_strike: 1 },
  };

  const reqForLv1 = getRequiredExpForLevel(1);
  const result = processExperienceGain(player, reqForLv1 + 10);

  assert.equal(result.levelsGained, 1);
  assert.equal(result.newLevel, 2);
  assert.equal(result.spGained, 2);
  assert.equal(result.updatedPlayer.skillPoints, 5); // 3 + 2
  assert.equal(result.updatedPlayer.experience, 10);
  assert.ok(result.updatedPlayer.stats.hp > 120);
  assert.ok(result.updatedPlayer.stats.atk > 18);
  assert.equal(result.updatedPlayer.currentHp, result.updatedPlayer.stats.hp); // Healed on level up
});

