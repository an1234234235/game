export type StatusCategory = 'buff' | 'debuff';

export type StatusType =
  | 'poisoned'
  | 'burned'
  | 'weakened'
  | 'vulnerable'
  | 'empowered'
  | 'fortified'
  | 'regenerating'
  | 'hastened';

export interface ActiveStatusEffect {
  id: string;
  type: StatusType;
  category: StatusCategory;
  name: string;
  duration: number;
  damagePerTurn?: number;
  healPerTurn?: number;
  statModifier?: {
    stat: 'atk' | 'def' | 'spd';
    multiplier: number;
  };
  description: string;
}

export function createStatusEffect(type: StatusType, duration?: number): ActiveStatusEffect {
  const uniqueId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  switch (type) {
    // --- DEBUFFS ---
    case 'poisoned':
      return {
        id: uniqueId,
        type: 'poisoned',
        category: 'debuff',
        name: 'Poisoned',
        duration: duration ?? 3,
        damagePerTurn: 7,
        description: 'Suffers 7 toxic damage at the start of each turn.',
      };
    case 'burned':
      return {
        id: uniqueId,
        type: 'burned',
        category: 'debuff',
        name: 'Burned',
        duration: duration ?? 3,
        damagePerTurn: 9,
        statModifier: {
          stat: 'def',
          multiplier: 0.8,
        },
        description: 'Scorched by flame: takes 9 damage each turn and defense is reduced by 20%.',
      };
    case 'weakened':
      return {
        id: uniqueId,
        type: 'weakened',
        category: 'debuff',
        name: 'Weakened',
        duration: duration ?? 2,
        statModifier: {
          stat: 'atk',
          multiplier: 0.7,
        },
        description: 'Enfeebled stance: physical and magical attack power is reduced by 30%.',
      };
    case 'vulnerable':
      return {
        id: uniqueId,
        type: 'vulnerable',
        category: 'debuff',
        name: 'Vulnerable',
        duration: duration ?? 2,
        statModifier: {
          stat: 'def',
          multiplier: 0.65,
        },
        description: 'Armor sundered: takes increased damage; defense is reduced by 35%.',
      };

    // --- BUFFS ---
    case 'empowered':
      return {
        id: uniqueId,
        type: 'empowered',
        category: 'buff',
        name: 'Empowered',
        duration: duration ?? 3,
        statModifier: {
          stat: 'atk',
          multiplier: 1.4,
        },
        description: 'Surging battle spirit: attack power is amplified by +40%.',
      };
    case 'fortified':
      return {
        id: uniqueId,
        type: 'fortified',
        category: 'buff',
        name: 'Fortified',
        duration: duration ?? 3,
        statModifier: {
          stat: 'def',
          multiplier: 1.5,
        },
        description: 'Hardened bulwark: defense is fortified by +50%.',
      };
    case 'regenerating':
      return {
        id: uniqueId,
        type: 'regenerating',
        category: 'buff',
        name: 'Regen',
        duration: duration ?? 3,
        healPerTurn: 8,
        description: 'Soothing rejuvenation: recovers 8 HP at the start of each turn.',
      };
    case 'hastened':
      return {
        id: uniqueId,
        type: 'hastened',
        category: 'buff',
        name: 'Hastened',
        duration: duration ?? 3,
        statModifier: {
          stat: 'spd',
          multiplier: 1.4,
        },
        description: 'Swift velocity: speed and initiative priority are elevated by +40%.',
      };
  }
}

/**
 * Apply or refresh a status effect on an active list
 */
export function addOrRefreshStatusEffect(
  list: ActiveStatusEffect[] = [],
  newEffect: ActiveStatusEffect
): { updatedList: ActiveStatusEffect[]; wasApplied: boolean; message: string } {
  const existingIdx = list.findIndex((e) => e.type === newEffect.type);

  if (existingIdx >= 0) {
    const existing = list[existingIdx];
    // Refresh to longer duration if incoming is longer
    const updatedEffect: ActiveStatusEffect = {
      ...existing,
      duration: Math.max(existing.duration, newEffect.duration),
    };
    const updatedList = [...list];
    updatedList[existingIdx] = updatedEffect;
    return {
      updatedList,
      wasApplied: true,
      message: `${newEffect.name} duration refreshed (${updatedEffect.duration} turns).`,
    };
  }

  return {
    updatedList: [...list, newEffect],
    wasApplied: true,
    message: `${newEffect.category === 'buff' ? 'Gained' : 'Inflicted with'} ${newEffect.name} (${newEffect.duration} turns)!`,
  };
}

/**
 * Remove specific status effect by type
 */
export function removeStatusEffect(
  list: ActiveStatusEffect[] = [],
  type: StatusType
): ActiveStatusEffect[] {
  return list.filter((e) => e.type !== type);
}

/**
 * Purge only negative status debuffs (keeps beneficial buffs)
 */
