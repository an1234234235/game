import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createCharacter } from '../src/data/classes.js';
import { ASSET_PATHS } from '../src/data/assetManifest.js';
import { CAVE_WISP, ICE_KING, SEA_OCTOPUS } from '../src/data/enemies.js';
import {
  createBattleState,
  performEnemyTurn,
  performPlayerAction,
} from '../src/systems/CombatSystem.js';

function makePlayer(overrides = {}) {
  return createCharacter('warrior', { name: 'Test Warrior', ...overrides });
}

test('physical Attack follows the existing ATK and DEF formula', () => {
  const state = createBattleState(makePlayer());
  const expectedDamage = Math.max(1, state.player.atk + 3 - Math.floor(state.enemies[0].def / 3));
  const next = performPlayerAction(state, 'Attack');

  assert.equal(next.enemies[0].hp, state.enemies[0].hp - expectedDamage);
  assert.match(next.log.at(-1), new RegExp(`for ${expectedDamage} damage`));
});

test('HP cannot fall below zero after an enemy attack', () => {
  const state = createBattleState(makePlayer({ currentHp: 1 }));
  state.turn = 'enemy';
  state.enemies[0].atk = 9999;
  state.turn = 'enemy';
  state.currentActorId = state.enemies[0].id;

  assert.equal(performEnemyTurn(state).player.hp, 0);
});

test('an unaffordable skill does not consume MP', () => {
  const state = createBattleState(makePlayer({ currentMp: 0 }));
  const next = performPlayerAction(state, 'Skill');

  assert.equal(next.player.mp, 0);
  assert.equal(next.enemies[0].hp, state.enemies[0].hp);
  assert.ok(next.log.at(-1).includes('Not enough MP'));
});

test('a defeated player cannot perform an action', () => {
  const state = createBattleState(makePlayer({ currentHp: 0 }));
  const next = performPlayerAction(state, 'Attack');

  assert.equal(next.result, 'defeat');
  assert.equal(next.enemies[0].hp, state.enemies[0].hp);
});

test('a defeated enemy cannot take an enemy turn', () => {
  const state = createBattleState(makePlayer());
  state.enemies[0].hp = 0;
  const next = performEnemyTurn(state);

  assert.equal(next.result, 'victory');
  assert.equal(next.player.hp, state.player.hp);
});

test('one player turn accepts only one action', () => {
  const state = createBattleState(makePlayer());
  const afterFirst = performPlayerAction(state, 'Attack');
  const afterSecond = performPlayerAction(afterFirst, 'Attack');

  assert.equal(afterFirst.turn, 'enemy');
  assert.equal(afterSecond, afterFirst);
});

test('turns alternate and the round advances after the enemy turn', () => {
  const playerTurn = createBattleState(makePlayer());
  const enemyTurn = performPlayerAction(playerTurn, 'Guard');
  const nextRound = performEnemyTurn(enemyTurn);

  assert.equal(enemyTurn.turn, 'enemy');
  assert.equal(nextRound.turn, 'player');
  assert.equal(nextRound.round, 2);
});

test('Guard halves the next enemy hit and is then cleared', () => {
  const state = createBattleState(makePlayer());
  const guarded = performPlayerAction(state, 'Guard');
  const rawDamage = Math.max(1, guarded.enemies[0].atk - Math.floor(guarded.player.def / 3));
  const expectedDamage = Math.max(1, Math.floor(rawDamage / 2));
  const next = performEnemyTurn(guarded);

  assert.equal(next.player.hp, guarded.player.hp - expectedDamage);
  assert.equal(next.guarding, false);
});

test('victory ends the battle and prevents further damage', () => {
  const state = createBattleState(makePlayer());
  state.enemies[0].hp = 1;
  const victory = performPlayerAction(state, 'Attack');
  const afterEnd = performEnemyTurn(victory);

  assert.equal(victory.result, 'victory');
  assert.equal(victory.enemies[0].hp, 0);
  assert.equal(afterEnd, victory);
});

test('defeat ends the battle and prevents further player actions', () => {
  const state = createBattleState(makePlayer({ currentHp: 1 }));
  state.turn = 'enemy';
  state.enemies[0].atk = 9999;
  state.currentActorId = state.enemies[0].id;
  const defeat = performEnemyTurn(state);
  const afterEnd = performPlayerAction(defeat, 'Attack');

  assert.equal(defeat.result, 'defeat');
  assert.equal(defeat.player.hp, 0);
  assert.ok(defeat.log.at(-1).includes('Test Warrior falls'));
  assert.equal(afterEnd, defeat);
});

test('creating a replay battle starts with a clean round and full enemy HP', () => {
  const player = makePlayer();
  const previous = createBattleState(player);
  previous.turn = 'enemy';
  previous.round = 9;
  previous.enemies[0].hp = 0;
  previous.guarding = true;
  const replay = createBattleState(player);

  assert.equal(replay.turn, 'player');
  assert.equal(replay.round, 1);
  assert.equal(replay.enemies[0].hp, replay.enemies[0].maxHp);
  assert.equal(replay.guarding, false);
});

