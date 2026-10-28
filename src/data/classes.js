const createClass = (id, name, role, stats, skills) => ({
  id,
  name,
  role,
  level: 1,
  baseStats: Object.freeze(stats),
  skills: Object.freeze(skills),
  equipment: [],
  statusEffects: [],
});

export const CLASS_TEMPLATES = Object.freeze({
  warrior: createClass('warrior', 'Warrior', 'Kiếm sĩ', {
    hp: 120, mp: 24, atk: 18, matk: 5, def: 13, mdef: 8, spd: 10,
  }, ['Power Strike', 'Iron Will']),
  guardian: createClass('guardian', 'Guardian', 'Tank', {
    hp: 155, mp: 28, atk: 12, matk: 4, def: 19, mdef: 12, spd: 6,
  }, ['Provoke', 'Bulwark']),
  ranger: createClass('ranger', 'Ranger', 'Cung thủ', {
    hp: 96, mp: 34, atk: 15, matk: 7, def: 8, mdef: 9, spd: 16,
  }, ['Quick Shot', 'Snare']),
  mage: createClass('mage', 'Mage', 'Pháp sư', {
    hp: 78, mp: 92, atk: 7, matk: 21, def: 6, mdef: 16, spd: 11,
  }, ['Ember', 'Frost Shard']),
  cleric: createClass('cleric', 'Cleric', 'Tu sĩ', {
    hp: 102, mp: 76, atk: 8, matk: 16, def: 9, mdef: 18, spd: 9,
  }, ['Mend', 'Sanctuary']),
});

export function createCharacter(classId, overrides = {}) {
  const template = CLASS_TEMPLATES[classId];
  if (!template) throw new Error(`Unknown class: ${classId}`);

  const stats = { ...template.baseStats, ...(overrides.stats ?? {}) };
  return {
    id: overrides.id ?? `${classId}-1`,
    name: overrides.name ?? template.name,
    classId,
    role: template.role,
    level: overrides.level ?? template.level,
    stats,
    currentHp: overrides.currentHp ?? stats.hp,
    currentMp: overrides.currentMp ?? stats.mp,
    skills: [...(overrides.skills ?? template.skills)],
    equipment: [...(overrides.equipment ?? template.equipment)],
    statusEffects: [...(overrides.statusEffects ?? template.statusEffects)],
  };
}