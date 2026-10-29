import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createStatusEffect,
  addOrRefreshStatusEffect,
  processTurnStatusEffects,
  getEffectiveAtk,
  getEffectiveDef,
  removeStatusEffect,
} from '../src/systems/StatusEffectSystem.ts';

test('createStatusEffect creates valid status effect definitions', () => {
  const poison = createStatusEffect('poisoned', 3);
  assert.equal(poison.type, 'poisoned');
  assert.equal(poison.duration, 3);
  assert.equal(poison.damagePerTurn, 7);

  const burn = createStatusEffect('burned', 3);
  assert.equal(burn.type, 'burned');
  assert.equal(burn.damagePerTurn, 9);
  assert.equal(burn.statModifier?.stat, 'def');
  assert.equal(burn.statModifier?.multiplier, 0.8);

  const weaken = createStatusEffect('weakened', 2);
  assert.equal(weaken.type, 'weakened');
  assert.equal(weaken.statModifier?.stat, 'atk');
  assert.equal(weaken.statModifier?.multiplier, 0.7);
});

test('addOrRefreshStatusEffect adds new effect and refreshes duration on duplicates', () => {
  const initial = [createStatusEffect('poisoned', 1)];
  const fresh = createStatusEffect('poisoned', 3);
  const result = addOrRefreshStatusEffect(initial, fresh);

  assert.equal(result.updatedList.length, 1);
  assert.equal(result.updatedList[0].duration, 3);

  const withBurn = addOrRefreshStatusEffect(result.updatedList, createStatusEffect('burned', 2));
  assert.equal(withBurn.updatedList.length, 2);
});

test('processTurnStatusEffects applies damage, decrements duration, and removes expired effects', () => {
  const effects = [
    createStatusEffect('poisoned', 2), // 7 dmg, will have 1 turn left
    createStatusEffect('burned', 1),   // 9 dmg, will expire
  ];

  const result = processTurnStatusEffects('Aster Vale', 50, 100, effects);

  assert.equal(result.totalDamage, 16);
  assert.equal(result.nextHp, 34);
  assert.equal(result.remainingEffects.length, 1);
  assert.equal(result.remainingEffects[0].type, 'poisoned');
  assert.equal(result.remainingEffects[0].duration, 1);
  assert.ok(result.logs.some((l) => l.includes('Poison damage')));
  assert.ok(result.logs.some((l) => l.includes('Burn damage')));
  assert.ok(result.logs.some((l) => l.includes('flames extinguish')));
});

test('getEffectiveAtk and getEffectiveDef correctly compute debuffs', () => {
  const weakened = [createStatusEffect('weakened', 2)];
  assert.equal(getEffectiveAtk(20, weakened), 14); // 20 * 0.7 = 14
  assert.equal(getEffectiveAtk(20, []), 20);

  const burned = [createStatusEffect('burned', 3)];
  assert.equal(getEffectiveDef(15, burned), 12); // 15 * 0.8 = 12
  assert.equal(getEffectiveDef(15, []), 15);
});

test('removeStatusEffect removes targeted ailment', () => {
  const list = [createStatusEffect('poisoned', 3), createStatusEffect('burned', 2)];
  const cleaned = removeStatusEffect(list, 'poisoned');

  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].type, 'burned');
});

test('createStatusEffect creates valid buff definitions', () => {
  const empower = createStatusEffect('empowered', 3);
  assert.equal(empower.type, 'empowered');
  assert.equal(empower.category, 'buff');
  assert.equal(empower.statModifier?.stat, 'atk');
  assert.equal(empower.statModifier?.multiplier, 1.4);

  const fortify = createStatusEffect('fortified', 3);
  assert.equal(fortify.type, 'fortified');
  assert.equal(fortify.category, 'buff');
  assert.equal(fortify.statModifier?.stat, 'def');
  assert.equal(fortify.statModifier?.multiplier, 1.5);

  const regen = createStatusEffect('regenerating', 3);
  assert.equal(regen.type, 'regenerating');
  assert.equal(regen.category, 'buff');
  assert.equal(regen.healPerTurn, 8);

  const hasten = createStatusEffect('hastened', 3);
  assert.equal(hasten.type, 'hastened');
  assert.equal(hasten.category, 'buff');
  assert.equal(hasten.statModifier?.stat, 'spd');
  assert.equal(hasten.statModifier?.multiplier, 1.4);

  const vuln = createStatusEffect('vulnerable', 2);
  assert.equal(vuln.type, 'vulnerable');
  assert.equal(vuln.category, 'debuff');
  assert.equal(vuln.statModifier?.stat, 'def');
  assert.equal(vuln.statModifier?.multiplier, 0.65);
});

test('getEffectiveAtk and getEffectiveDef correctly compute buffs', () => {
  const empowered = [createStatusEffect('empowered', 3)];
  assert.equal(getEffectiveAtk(20, empowered), 28); // 20 * 1.4 = 28

  const fortified = [createStatusEffect('fortified', 3)];
  assert.equal(getEffectiveDef(20, fortified), 30); // 20 * 1.5 = 30
});

test('processTurnStatusEffects applies regeneration healing', () => {
  const effects = [createStatusEffect('regenerating', 2)];
  const result = processTurnStatusEffects('Aster Vale', 50, 100, effects);

  assert.equal(result.totalHeal, 8);
  assert.equal(result.nextHp, 58);
  assert.equal(result.remainingEffects.length, 1);
  assert.equal(result.remainingEffects[0].type, 'regenerating');
  assert.ok(result.logs.some((l) => l.includes('from Regeneration')));
});
