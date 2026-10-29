import { createCharacter } from './classes.js';
import { getFloorDefinition } from './floors.js';
import { createProgressionState } from '../systems/ProgressionSystem.js';

export function createInitialGameState() {
  const player = createCharacter('warrior', { name: 'Aster Vale' });
  const floorDefinition = getFloorDefinition(1);

  return {
    gameTitle: 'Lanternfall',
    player: {
      ...player,
      experience: 0,
      gold: 0,
      level: 1,
      skillPoints: 3,
      unlockedSkills: { power_strike: 1 },
      skills: ['power_strike'],
    },
    skillPoints: 3,
    unlockedSkills: { power_strike: 1 },
    party: [
      createCharacter('warrior', { name: 'Aster Vale' }),
      createCharacter('ranger', { name: 'Lio Fen' }),
      createCharacter('mage', { name: 'Mira Sol' }),
    ],
    inventory: [{ id: 'potion', name: 'Potion', quantity: 3 }],
    progression: createProgressionState(),
    dungeon: {
      playerX: 2,
      playerY: 2,
      enemyDefeated: false,
      defeatedEncounters: [],
      floor: 1,
      floorName: floorDefinition.name,
    },
  };
}