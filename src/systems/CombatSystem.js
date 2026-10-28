import { ICE_KING } from '../data/enemies.js';

export const COMMANDS = Object.freeze(['Attack', 'Skill', 'Magic', 'Item', 'Guard', 'Run']);
export const MAX_ENEMIES_PER_BATTLE = 3;

function createEnemyState(enemy, index, duplicateIds) {
  return {
    id: enemy.id,
    instanceId: enemy.instanceId ?? (duplicateIds.has(enemy.id) ? `${enemy.id}-${index + 1}` : enemy.id),
    name: enemy.name,
    kind: enemy.kind ?? 'monster',
    level: enemy.level,
    hp: enemy.hp,
    maxHp: enemy.hp,
    atk: enemy.atk,
    def: enemy.def,
    matk: enemy.matk,
    mdef: enemy.mdef,
    spd: enemy.spd ?? 0,
    skills: [...(enemy.skills ?? [])],
    assetKey: enemy.assetKey,
  };
}

function makeInitiative(player, enemies) {
  return [
    { id: 'player', name: player.name, side: 'player', spd: player.spd },
    ...enemies.map((enemy) => ({ id: enemy.instanceId, name: enemy.name, side: 'enemy', spd: enemy.spd })),
  ].map((actor, order) => ({ ...actor, order }))
    .sort((left, right) => right.spd - left.spd
      || Number(right.side === 'player') - Number(left.side === 'player')
      || left.order - right.order)
    .map(({ order, ...actor }) => actor);
}

function isEnemyAlive(state, enemyId) {
  return state.enemies.some((enemy) => enemy.instanceId === enemyId && enemy.hp > 0);
}

function advanceInitiative(state) {
  const log = [...state.log];
  const livingEnemies = state.enemies.filter((enemy) => enemy.hp > 0);
  if (!livingEnemies.length) {
    return { ...state, result: 'victory', turn: 'result', currentActorId: null, log };
  }
  if (state.player.hp <= 0) {
    return { ...state, result: 'defeat', turn: 'result', currentActorId: null, log };
  }

  let index = state.initiativeIndex + 1;
  let round = state.round;
  if (index >= state.initiative.length) {
    round += 1;
    index = 0;
    const initiative = makeInitiative(state.player, livingEnemies);
    return {
      ...state,
      initiative,
      initiativeIndex: index,
      currentActorId: initiative[index].id,
      turn: initiative[index].side,
      round,
      actionLocked: false,
      guarding: false,
      selection: initiative[index].side === 'player' ? 'Choose an action.' : 'Enemy turn.',
    };
  }

  while (index < state.initiative.length) {
    const actor = state.initiative[index];
    if (actor.side === 'player' || isEnemyAlive(state, actor.id)) break;
    index += 1;
  }
  if (index >= state.initiative.length) {
    round += 1;
    index = 0;
    const initiative = makeInitiative(state.player, livingEnemies);
    return {
      ...state,
      initiative,
      initiativeIndex: index,
      currentActorId: initiative[index].id,
      turn: initiative[index].side,
      round,
      actionLocked: false,
      guarding: false,
      selection: initiative[index].side === 'player' ? 'Choose an action.' : 'Enemy turn.',
    };
  }

  const nextActor = state.initiative[index];
  return {
    ...state,
    initiativeIndex: index,
    currentActorId: nextActor.id,
    turn: nextActor.side,
    actionLocked: nextActor.side === 'enemy',
    selection: nextActor.side === 'player' ? 'Choose an action.' : `${nextActor.name}'s turn.`,
  };
}

export function createBattleState(player, enemyGroup = ICE_KING) {
  const enemyList = (Array.isArray(enemyGroup) ? enemyGroup : [enemyGroup]).slice(0, MAX_ENEMIES_PER_BATTLE);
  const idCounts = new Map();
  enemyList.forEach((enemy) => idCounts.set(enemy.id, (idCounts.get(enemy.id) ?? 0) + 1));
  const duplicateIds = new Set([...idCounts].filter(([, count]) => count > 1).map(([id]) => id));
  const battlePlayer = {
    name: player.name,
    hp: player.currentHp,
    maxHp: player.stats.hp,
    mp: player.currentMp,
    maxMp: player.stats.mp,
    atk: player.stats.atk,
    def: player.stats.def,
    spd: player.stats.spd ?? 0,
  };
  const enemies = enemyList.map((enemy, index) => createEnemyState(enemy, index, duplicateIds));
  const initiative = makeInitiative(battlePlayer, enemies);
  const firstActor = initiative[0];

  return {
    player: battlePlayer,
    enemies,
    turn: firstActor.side,
    currentActorId: firstActor.id,
    initiative,
    initiativeIndex: 0,
    actionLocked: firstActor.side === 'enemy',
    guarding: false,
    result: null,
    round: 1,
    log: [`${enemies.map((enemy) => enemy.name).join(', ')} block the way.`],
    selection: firstActor.side === 'player' ? 'Choose an action.' : `${firstActor.name} acts first.`,
    selectedEnemyId: enemies[0]?.instanceId ?? null,
  };
}

