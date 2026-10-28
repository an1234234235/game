import { getFloorDefinition } from '../data/floors.js';

export function createProgressionState() {
  return {
    currentFloor: 1,
    unlockedFloors: [1],
    completedFloors: [],
    totalXp: 0,
    totalGold: 0,
    bestFloor: 1,
    lastReward: null,
  };
}

export function applyBattleRewards(state, reward = {}) {
  const progression = { ...(state.progression ?? createProgressionState()) };
  const xpGain = Number(reward.xp ?? 0);
  const goldGain = Number(reward.gold ?? 0);
  const nextPlayer = {
    ...(state.player ?? {}),
    experience: Number(state.player?.experience ?? 0) + xpGain,
    gold: Number(state.player?.gold ?? 0) + goldGain,
  };

  return {
    ...state,
    player: nextPlayer,
    progression: {
      ...progression,
      totalXp: (Number(progression.totalXp) ?? 0) + xpGain,
      totalGold: (Number(progression.totalGold) ?? 0) + goldGain,
      lastReward: {
        floor: reward.floor ?? progression.currentFloor,
        xp: xpGain,
        gold: goldGain,
      },
    },
  };
}

export function advanceFloor(state, clearedFloor = state?.progression?.currentFloor ?? 1) {
  const progression = { ...(state?.progression ?? createProgressionState()) };
  const nextFloor = Math.max(1, Number(clearedFloor) + 1);
  const unlocked = new Set(progression.unlockedFloors ?? [1]);
  unlocked.add(nextFloor);

  const nextState = {
    ...state,
    progression: {
      ...progression,
      currentFloor: nextFloor,
      unlockedFloors: [...unlocked].sort((a, b) => a - b),
      completedFloors: Array.from(new Set([...(progression.completedFloors ?? []), Number(clearedFloor)])),
      bestFloor: Math.max(progression.bestFloor ?? 1, nextFloor),
    },
    dungeon: {
      ...(state?.dungeon ?? {}),
      floor: nextFloor,
      playerX: 2,
      playerY: 2,
      enemyDefeated: false,
      defeatedEncounters: [],
    },
  };

  const definition = getFloorDefinition(nextFloor);
  nextState.dungeon.floorName = definition.name;
  return nextState;
}

export function getFloorReward(floorNumber = 1) {
  return getFloorDefinition(floorNumber).reward;
}
