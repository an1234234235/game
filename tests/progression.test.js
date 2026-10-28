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