export function performPlayerAction(state, command, targetId = state.selectedEnemyId) {
  if (state.result) return state;
  if (state.player.hp <= 0) {
    return { ...state, result: 'defeat', turn: 'result', log: [...state.log, `${state.player.name} cannot act while defeated.`] };
  }
  if (!state.enemies.some((enemy) => enemy.hp > 0)) {
    return { ...state, result: 'victory', turn: 'result', log: [...state.log, 'Victory! The enemies fall.'] };
  }
  if (state.turn !== 'player' || state.currentActorId !== 'player' || state.actionLocked) return state;
  if (!COMMANDS.includes(command)) return state;

  const next = {
    ...state,
    player: { ...state.player },
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    log: [...state.log],
  };
  next.actionLocked = true;
  next.selection = `Selected: ${command}`;

  const target = next.enemies.find((enemy) => enemy.instanceId === targetId && enemy.hp > 0)
    ?? next.enemies.find((enemy) => enemy.hp > 0);
  if (command !== 'Guard' && command !== 'Item' && command !== 'Run' && !target) return state;

  switch (command) {
    case 'Attack': {
      const damage = Math.max(1, next.player.atk + 3 - Math.floor(target.def / 3));
      target.hp = Math.max(0, target.hp - damage);
      next.log.push(`${next.player.name} strikes ${target.name} for ${damage} damage.`);
      break;
    }
    case 'Skill': {
      const cost = 8;
      if (next.player.mp < cost) {
        next.log.push('Not enough MP for Power Strike. Turn forfeited.');
      } else {
        next.player.mp -= cost;
        const damage = Math.max(1, next.player.atk + 14 - Math.floor(target.def / 4));
        target.hp = Math.max(0, target.hp - damage);
        next.log.push(`Power Strike hits ${target.name} for ${damage} damage. (-${cost} MP)`);
      }
      break;
    }
    case 'Magic': {
      const cost = 12;
      if (next.player.mp < cost) {
        next.log.push('Not enough MP for Ember. Turn forfeited.');
      } else {
        next.player.mp -= cost;
        const damage = Math.max(1, 24 - Math.floor(target.mdef / 3));
        target.hp = Math.max(0, target.hp - damage);
        next.log.push(`Ember hits ${target.name} for ${damage} damage. (-${cost} MP)`);
      }
      break;
    }
    case 'Item': {
      const healed = Math.min(35, next.player.maxHp - next.player.hp);
      if (healed === 0) next.log.push('HP is already full. Turn forfeited.');
      else {
        next.player.hp += healed;
        next.log.push(`Potion restores ${healed} HP.`);
      }
      break;
    }
    case 'Guard':
      next.guarding = true;
      next.log.push(`${next.player.name} braces for the next attack.`);
      break;
    case 'Run':
      next.result = 'escaped';
      next.turn = 'result';
      next.log.push('You retreat from the encounter.');
      return next;
    default:
      return state;
  }

  if (!next.enemies.some((enemy) => enemy.hp > 0)) {
    next.result = 'victory';
    next.turn = 'result';
    next.log.push('Victory! All enemies fall.');
    return next;
  }
  if (!next.enemies.some((enemy) => enemy.instanceId === next.selectedEnemyId && enemy.hp > 0)) {
    next.selectedEnemyId = next.enemies.find((enemy) => enemy.hp > 0)?.instanceId ?? null;
  }
  return advanceInitiative(next);
}

export function performEnemyTurn(state) {
  if (state.result) return state;
  if (state.player.hp <= 0) {
    return { ...state, result: 'defeat', turn: 'result', log: [...state.log, `${state.player.name} has fallen.`] };
  }
  if (!state.enemies.some((enemy) => enemy.hp > 0)) {
    return { ...state, result: 'victory', turn: 'result', log: [...state.log, 'Victory! The enemies fall.'] };
  }
  if (state.turn !== 'enemy') return state;

  const actor = state.enemies.find((enemy) => enemy.instanceId === state.currentActorId && enemy.hp > 0);
  if (!actor) return advanceInitiative(state);

  const next = { ...state, player: { ...state.player }, enemies: state.enemies.map((enemy) => ({ ...enemy })), log: [...state.log] };
  const rawDamage = Math.max(1, actor.atk - Math.floor(next.player.def / 3));
  const damage = next.guarding ? Math.max(1, Math.floor(rawDamage / 2)) : rawDamage;
  next.guarding = false;
  next.player.hp = Math.max(0, next.player.hp - damage);
  next.log.push(`${actor.name} attacks ${next.player.name} for ${damage} damage.`);

  if (next.player.hp <= 0) {
    next.result = 'defeat';
    next.turn = 'result';
    next.log.push(`${next.player.name} falls. The dungeon grows quiet.`);
    return next;
  }
  return advanceInitiative(next);
}
