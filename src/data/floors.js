export const FLOOR_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 1,
    floor: 1,
    name: 'The Sunken Archive',
    nameVi: 'Thư Viện Ngập Nước',
    description: 'A drowned archive of cracked stone, ancient book pillars, and restless echoes.',
    biome: 'archive',
    themeColor: '#4e7069',
    boss: 'ice-king',
    reward: Object.freeze({ xp: 45, gold: 30 }),
    startPos: Object.freeze({ x: 2, y: 2 }),
    bossPos: Object.freeze({ x: 11, y: 4 }),
    chests: Object.freeze([
      Object.freeze({ id: 'chest_4_6', x: 4, y: 6, gold: 35, item: 'potion', name: 'Rương Cổ Vật Ngập Nước' }),
    ]),
    shrines: Object.freeze([
      Object.freeze({ id: 'shrine_8_2', x: 8, y: 2, name: 'Đài Lửa Thư Viện Cổ' }),
    ]),
    walls: Object.freeze([
      // Perimeter
      '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0', '9,0', '10,0', '11,0', '12,0', '13,0',
      '0,1', '13,1', '0,2', '13,2', '0,3', '13,3', '0,4', '13,4', '0,5', '13,5', '0,6', '13,6', '0,7', '13,7',
      '0,8', '1,8', '2,8', '3,8', '4,8', '5,8', '6,8', '7,8', '8,8', '9,8', '10,8', '11,8', '12,8', '13,8',
      // Sunken pillars and book partitions
      '5,1', '5,2', '5,3', '5,5', '5,6',
      '8,4', '8,5', '8,6', '9,4',
    ]),
  }),
  Object.freeze({
    id: 2,
    floor: 2,
    name: 'Ashen Vaults',
    nameVi: 'Hầm Tro Núi Lửa',
    description: 'Blackened basalt corridors breathe glowing ash and subterranean heat.',
    biome: 'magma',
    themeColor: '#7a3f2d',
    boss: 'ember-warden',
    reward: Object.freeze({ xp: 65, gold: 45 }),
    startPos: Object.freeze({ x: 1, y: 6 }),
    bossPos: Object.freeze({ x: 11, y: 2 }),
    chests: Object.freeze([
      Object.freeze({ id: 'chest_1_2', x: 1, y: 2, gold: 50, item: 'potion', name: 'Rương Tro Hỏa Ngọc' }),
      Object.freeze({ id: 'chest_8_6', x: 8, y: 6, gold: 40, item: 'ether', name: 'Bảo Hòm Hỏa Viêm' }),
    ]),
    shrines: Object.freeze([
      Object.freeze({ id: 'shrine_6_4', x: 6, y: 4, name: 'Đài Tế Tro Hỏa Nguyện' }),
    ]),
    walls: Object.freeze([
      // Perimeter
      '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0', '9,0', '10,0', '11,0', '12,0', '13,0',
      '0,1', '13,1', '0,2', '13,2', '0,3', '13,3', '0,4', '13,4', '0,5', '13,5', '0,6', '13,6', '0,7', '13,7',
      '0,8', '1,8', '2,8', '3,8', '4,8', '5,8', '6,8', '7,8', '8,8', '9,8', '10,8', '11,8', '12,8', '13,8',
      // Volcanic rock ridges & magma vents
      '3,4', '3,5', '3,6', '3,7',
      '6,1', '6,2', '7,1', '7,2',
      '9,3', '9,4', '9,5', '10,5',
    ]),
  }),
  Object.freeze({
    id: 3,
    floor: 3,
    name: 'Frostglass Catacombs',
    nameVi: 'Hầm Mộ Băng Thủy Tinh',
    description: 'A maze of crystalline frost and blue rime stained with ancient sigils.',
    biome: 'ice',
    themeColor: '#3d617a',
    boss: 'frost-queen',
    reward: Object.freeze({ xp: 90, gold: 70 }),
    startPos: Object.freeze({ x: 2, y: 1 }),
    bossPos: Object.freeze({ x: 11, y: 6 }),
    chests: Object.freeze([
      Object.freeze({ id: 'chest_11_1', x: 11, y: 1, gold: 75, item: 'potion', name: 'Rương Băng Pha Lê' }),
      Object.freeze({ id: 'chest_5_6', x: 5, y: 6, gold: 60, item: 'elixir', name: 'Tráp Băng Cực Bắc' }),
    ]),
    shrines: Object.freeze([
      Object.freeze({ id: 'shrine_2_5', x: 2, y: 5, name: 'Tế Đàn Hàn Băng Vĩnh Cửu' }),
    ]),
    walls: Object.freeze([
      // Perimeter
      '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0', '9,0', '10,0', '11,0', '12,0', '13,0',
      '0,1', '13,1', '0,2', '13,2', '0,3', '13,3', '0,4', '13,4', '0,5', '13,5', '0,6', '13,6', '0,7', '13,7',
      '0,8', '1,8', '2,8', '3,8', '4,8', '5,8', '6,8', '7,8', '8,8', '9,8', '10,8', '11,8', '12,8', '13,8',
      // Glacial columns & ice corridors
      '4,1', '4,2', '4,3',
      '7,3', '7,4', '7,5', '8,3',
      '3,5', '3,6', '10,3', '10,4',
    ]),
  }),
  Object.freeze({
    id: 4,
    floor: 4,
    name: 'Root of the Hollow',
    nameVi: 'Cội Rễ Vực Sâu',
    description: 'Gigantic glowing tree roots pierce through stone, entwining dark chambers.',
    biome: 'roots',
    themeColor: '#365942',
    boss: 'thorn-sentinel',
    reward: Object.freeze({ xp: 120, gold: 100 }),
    startPos: Object.freeze({ x: 11, y: 1 }),
    bossPos: Object.freeze({ x: 2, y: 5 }),
    chests: Object.freeze([
      Object.freeze({ id: 'chest_3_1', x: 3, y: 1, gold: 100, item: 'potion', name: 'Rương Mộc Tinh' }),
      Object.freeze({ id: 'chest_11_6', x: 11, y: 6, gold: 90, item: 'tonic', name: 'Tráp Dược Thảo Cổ' }),
    ]),
    shrines: Object.freeze([
      Object.freeze({ id: 'shrine_6_4', x: 6, y: 4, name: 'Đài Cây Sự Sống Thần Bí' }),
    ]),
    walls: Object.freeze([
      // Perimeter
      '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0', '9,0', '10,0', '11,0', '12,0', '13,0',
      '0,1', '13,1', '0,2', '13,2', '0,3', '13,3', '0,4', '13,4', '0,5', '13,5', '0,6', '13,6', '0,7', '13,7',
      '0,8', '1,8', '2,8', '3,8', '4,8', '5,8', '6,8', '7,8', '8,8', '9,8', '10,8', '11,8', '12,8', '13,8',
      // Thick winding root walls
      '5,1', '5,2', '5,3', '5,4',
      '8,4', '8,5', '8,6', '8,7',
      '2,3', '3,3', '10,2', '10,3',
    ]),
  }),
  Object.freeze({
    id: 5,
    floor: 5,
    name: 'Crown of Lanternfall',
    nameVi: 'Vương Miện Lanternfall',
    description: 'The celestial throne room of white marble and astral lanterns.',
    biome: 'crown',
    themeColor: '#7a663d',
    boss: 'lantern-king',
    reward: Object.freeze({ xp: 180, gold: 150 }),
    startPos: Object.freeze({ x: 6, y: 7 }),
    bossPos: Object.freeze({ x: 6, y: 1 }),
    chests: Object.freeze([
      Object.freeze({ id: 'chest_2_3', x: 2, y: 3, gold: 150, item: 'potion', name: 'Kho Báu Hoàng Gia Tả' }),
      Object.freeze({ id: 'chest_11_3', x: 11, y: 3, gold: 150, item: 'elixir', name: 'Kho Báu Hoàng Gia Hữu' }),
    ]),
    shrines: Object.freeze([
      Object.freeze({ id: 'shrine_6_4', x: 6, y: 4, name: 'Đài Thánh Hỏa Hoàng Triều' }),
    ]),
    walls: Object.freeze([
      // Perimeter
      '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0', '9,0', '10,0', '11,0', '12,0', '13,0',
      '0,1', '13,1', '0,2', '13,2', '0,3', '13,3', '0,4', '13,4', '0,5', '13,5', '0,6', '13,6', '0,7', '13,7',
      '0,8', '1,8', '2,8', '3,8', '4,8', '5,8', '6,8', '7,8', '8,8', '9,8', '10,8', '11,8', '12,8', '13,8',
      // Imperial colonnade pillars flanking the red-carpet royal corridor
      '4,2', '4,3', '4,5', '4,6',
      '8,2', '8,3', '8,5', '8,6',
      '1,5', '2,5', '11,5', '12,5',
    ]),
  }),
]);