test('the declared boss asset exists and is a 128x128 PNG', async () => {
  const assetPath = fileURLToPath(new URL(`../${ASSET_PATHS.bosses.iceKing.path}`, import.meta.url));
  const png = await readFile(assetPath);

  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(png.readUInt32BE(16), 128);
  assert.equal(png.readUInt32BE(20), 128);
  assert.equal(png[24], 8, 'expected 8-bit image data');
  assert.equal(png[25], 6, 'expected RGBA color type with alpha channel');
  assert.equal(ASSET_PATHS.bosses.iceKing.key, ICE_KING.assetKey);
});

test('every regular enemy sprite in the manifest exists', async () => {
  for (const asset of Object.values(ASSET_PATHS.enemies)) {
    const assetPath = fileURLToPath(new URL(`../${asset.path}`, import.meta.url));
    const png = await readFile(assetPath);

    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (asset.frameCount) {
      const width = png.readUInt32BE(16);
      const height = png.readUInt32BE(20);
      assert.equal(width / asset.frameWidth, asset.frameCount);
      assert.equal(height, asset.frameHeight);
    }
  }
});

test('battle state accepts a regular monster instead of the default boss', () => {
  const state = createBattleState(makePlayer(), CAVE_WISP);

  assert.equal(state.enemies[0].id, CAVE_WISP.id);
  assert.equal(state.enemies[0].kind, 'monster');
  assert.equal(state.enemies[0].hp, CAVE_WISP.hp);
});

test('initiative orders faster combatants before slower combatants', () => {
  const ranger = makePlayer({ stats: { spd: 16 } });
  const state = createBattleState(ranger, [CAVE_WISP, ICE_KING]);

  assert.deepEqual(state.initiative.map((actor) => actor.id), ['player', 'ice-king', 'cave-wisp']);
  assert.equal(state.turn, 'player');
});

test('a battle supports three enemies and keeps duplicate enemy instances distinct', () => {
  const state = createBattleState(makePlayer(), [CAVE_WISP, CAVE_WISP, CAVE_WISP, ICE_KING]);

  assert.equal(state.enemies.length, 3);
  assert.equal(new Set(state.enemies.map((enemy) => enemy.instanceId)).size, 3);
  assert.equal(state.initiative.filter((actor) => actor.side === 'enemy').length, 3);
});

test('faster enemies act before the player and slower enemies act after the player', () => {
  const fastEnemy = { ...CAVE_WISP, spd: 18 };
  const slowEnemy = { ...CAVE_WISP, id: 'slow-wisp', spd: 4 };
  const state = createBattleState(makePlayer(), [fastEnemy, slowEnemy]);

  assert.equal(state.turn, 'enemy');
  assert.equal(state.currentActorId, fastEnemy.id);
  const afterFastEnemy = performEnemyTurn(state);
  assert.equal(afterFastEnemy.turn, 'player');
  const afterPlayer = performPlayerAction(afterFastEnemy, 'Guard');
  assert.equal(afterPlayer.turn, 'enemy');
  assert.equal(afterPlayer.currentActorId, slowEnemy.id);
});

test('every boss sprite and animated boss sheet in the manifest exists', async () => {
  for (const asset of Object.values(ASSET_PATHS.bosses)) {
    const assetPath = fileURLToPath(new URL(`../${asset.path}`, import.meta.url));
    const png = await readFile(assetPath);

    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (asset.frameCount) {
      assert.equal(png.readUInt32BE(16) / asset.frameWidth, asset.frameCount);
      assert.equal(png.readUInt32BE(20), asset.frameHeight);
    }
  }
});

test('multiple enemies each take a turn before the next round and Guard protects only against the first hit', () => {
  const state = createBattleState(makePlayer(), [CAVE_WISP, SEA_OCTOPUS]);
  const guarded = performPlayerAction(state, 'Guard');
  const firstAttacker = guarded.enemies.find((enemy) => enemy.instanceId === guarded.currentActorId);
  const firstRawDamage = Math.max(1, firstAttacker.atk - Math.floor(guarded.player.def / 3));
  const firstDamage = Math.max(1, Math.floor(firstRawDamage / 2));
  const afterFirst = performEnemyTurn(guarded);
  const secondAttacker = afterFirst.enemies.find((enemy) => enemy.instanceId === afterFirst.currentActorId);
  const secondDamage = Math.max(1, secondAttacker.atk - Math.floor(afterFirst.player.def / 3));
  const afterSecond = performEnemyTurn(afterFirst);

  assert.equal(afterFirst.turn, 'enemy');
  assert.equal(afterSecond.turn, 'player');
  assert.equal(afterSecond.round, 2);
  assert.equal(afterSecond.player.hp, guarded.player.hp - firstDamage - secondDamage);
  assert.equal(afterSecond.guarding, false);
});