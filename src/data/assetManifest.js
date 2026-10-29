export const SPRITE_FRAME_SIZE = Object.freeze({ width: 128, height: 128 });

export const ASSET_PATHS = Object.freeze({
  characters: Object.freeze({}),
  enemies: Object.freeze({
    ghostDancer: Object.freeze({ key: 'ghost-dancer', path: 'assets/enemies/ghost-dancer-idle.png', frameWidth: 64, frameHeight: 64, frameCount: 8 }),
    seaOctopus: Object.freeze({ key: 'sea-octopus', path: 'assets/enemies/sea-octopus-idle.png', frameWidth: 64, frameHeight: 64, frameCount: 8 }),
    mutantBird: Object.freeze({ key: 'mutant-bird', path: 'assets/enemies/mutant-bird.png' }),
    mutantFrog: Object.freeze({
      key: 'mutant-frog',
      path: 'assets/enemies/mutant-frog-idle.png',
      frameWidth: 128,
      frameHeight: 128,
      frameCount: 12,
      attackPath: 'assets/enemies/mutant-frog-attack.png',
      attackFrameWidth: 128,
      attackFrameHeight: 106,
      attackFrameCount: 21,
    }),
    goblin: Object.freeze({ key: 'goblin', path: 'assets/enemies/goblin.png' }),
    forgottenClown: Object.freeze({ key: 'forgotten-clown', path: 'assets/enemies/forgotten-clown.png' }),
    weakling: Object.freeze({ key: 'weakling', path: 'assets/enemies/weakling.png' }),
    armoredKnight: Object.freeze({ key: 'armored-knight', path: 'assets/enemies/armored-knight.png' }),
    greedChest: Object.freeze({ key: 'greed-chest', path: 'assets/enemies/greed-chest.png' }),
  }),
  bosses: Object.freeze({
    iceKing: Object.freeze({ key: 'ice-king', path: 'assets/bosses/ice-king-latest.png' }),
    dragonKing: Object.freeze({ key: 'dragon-king', path: 'assets/bosses/dragon-king-idle.png', frameWidth: 128, frameHeight: 128, frameCount: 8 }),
    serpentKing: Object.freeze({ key: 'serpent-king', path: 'assets/bosses/serpent-king-idle.png', frameWidth: 64, frameHeight: 64, frameCount: 8 }),
  }),
  tilesets: Object.freeze({}),
  backgrounds: Object.freeze({
    archive: Object.freeze({ key: 'battle-background-archive', path: 'assets/backgrounds/dungeon_arena.jpg' }),
    forest: Object.freeze({ key: 'battle-background-forest', path: 'assets/backgrounds/forest_arena.jpg' }),
    cave: Object.freeze({ key: 'battle-background-cave', path: 'assets/backgrounds/dungeon_arena.jpg' }),
  }),
  effects: Object.freeze({}),
  ui: Object.freeze({}),
  audio: Object.freeze({}),
});

export const ASSET_DIRECTORIES = Object.freeze([
  'assets/characters/',
  'assets/enemies/',
  'assets/bosses/',
  'assets/tilesets/',
  'assets/backgrounds/',
  'assets/effects/',
  'assets/ui/',
  'assets/audio/',
]);

export function getEnemyAsset(assetKey) {
  const match = Object.values(ASSET_PATHS.enemies).find((a) => a.key === assetKey)
    || Object.values(ASSET_PATHS.bosses).find((b) => b.key === assetKey);
  if (match) return match;
  return ASSET_PATHS.bosses.iceKing;
}

export function getBattleBackground(floorNumber = 1) {
  const floor = Number(floorNumber);
  switch (floor) {
    case 1:
      return ASSET_PATHS.backgrounds.archive;
    case 2:
      return ASSET_PATHS.backgrounds.archive;
    case 3:
      return ASSET_PATHS.backgrounds.cave;
    case 4:
      return ASSET_PATHS.backgrounds.forest;
    case 5:
      return ASSET_PATHS.backgrounds.cave;
    default:
      return ASSET_PATHS.backgrounds.archive;
  }
}