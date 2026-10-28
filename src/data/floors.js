export const FLOOR_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 1,
    floor: 1,
    name: 'The Sunken Archive',
    description: 'A drowned archive of cracked stone and restless echoes.',
    boss: 'ice-king',
    reward: Object.freeze({ xp: 45, gold: 30 }),
  }),
  Object.freeze({
    id: 2,
    floor: 2,
    name: 'Ashen Vaults',
    description: 'Blackened halls breathe ash and old enchantments.',
    boss: 'ember-warden',
    reward: Object.freeze({ xp: 65, gold: 45 }),
  }),
  Object.freeze({
    id: 3,
    floor: 3,
    name: 'Frostglass Catacombs',
    description: 'A maze of ice stained with old prayers and broken sigils.',
    boss: 'frost-queen',
    reward: Object.freeze({ xp: 90, gold: 70 }),
  }),
  Object.freeze({
    id: 4,
    floor: 4,
    name: 'Root of the Hollow',
    description: 'Deep roots twist through the mountain and swallow sound.',
    boss: 'thorn-sentinel',
    reward: Object.freeze({ xp: 120, gold: 100 }),
  }),
  Object.freeze({
    id: 5,
    floor: 5,
    name: 'Crown of Lanternfall',
    description: 'The final ascent beneath a ruined moonlit throne.',
    boss: 'lantern-king',
    reward: Object.freeze({ xp: 180, gold: 150 }),
  }),
]);

export function getFloorDefinition(floorNumber = 1) {
  return FLOOR_DEFINITIONS.find((floor) => floor.floor === Number(floorNumber)) ?? FLOOR_DEFINITIONS[0];
}

export function getFloorEncounters(floorNumber = 1) {
  const floor = getFloorDefinition(floorNumber);
  return [
    {
      id: `floor-${floor.floor}-wisp-west`, enemyId: 'cave-wisp', kind: 'monster', x: 7, y: 2,
      enemyIds: ['cave-wisp', 'goblin', 'mutant-bird', 'forgotten-clown', 'weakling'],
    },
    {
      id: `floor-${floor.floor}-octopus-east`, enemyId: 'sea-octopus', kind: 'monster', x: 10, y: 6,
      enemyIds: ['sea-octopus', 'mutant-frog', 'armored-knight', 'greed-chest', 'mutant-bird'],
    },
    { id: `floor-${floor.floor}-boss`, enemyId: floor.boss, kind: 'boss', x: 10, y: 4 },
  ];
}

export function createEncounterEnemyGroup(encounter, random = Math.random) {
  if (encounter.kind === 'boss') return [encounter.enemyId];
  const count = Math.min(3, 1 + Math.floor(random() * 3));
  const pool = encounter.enemyIds?.length ? encounter.enemyIds : [encounter.enemyId];
  return Array.from({ length: count }, () => pool[Math.floor(random() * pool.length)]);
}