export function removeDebuffs(list: ActiveStatusEffect[] = []): ActiveStatusEffect[] {
  return list.filter((e) => e.category !== 'debuff');
}

/**
 * Purge only buffs
 */
export function removeBuffs(list: ActiveStatusEffect[] = []): ActiveStatusEffect[] {
  return list.filter((e) => e.category !== 'buff');
}

/**
 * Clear all status effects
 */
export function clearAllStatusEffects(): ActiveStatusEffect[] {
  return [];
}

/**
 * Calculate effective ATK taking stat modifiers into account
 */
export function getEffectiveAtk(baseAtk: number, effects: ActiveStatusEffect[] = []): number {
  let multiplier = 1.0;
  for (const effect of effects) {
    if (effect.statModifier?.stat === 'atk') {
      multiplier *= effect.statModifier.multiplier;
    }
  }
  return Math.max(1, Math.floor(baseAtk * multiplier));
}

/**
 * Calculate effective DEF taking stat modifiers into account
 */
export function getEffectiveDef(baseDef: number, effects: ActiveStatusEffect[] = []): number {
  let multiplier = 1.0;
  for (const effect of effects) {
    if (effect.statModifier?.stat === 'def') {
      multiplier *= effect.statModifier.multiplier;
    }
  }
  return Math.max(0, Math.floor(baseDef * multiplier));
}

/**
 * Calculate effective SPD taking stat modifiers into account
 */
export function getEffectiveSpd(baseSpd: number, effects: ActiveStatusEffect[] = []): number {
  let multiplier = 1.0;
  for (const effect of effects) {
    if (effect.statModifier?.stat === 'spd') {
      multiplier *= effect.statModifier.multiplier;
    }
  }
  return Math.max(1, Math.floor(baseSpd * multiplier));
}

/**
 * Process status effects at the start of an actor's turn.
 * Ticks damage (poison/burn), healing (regeneration), decrements duration, and logs expirations.
 */
export function processTurnStatusEffects(
  actorName: string,
  currentHp: number,
  maxHp: number,
  effects: ActiveStatusEffect[] = []
): {
  nextHp: number;
  totalDamage: number;
  damage: number;
  totalHeal: number;
  heal: number;
  remainingEffects: ActiveStatusEffect[];
  logs: string[];
} {
  let nextHp = currentHp;
  let totalDamage = 0;
  let totalHeal = 0;
  const remainingEffects: ActiveStatusEffect[] = [];
  const logs: string[] = [];

  for (const effect of effects) {
    // 1. Apply damage per turn (DoT - Poison / Burn)
    if (effect.damagePerTurn && effect.damagePerTurn > 0 && nextHp > 0) {
      const dmg = Math.min(nextHp, effect.damagePerTurn);
      nextHp = Math.max(0, nextHp - dmg);
      totalDamage += dmg;

      if (effect.type === 'poisoned') {
        logs.push(`☠️ ${actorName} suffers ${dmg} Poison damage!`);
      } else if (effect.type === 'burned') {
        logs.push(`🔥 ${actorName} takes ${dmg} Burn damage!`);
      } else {
        logs.push(`${actorName} suffers ${dmg} status damage!`);
      }
    }

    // 2. Apply healing per turn (HoT - Regeneration)
    if (effect.healPerTurn && effect.healPerTurn > 0 && nextHp > 0 && nextHp < maxHp) {
      const recovered = Math.min(effect.healPerTurn, maxHp - nextHp);
      nextHp += recovered;
      totalHeal += recovered;
      logs.push(`🌿 ${actorName} recovers ${recovered} HP from Regeneration!`);
    }

    // 3. Decrement duration
    const remainingTurns = effect.duration - 1;
    if (remainingTurns > 0) {
      remainingEffects.push({
        ...effect,
        duration: remainingTurns,
      });
    } else {
      // Effect expired logs
      if (effect.type === 'poisoned') {
        logs.push(`The venom dissipates from ${actorName}.`);
      } else if (effect.type === 'burned') {
        logs.push(`The flames extinguish on ${actorName}.`);
      } else if (effect.type === 'weakened') {
        logs.push(`${actorName} regains their normal strength.`);
      } else if (effect.type === 'vulnerable') {
        logs.push(`${actorName}'s armor defenses are restored.`);
      } else if (effect.type === 'empowered') {
        logs.push(`The surge of empowered strength fades from ${actorName}.`);
      } else if (effect.type === 'fortified') {
        logs.push(`The fortified barrier fades from ${actorName}.`);
      } else if (effect.type === 'regenerating') {
        logs.push(`The regenerative glow fades from ${actorName}.`);
      } else if (effect.type === 'hastened') {
        logs.push(`${actorName}'s heightened speed returns to normal.`);
      }
    }
  }

  return {
    nextHp,
    totalDamage,
    damage: totalDamage,
    totalHeal,
    heal: totalHeal,
    remainingEffects,
    logs,
  };
}
