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

// Experience curve: Level increases require non-linearly more EXP
// Lv 1: 50 EXP, Lv 2: 125 EXP, Lv 3: 217 EXP, Lv 4: 321 EXP, Lv 5: 436 EXP, Lv 6: 562 EXP...
export function getRequiredExpForLevel(level = 1) {
  const lvl = Math.max(1, Number(level) || 1);
  return Math.floor(35 * Math.pow(lvl, 1.45) + 15 * lvl);
}

// Calculate battle EXP and Gold from defeated enemies based on level & boss kind
export function calculateMonsterRewards(enemies = [], floor = 1) {
  let totalXp = 0;
  let totalGold = 0;
  const breakdown = [];

  for (const enemy of enemies) {
    const lvl = Math.max(1, Number(enemy.level) || 1);
    const isBoss = enemy.kind === 'boss';
    let xp = 0;
    let gold = 0;

    if (isBoss) {
      xp = Math.round(lvl * 55 + floor * 30);
      gold = Math.round(lvl * 30 + floor * 20);
    } else {
      xp = Math.round(lvl * 20 + floor * 6);
      gold = Math.round(lvl * 12 + floor * 4);
    }

    totalXp += xp;
    totalGold += gold;
    breakdown.push({
      id: enemy.id || enemy.instanceId,
      name: enemy.name || 'Quái vật',
      level: lvl,
      isBoss,
      xp,
      gold,
    });
  }

  return {
    xp: Math.max(15, totalXp),
    gold: Math.max(10, totalGold),
    breakdown,
  };
}

// Passive stat boosts gained per rank of specific skills
export const SKILL_PASSIVES = {
  power_strike: { stat: 'atk', amount: 3 },
  shield_slam: { stat: 'def', amount: 3 },
  iron_will: { stat: 'hp', amount: 20 },
  arcane_intellect: { stat: 'matk', amount: 4 },
  mana_barrier: { stat: 'mp', amount: 25 },
  double_cleave: { stat: 'atk', amount: 4 },
  armor_shatter: { stat: 'atk', amount: 3 },
  berserker_trance: { stat: 'atk', amount: 6 },
  whirlwind_sweep: { stat: 'atk', amount: 4 },
  executioner_strike: { stat: 'atk', amount: 8 },
  ember_flare: { stat: 'matk', amount: 3 },
  frost_lance: { stat: 'matk', amount: 4 },
  thunder_strike: { stat: 'matk', amount: 5 },
  blizzard_storm: { stat: 'matk', amount: 6 },
  meteor_cataclysm: { stat: 'matk', amount: 10 },
  holy_smite: { stat: 'matk', amount: 3 },
  radiant_heal: { stat: 'hp', amount: 25 },
  divine_aegis: { stat: 'def', amount: 5 },
  blessed_resilience: { stat: 'mdef', amount: 5 },
  celestial_judgment: { stat: 'matk', amount: 8 },
  shadow_strike: { stat: 'atk', amount: 4 },
  poison_dart: { stat: 'spd', amount: 2 },
  smoke_screen: { stat: 'spd', amount: 3 },
  assassinate: { stat: 'atk', amount: 7 },
  blade_dance: { stat: 'spd', amount: 3 },
};

export function calculateSkillTreePassives(unlockedSkills = {}) {
  const totals = { hp: 0, mp: 0, atk: 0, matk: 0, def: 0, mdef: 0, spd: 0 };
  for (const [skillId, rank] of Object.entries(unlockedSkills)) {
    const numRank = Number(rank) || 0;
    const passive = SKILL_PASSIVES[skillId];
    if (passive && numRank > 0) {
      totals[passive.stat] = (totals[passive.stat] || 0) + passive.amount * numRank;
    }
  }
  return totals;
}