export function getFloorDefinition(floorNumber = 1) {
  return FLOOR_DEFINITIONS.find((floor) => floor.floor === Number(floorNumber)) ?? FLOOR_DEFINITIONS[0];
}

export function getFloorEncounters(floorNumber = 1) {
  const floor = getFloorDefinition(floorNumber);
  const bossCoord = floor.bossPos || { x: 10, y: 4 };

  // Generate floor-specific monster coordinates that fit each floor's unique geometry
  if (floor.floor === 1) {
    return [
      {
        id: `floor-1-wisp-west`, enemyId: 'cave-wisp', kind: 'monster', x: 7, y: 2,
        enemyIds: ['cave-wisp', 'goblin', 'mutant-bird', 'forgotten-clown', 'weakling'],
      },
      {
        id: `floor-1-octopus-east`, enemyId: 'sea-octopus', kind: 'monster', x: 10, y: 6,
        enemyIds: ['sea-octopus', 'mutant-frog', 'armored-knight', 'greed-chest', 'mutant-bird'],
      },
      { id: `floor-1-boss`, enemyId: floor.boss, kind: 'boss', x: bossCoord.x, y: bossCoord.y },
    ];
  } else if (floor.floor === 2) {
    return [
      {
        id: `floor-2-scavenger-north`, enemyId: 'goblin', kind: 'monster', x: 4, y: 2,
        enemyIds: ['goblin', 'mutant-bird', 'armored-knight'],
      },
      {
        id: `floor-2-crawler-south`, enemyId: 'greed-chest', kind: 'monster', x: 8, y: 3,
        enemyIds: ['greed-chest', 'armored-knight', 'goblin'],
      },
      { id: `floor-2-boss`, enemyId: floor.boss, kind: 'boss', x: bossCoord.x, y: bossCoord.y },
    ];
  } else if (floor.floor === 3) {
    return [
      {
        id: `floor-3-frost-dancer`, enemyId: 'ghost-dancer', kind: 'monster', x: 5, y: 2,
        enemyIds: ['ghost-dancer', 'sea-octopus', 'cave-wisp'],
      },
      {
        id: `floor-3-ice-golem`, enemyId: 'armored-knight', kind: 'monster', x: 8, y: 6,
        enemyIds: ['armored-knight', 'ghost-dancer', 'weakling'],
      },
      { id: `floor-3-boss`, enemyId: floor.boss, kind: 'boss', x: bossCoord.x, y: bossCoord.y },
    ];
  } else if (floor.floor === 4) {
    return [
      {
        id: `floor-4-thorn-crawler`, enemyId: 'mutant-frog', kind: 'monster', x: 7, y: 2,
        enemyIds: ['mutant-frog', 'mutant-bird', 'greed-chest'],
      },
      {
        id: `floor-4-shadow-stalker`, enemyId: 'mutant-bird', kind: 'monster', x: 4, y: 6,
        enemyIds: ['mutant-bird', 'sea-octopus', 'ghost-dancer'],
      },
      { id: `floor-4-boss`, enemyId: floor.boss, kind: 'boss', x: bossCoord.x, y: bossCoord.y },
    ];
  } else {
    // Floor 5
    return [
      {
        id: `floor-5-palace-knight`, enemyId: 'armored-knight', kind: 'monster', x: 3, y: 5,
        enemyIds: ['armored-knight', 'ghost-dancer', 'greed-chest'],
      },
      {
        id: `floor-5-astral-jester`, enemyId: 'forgotten-clown', kind: 'monster', x: 9, y: 5,
        enemyIds: ['forgotten-clown', 'armored-knight', 'mutant-bird'],
      },
      { id: `floor-5-boss`, enemyId: floor.boss, kind: 'boss', x: bossCoord.x, y: bossCoord.y },
    ];
  }
}

export function createEncounterEnemyGroup(encounter, random = Math.random) {
  if (encounter.kind === 'boss') return [encounter.enemyId];
  const count = Math.min(3, 1 + Math.floor(random() * 3));
  const pool = encounter.enemyIds?.length ? encounter.enemyIds : [encounter.enemyId];
  return Array.from({ length: count }, () => pool[Math.floor(random() * pool.length)]);
}