// Process player EXP gains, check level ups, award +2 SP per level and stat gains
export function processExperienceGain(player = {}, xpGain = 0) {
  let level = Math.max(1, Number(player.level) || 1);
  let currentExp = (Number(player.experience) || 0) + Number(xpGain);
  let skillPoints = Number(player.skillPoints) || 0;
  let levelsGained = 0;
  let spGained = 0;

  const baseStats = {
    ...(player.baseStats ?? player.stats ?? { hp: 120, mp: 24, atk: 18, matk: 5, def: 13, mdef: 8, spd: 10 }),
  };

  while (currentExp >= getRequiredExpForLevel(level)) {
    currentExp -= getRequiredExpForLevel(level);
    level += 1;
    levelsGained += 1;
    skillPoints += 2; // +2 Skill Points per level up
    spGained += 2;

    // Permanent stat improvements on level up
    baseStats.hp += 16;
    baseStats.mp += 6;
    baseStats.atk += 2;
    baseStats.matk += 2;
    baseStats.def += 1;
    baseStats.mdef += 1;
    if (level % 2 === 0) {
      baseStats.spd += 1;
    }
  }

  // Calculate effective stats including passive bonuses from skill tree
  const passives = calculateSkillTreePassives(player.unlockedSkills || {});
  const effectiveStats = {
    hp: baseStats.hp + (passives.hp || 0),
    mp: baseStats.mp + (passives.mp || 0),
    atk: baseStats.atk + (passives.atk || 0),
    matk: baseStats.matk + (passives.matk || 0),
    def: baseStats.def + (passives.def || 0),
    mdef: baseStats.mdef + (passives.mdef || 0),
    spd: baseStats.spd + (passives.spd || 0),
  };

  let currentHp = levelsGained > 0 ? effectiveStats.hp : Math.min(effectiveStats.hp, Number(player.currentHp) || effectiveStats.hp);
  let currentMp = levelsGained > 0 ? effectiveStats.mp : Math.min(effectiveStats.mp, Number(player.currentMp) || effectiveStats.mp);

  return {
    updatedPlayer: {
      ...player,
      level,
      experience: currentExp,
      skillPoints,
      baseStats,
      stats: effectiveStats,
      currentHp,
      currentMp,
    },
    levelsGained,
    spGained,
    newLevel: level,
  };
}

export function applyBattleRewards(state, reward = {}) {
  const progression = { ...(state.progression ?? createProgressionState()) };
  const xpGain = Number(reward.xp ?? 0);
  const goldGain = Number(reward.gold ?? 0);

  const { updatedPlayer, levelsGained, spGained, newLevel } = processExperienceGain(state.player ?? {}, xpGain);
  updatedPlayer.gold = Number(updatedPlayer.gold ?? 0) + goldGain;

  return {
    ...state,
    player: updatedPlayer,
    skillPoints: updatedPlayer.skillPoints,
    progression: {
      ...progression,
      totalXp: (Number(progression.totalXp) ?? 0) + xpGain,
      totalGold: (Number(progression.totalGold) ?? 0) + goldGain,
      lastReward: {
        floor: reward.floor ?? progression.currentFloor,
        xp: xpGain,
        gold: goldGain,
        levelsGained,
        spGained,
        newLevel,
        breakdown: reward.breakdown ?? [],
      },
    },
  };
}

export function advanceFloor(state, clearedFloor = state?.progression?.currentFloor ?? 1) {
  const progression = { ...(state?.progression ?? createProgressionState()) };
  const nextFloor = Math.max(1, Number(clearedFloor) + 1);
  const unlocked = new Set(progression.unlockedFloors ?? [1]);
  unlocked.add(nextFloor);

  const numericFloor = Number(clearedFloor);
  const wasCompleted = (progression.completedFloors ?? []).includes(numericFloor);
  const spBonus = wasCompleted ? 0 : 3;
  const currentSp = Number(state?.player?.skillPoints ?? state?.skillPoints ?? 0);
  const newSp = currentSp + spBonus;

  const nextCompleted = Array.from(new Set([...(progression.completedFloors ?? []), numericFloor]));

  const nextPlayer = {
    ...(state?.player ?? {}),
    skillPoints: newSp,
    unlockedSkills: state?.player?.unlockedSkills ?? state?.unlockedSkills ?? { power_strike: 1 },
  };

  const nextState = {
    ...state,
    player: nextPlayer,
    skillPoints: newSp,
    unlockedSkills: nextPlayer.unlockedSkills,
    progression: {
      ...progression,
      currentFloor: nextFloor,
      unlockedFloors: [...unlocked].sort((a, b) => a - b),
      completedFloors: nextCompleted,
      bestFloor: Math.max(progression.bestFloor ?? 1, nextFloor),
      lastReward: {
        floor: numericFloor,
        xp: progression.lastReward?.xp ?? 0,
        gold: progression.lastReward?.gold ?? 0,
        skillPoints: spBonus,
      },
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

export function unlockOrUpgradeSkill(state, skillId, cost = 1) {
  const currentSp = Number(state?.player?.skillPoints ?? state?.skillPoints ?? 0);
  if (currentSp < cost) return state;

  const currentUnlocked = {
    ...(state?.player?.unlockedSkills ?? state?.unlockedSkills ?? { power_strike: 1 }),
  };
  const currentRank = Number(currentUnlocked[skillId] ?? 0);
  const nextRank = currentRank + 1;
  currentUnlocked[skillId] = nextRank;

  const currentSkills = Array.isArray(state?.player?.skills) ? [...state.player.skills] : ['power_strike'];
  if (!currentSkills.includes(skillId)) {
    currentSkills.push(skillId);
  }

  const nextSp = currentSp - cost;

  // Recompute stats with passives
  const baseStats = {
    ...(state?.player?.baseStats ?? state?.player?.stats ?? { hp: 120, mp: 24, atk: 18, matk: 5, def: 13, mdef: 8, spd: 10 }),
  };
  const passives = calculateSkillTreePassives(currentUnlocked);
  const effectiveStats = {
    hp: baseStats.hp + (passives.hp || 0),
    mp: baseStats.mp + (passives.mp || 0),
    atk: baseStats.atk + (passives.atk || 0),
    matk: baseStats.matk + (passives.matk || 0),
    def: baseStats.def + (passives.def || 0),
    mdef: baseStats.mdef + (passives.mdef || 0),
    spd: baseStats.spd + (passives.spd || 0),
  };

  const nextPlayer = {
    ...(state?.player ?? {}),
    skillPoints: nextSp,
    unlockedSkills: currentUnlocked,
    skills: currentSkills,
    baseStats,
    stats: effectiveStats,
    currentHp: Math.min(effectiveStats.hp, Number(state?.player?.currentHp) || effectiveStats.hp),
    currentMp: Math.min(effectiveStats.mp, Number(state?.player?.currentMp) || effectiveStats.mp),
  };

  return {
    ...state,
    player: nextPlayer,
    skillPoints: nextSp,
    unlockedSkills: currentUnlocked,
  };
}

export function resetSkillTreeState(state) {
  const currentUnlocked = {
    ...(state?.player?.unlockedSkills ?? state?.unlockedSkills ?? { power_strike: 1 }),
  };

  // Calculate total refunded SP (1 SP per rank purchased beyond starting power_strike rank 1)
  let totalRefund = 0;
  for (const [id, rank] of Object.entries(currentUnlocked)) {
    if (id === 'power_strike') {
      if (rank > 1) {
        totalRefund += rank - 1;
      }
    } else {
      totalRefund += Number(rank) || 0;
    }
  }

  const currentSp = Number(state?.player?.skillPoints ?? state?.skillPoints ?? 0);
  const nextSp = currentSp + totalRefund;
  const resetUnlocked = { power_strike: 1 };
  const resetSkills = ['power_strike'];

  // Restore base stats with only power_strike rank 1 passive
  const baseStats = {
    ...(state?.player?.baseStats ?? state?.player?.stats ?? { hp: 120, mp: 24, atk: 18, matk: 5, def: 13, mdef: 8, spd: 10 }),
  };
  const passives = calculateSkillTreePassives(resetUnlocked);
  const effectiveStats = {
    hp: baseStats.hp + (passives.hp || 0),
    mp: baseStats.mp + (passives.mp || 0),
    atk: baseStats.atk + (passives.atk || 0),
    matk: baseStats.matk + (passives.matk || 0),
    def: baseStats.def + (passives.def || 0),
    mdef: baseStats.mdef + (passives.mdef || 0),
    spd: baseStats.spd + (passives.spd || 0),
  };

  const nextPlayer = {
    ...(state?.player ?? {}),
    skillPoints: nextSp,
    unlockedSkills: resetUnlocked,
    skills: resetSkills,
    baseStats,
    stats: effectiveStats,
    currentHp: Math.min(effectiveStats.hp, Number(state?.player?.currentHp) || effectiveStats.hp),
    currentMp: Math.min(effectiveStats.mp, Number(state?.player?.currentMp) || effectiveStats.mp),
  };

  return {
    ...state,
    player: nextPlayer,
    skillPoints: nextSp,
    unlockedSkills: resetUnlocked,
  };
}
