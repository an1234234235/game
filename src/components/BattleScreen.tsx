import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, FloorEncounter, EnemyTemplate, BattleState, ActiveStatusEffect } from '../types/game';
import { createBattleState, performPlayerAction, performEnemyTurn, COMMANDS } from '../systems/CombatSystem';
import {
  applyBattleRewards,
  getFloorReward,
  calculateMonsterRewards,
  getRequiredExpForLevel,
} from '../systems/ProgressionSystem';
import { saveGameState } from '../systems/SaveSystem';
import { getFloorDefinition } from '../data/floors';
import { SkillTreeModal } from './Modals/SkillTreeModal';
import {
  createStatusEffect,
  addOrRefreshStatusEffect,
  processTurnStatusEffects,
  getEffectiveAtk,
  getEffectiveDef,
  getEffectiveSpd,
  removeStatusEffect,
  removeDebuffs,
} from '../systems/StatusEffectSystem';
import { AnimatedSprite } from './AnimatedSprite';
import { StatusBadge } from './StatusBadge';
import { PWAInstallButton } from './PWAInstallButton';
import { getBattleBackground } from '../data/assetManifest.js';
import { SkillGrimoireModal } from './Modals/SkillGrimoireModal';
import { SKILL_LIBRARY, SkillDefinition } from '../data/skills';
import {
  Flame,
  Biohazard,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Swords,
  HeartPulse,
  Zap,
  BookOpen,
  Shield,
  Package,
  Flag,
} from 'lucide-react';
import { SoundSystem } from '../systems/SoundSystem';

interface FloatingNumber {
  id: number;
  text: string;
  color: string;
  targetId: 'player' | string;
  isCrit?: boolean;
}

interface BattleScreenProps {
  gameState: GameState;
  encounter: FloorEncounter;
  enemyGroup: EnemyTemplate[];
  onUpdateGameState: (state: GameState) => void;
  onReturnToDungeon: () => void;
  onFloorCleared: (reward: { xp: number; gold: number }) => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  gameState,
  encounter,
  enemyGroup,
  onUpdateGameState,
  onReturnToDungeon,
  onFloorCleared,
}) => {
  const [battle, setBattle] = useState<BattleState>(() => {
    const initial = createBattleState(gameState.player, enemyGroup.length ? enemyGroup : undefined);
    return {
      ...initial,
      player: {
        ...initial.player,
        statusEffects: [],
      },
      enemies: initial.enemies.map((e) => ({
        ...e,
        statusEffects: [],
      })),
    };
  });

  const floorNumber = gameState.dungeon.floor ?? 1;
  const floorDef = useMemo(() => getFloorDefinition(floorNumber), [floorNumber]);
  const enemyTurnTimeoutRef = useRef<number | null>(null);
  const lastTickedStepRef = useRef<string>('');

  const [isMuted, setIsMuted] = useState(() => SoundSystem.getMuted());
  const [isShaking, setIsShaking] = useState(false);
  const [showPartySkills, setShowPartySkills] = useState(false);
  const [showSkillGrimoire, setShowSkillGrimoire] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingNumber[]>([]);

  const victoryRewards = useMemo(() => {
    return calculateMonsterRewards(battle.enemies, floorNumber);
  }, [battle.enemies, floorNumber]);

  // Spawn floating combat damage / heal popups
  const spawnFloatingText = useCallback(
    (text: string, color: string, targetId: 'player' | string, isCrit = false) => {
      const id = Date.now() + Math.random();
      setFloatingTexts((prev) => [...prev, { id, text, color, targetId, isCrit }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 1100);
    },
    []
  );

  // Turn-start status effect processing hook
  useEffect(() => {
    if (battle.result) return;

    const currentKey = `${battle.round}-${battle.initiativeIndex}-${battle.currentActorId}`;
    if (lastTickedStepRef.current === currentKey) return;
    lastTickedStepRef.current = currentKey;

    // 1. Process player's status effects at the start of player turn
    if (battle.turn === 'player' && battle.currentActorId === 'player') {
      const playerEffects = battle.player.statusEffects || [];
      if (playerEffects.length > 0) {
        const result = processTurnStatusEffects(
          battle.player.name,
          battle.player.hp,
          battle.player.maxHp,
          playerEffects
        );

        if (result.damage > 0) {
          SoundSystem.playStatusTick();
          spawnFloatingText(`-${result.damage} HP`, '#b48fe0', 'player');
        }
        if (result.heal > 0) {
          SoundSystem.playHeal();
          spawnFloatingText(`+${result.heal} HP`, '#56d364', 'player');
        }

        setBattle((prev) => {
          const isDefeated = result.nextHp <= 0;
          if (isDefeated) {
            SoundSystem.playDefeat();
          }
          return {
            ...prev,
            player: {
              ...prev.player,
              hp: result.nextHp,
              statusEffects: result.remainingEffects,
            },
            log: [
              ...prev.log,
              ...result.logs,
              ...(isDefeated ? [`${prev.player.name} gục ngã vì hiệu ứng bất lợi.`] : []),
            ],
            result: isDefeated ? 'defeat' : prev.result,
            turn: isDefeated ? 'result' : prev.turn,
          };
        });
      }
    }

    // 2. Process active enemy's status effects at the start of enemy turn
    if (battle.turn === 'enemy' && battle.currentActorId) {
      const activeEnemy = battle.enemies.find(
        (e) => e.instanceId === battle.currentActorId && e.hp > 0
      );

      if (activeEnemy && activeEnemy.statusEffects && activeEnemy.statusEffects.length > 0) {
        const result = processTurnStatusEffects(
          activeEnemy.name,
          activeEnemy.hp,
          activeEnemy.maxHp,
          activeEnemy.statusEffects
        );

        if (result.damage > 0) {
          SoundSystem.playStatusTick();
          spawnFloatingText(`-${result.damage} HP`, '#e87d56', activeEnemy.instanceId);
        }
        if (result.heal > 0) {
          spawnFloatingText(`+${result.heal} HP`, '#56d364', activeEnemy.instanceId);
        }

        setBattle((prev) => {
          const updatedEnemies = prev.enemies.map((e) =>
            e.instanceId === activeEnemy.instanceId
              ? {
                  ...e,
                  hp: result.nextHp,
                  statusEffects: result.remainingEffects,
                }
              : e
          );

          const livingEnemies = updatedEnemies.filter((e) => e.hp > 0);
          const isVictory = livingEnemies.length === 0;

          if (isVictory) {
            SoundSystem.playVictory();
          }

          return {
            ...prev,
            enemies: updatedEnemies,
            log: [
              ...prev.log,
              ...result.logs,
              ...(result.nextHp <= 0 ? [`${activeEnemy.name} đã bị tiêu diệt bởi sát thương liên tục!`] : []),
              ...(isVictory ? ['Chiến thắng! Toàn bộ quái vật đã bị đánh bại.'] : []),
            ],
            result: isVictory ? 'victory' : prev.result,
            turn: isVictory ? 'result' : prev.turn,
          };
        });
      }
    }
  }, [battle.turn, battle.round, battle.initiativeIndex, battle.currentActorId, battle.result, spawnFloatingText]);

  // Auto-run enemy turns when it's their turn
  useEffect(() => {
    if (battle.result || battle.turn !== 'enemy') return;

    enemyTurnTimeoutRef.current = window.setTimeout(() => {
      setBattle((prevBattle) => {
        if (prevBattle.result || prevBattle.turn !== 'enemy') return prevBattle;

        const actor = prevBattle.enemies.find(
          (enemy) => enemy.instanceId === prevBattle.currentActorId && enemy.hp > 0
        );

        if (!actor) {
          return performEnemyTurn(prevBattle);
        }

        // Apply Weakened multiplier to enemy's attack
        const effectiveAtk = getEffectiveAtk(actor.atk, actor.statusEffects || []);
        const effectiveDef = getEffectiveDef(prevBattle.player.def, prevBattle.player.statusEffects || []);
        const rawDamage = Math.max(1, effectiveAtk - Math.floor(effectiveDef / 3));
        const wasGuarding = prevBattle.guarding;
        const damage = wasGuarding ? Math.max(1, Math.floor(rawDamage / 2)) : rawDamage;

        // Perform standard enemy turn through combat engine
        const nextBattle = performEnemyTurn(prevBattle);

        // Adjust damage to respect effective stats
        const adjustedPlayerHp = Math.max(0, prevBattle.player.hp - damage);
        nextBattle.player.hp = adjustedPlayerHp;

        // Visual feedback & audio
        SoundSystem.playHit();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 320);

        if (wasGuarding) {
          spawnFloatingText(`🛡️ CHẶN ĐÒN -${damage}`, '#79c0ff', 'player');
          nextBattle.log.push(`🛡️ Aster Vale dùng khiên vững chắc chặn đứng đòn đánh của ${actor.name}, giảm 50% sát thương (-${damage} HP)!`);
        } else {
          spawnFloatingText(`-${damage}`, '#d36e61', 'player');
        }

        // Enemy self-buffing logic (Enrage & Defensive shields)
        let updatedEnemyEffects = [...(actor.statusEffects || [])];
        let enemyBuffMsg = '';
        if (actor.hp <= actor.maxHp * 0.55 && !updatedEnemyEffects.some((e) => e.type === 'empowered')) {
          if (Math.random() < 0.5) {
            const empower = createStatusEffect('empowered', 3);
            const res = addOrRefreshStatusEffect(updatedEnemyEffects, empower);
            updatedEnemyEffects = res.updatedList;
            enemyBuffMsg = `⚡ ${actor.name} nổi cơn thịnh nộ cuồng bạo! (Tăng Lực: +40% Công trong 3 lượt)`;
            spawnFloatingText('⚔️ CUỒNG NỘ', '#ffd666', actor.instanceId);
            SoundSystem.playSkill();
          }
        } else if (actor.kind === 'boss' && actor.hp <= actor.maxHp * 0.35 && !updatedEnemyEffects.some((e) => e.type === 'fortified')) {
          const fortify = createStatusEffect('fortified', 3);
          const res = addOrRefreshStatusEffect(updatedEnemyEffects, fortify);
          updatedEnemyEffects = res.updatedList;
          enemyBuffMsg = `🛡️ ${actor.name} triệu hồi lớp giáp cổ xưa! (Kiên Cố: +50% Thủ trong 3 lượt)`;
          spawnFloatingText('🛡️ KIÊN CỐ', '#79c0ff', actor.instanceId);
          SoundSystem.playGuard();
        }

        // Apply enemy effects update
        if (enemyBuffMsg) {
          nextBattle.enemies = nextBattle.enemies.map((e) =>
            e.instanceId === actor.instanceId ? { ...e, statusEffects: updatedEnemyEffects } : e
          );
          nextBattle.log.push(enemyBuffMsg);
        }

        // Enemy chance to inflict debuff
        if (adjustedPlayerHp > 0 && Math.random() < 0.28) {
          let debuffToInflict = null;
          let debuffMsg = '';

          if (actor.skills.some((s) => s.toLowerCase().includes('frost') || s.toLowerCase().includes('ice'))) {
            debuffToInflict = createStatusEffect('weakened', 2);
            debuffMsg = `❄️ Đòn đánh băng giá của ${actor.name} làm tê cóng Aster Vale! (-30% Công trong 2 lượt)`;
          } else if (actor.skills.some((s) => s.toLowerCase().includes('flame') || s.toLowerCase().includes('fire'))) {
            debuffToInflict = createStatusEffect('burned', 3);
            debuffMsg = `🔥 Lửa địa ngục của ${actor.name} thiêu đốt Aster Vale! (Đốt Cháy: 9 DMG/lượt trong 3 lượt)`;
          } else if (actor.skills.some((s) => s.toLowerCase().includes('ink') || s.toLowerCase().includes('toxic'))) {
            debuffToInflict = createStatusEffect('poisoned', 3);
            debuffMsg = `🧪 Nọc độc của ${actor.name} ngấm vào người Aster Vale! (Trúng Độc: 7 DMG/lượt trong 3 lượt)`;
          }

          if (debuffToInflict) {
            const res = addOrRefreshStatusEffect(nextBattle.player.statusEffects || [], debuffToInflict);
            nextBattle.player.statusEffects = res.updatedList;
            nextBattle.log.push(debuffMsg);
            spawnFloatingText(`⚠️ ${debuffToInflict.type.toUpperCase()}`, '#d36e61', 'player');
          }
        }

        return nextBattle;
      });
    }, 600);

    return () => {
      if (enemyTurnTimeoutRef.current) {
        clearTimeout(enemyTurnTimeoutRef.current);
      }
    };
  }, [battle.turn, battle.round, battle.initiativeIndex, battle.result, spawnFloatingText]);

  // Handle Standard Attack
  const handleAttack = () => {
    if (battle.actionLocked || battle.turn !== 'player' || battle.result) return;

    const target =
      battle.enemies.find((e) => e.instanceId === battle.selectedEnemyId && e.hp > 0) ||
      battle.enemies.find((e) => e.hp > 0);

    if (!target) return;

    const effPlayerAtk = getEffectiveAtk(battle.player.atk, battle.player.statusEffects || []);
    const effEnemyDef = getEffectiveDef(target.def, target.statusEffects || []);
    const damage = Math.max(1, effPlayerAtk + 3 - Math.floor(effEnemyDef / 3));

    SoundSystem.playAttack();
    spawnFloatingText(`-${damage}`, '#d5b66c', target.instanceId);

    const performed = performPlayerAction(battle, 'Attack', target.instanceId);
    if (performed.result === 'victory') SoundSystem.playVictory();
    if (performed.result === 'defeat') SoundSystem.playDefeat();
    setBattle(performed);
  };

  // Handle Guard (Defensive Stance - NO ATTACK)
  const handleGuard = () => {
    if (battle.actionLocked || battle.turn !== 'player' || battle.result) return;

    SoundSystem.playGuard();
    const fortifyBuff = createStatusEffect('fortified', 1);
    const updatedEffects = addOrRefreshStatusEffect(battle.player.statusEffects || [], fortifyBuff).updatedList;

    spawnFloatingText('🛡️ THỦ THẾ (-50% SÁT THƯƠNG)', '#79c0ff', 'player');

    // Run base action with Guard command
    const performed = performPlayerAction(
      {
        ...battle,
        player: {
          ...battle.player,
          statusEffects: updatedEffects,
        },
      },
      'Guard'
    );

    setBattle({
      ...performed,
      log: [
        ...battle.log,
        `🛡️ ${battle.player.name} nâng khiên kiên cố, chuẩn bị chống đỡ đòn đánh tiếp theo! (Giảm 50% sát thương)`,
      ],
    });
  };

  // Handle Item (Restorative Tonic - Dedicated Healing, NO ATTACK)
  const handleUseItem = () => {
    if (battle.actionLocked || battle.turn !== 'player' || battle.result) return;

    const potion = gameState.inventory.find((i) => i.id === 'potion');
    if (!potion || potion.quantity <= 0) {
      SoundSystem.playSelect();
      setBattle((prev) => ({
        ...prev,
        log: [...prev.log, 'Không còn Bình Dược Liệu nào trong túi đồ.'],
      }));
      return;
    }

    // Deduct inventory
    const nextInventory = gameState.inventory.map((i) =>
      i.id === 'potion' ? { ...i, quantity: i.quantity - 1 } : i
    );
    onUpdateGameState({
      ...gameState,
      inventory: nextInventory,
    });

    const hadDebuffs = (battle.player.statusEffects || []).some((e) => e.category === 'debuff');
    let cleanedEffects = removeDebuffs(battle.player.statusEffects || []);

    // Grant 2 turns of regen
    const regenBuff = createStatusEffect('regenerating', 2);
    cleanedEffects = addOrRefreshStatusEffect(cleanedEffects, regenBuff).updatedList;

    const healed = Math.min(35, battle.player.maxHp - battle.player.hp);
    SoundSystem.playHeal();
    spawnFloatingText(`+${healed} HP`, '#56d364', 'player');
    spawnFloatingText('🌿 TÁI SINH', '#56d364', 'player');
    if (hadDebuffs) {
      spawnFloatingText('✨ THANH TẨY', '#fffb8f', 'player');
    }

    const nextState = {
      ...battle,
      player: {
        ...battle.player,
        hp: battle.player.hp + healed,
        statusEffects: cleanedEffects,
      },
    };

    const performed = performPlayerAction(nextState, 'Item');

    setBattle({
      ...performed,
      log: [
        ...battle.log,
        `✨ ${battle.player.name} uống Bình Dược Liệu: Hồi phục +${healed} HP, thanh tẩy toàn bộ debuff và nhận hiệu ứng Tái Sinh (+8 HP/lượt)!`,
      ],
    });
  };

  // Handle Cast Skill from the 40-Skill Grimoire
  const handleCastSkill = (skill: SkillDefinition, targetId?: string) => {
    if (battle.actionLocked || battle.turn !== 'player' || battle.result) return;
    if (battle.player.mp < skill.mpCost) {
      SoundSystem.playSelect();
      return;
    }

    setShowSkillGrimoire(false);

    let nextBattleState = {
      ...battle,
      player: {
        ...battle.player,
        mp: battle.player.mp - skill.mpCost,
      },
      enemies: battle.enemies.map((e) => ({ ...e })),
      log: [...battle.log],
    };

    const rank = Number(gameState.player?.unlockedSkills?.[skill.id] || 1);
    const rankMultiplier = 1 + (rank - 1) * 0.25;
    const effPlayerAtk = getEffectiveAtk(nextBattleState.player.atk, nextBattleState.player.statusEffects || []);
    const effPlayerMatk = Number(gameState.player?.stats?.matk ?? 15);
    const effPlayerDef = getEffectiveDef(nextBattleState.player.def, nextBattleState.player.statusEffects || []);

    // 1. Self heal / Buff skill
    if (skill.target === 'self') {
      let healAmount = 0;
      if (skill.healPower && skill.healPower > 0) {
        healAmount = Math.min(
          Math.round(skill.healPower * rankMultiplier + effPlayerMatk * (0.95 + rank * 0.2)),
          nextBattleState.player.maxHp - nextBattleState.player.hp
        );
        nextBattleState.player.hp += healAmount;
        SoundSystem.playHeal();
        spawnFloatingText(`+${healAmount} HP`, '#56d364', 'player');
      }

      if (skill.id === 'inner_focus') {
        const mpRestored = Math.min(14, nextBattleState.player.maxMp - nextBattleState.player.mp);
        nextBattleState.player.mp += mpRestored;
        SoundSystem.playMagic();
        spawnFloatingText(`+${mpRestored} MP`, '#79c0ff', 'player');
      }

      if (skill.id === 'purifying_radiance') {
        nextBattleState.player.statusEffects = removeDebuffs(nextBattleState.player.statusEffects || []);
        spawnFloatingText('✨ THANH TẨY', '#fffb8f', 'player');
      }

      if (skill.statusEffect) {
        const buff = createStatusEffect(skill.statusEffect.type, skill.statusEffect.duration);
        nextBattleState.player.statusEffects = addOrRefreshStatusEffect(
          nextBattleState.player.statusEffects || [],
          buff
        ).updatedList;
        spawnFloatingText(`✨ ${buff.name.toUpperCase()}`, '#ffd666', 'player');
      }

      SoundSystem.playSkill();
      nextBattleState.log.push(
        `✨ ${nextBattleState.player.name} thi triển [${skill.nameVi}] (Cấp ${rank})! (-${skill.mpCost} MP)`
      );
    }
    // 2. All Enemies AoE Skill
    else if (skill.target === 'all_enemies') {
      SoundSystem.playSkill();
      if (skill.power >= 24) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 360);
      }

      nextBattleState.enemies = nextBattleState.enemies.map((enemy) => {
        if (enemy.hp <= 0) return enemy;

        const effEnemyDef = getEffectiveDef(enemy.def, enemy.statusEffects || []);
        let baseDmg = 0;
        if (skill.category === 'magic') {
          baseDmg = Math.max(8, Math.floor(skill.power * rankMultiplier + effPlayerMatk * (1.1 + rank * 0.2) - effEnemyDef * 0.2));
        } else {
          baseDmg = Math.max(8, Math.floor(skill.power * rankMultiplier + effPlayerAtk * (1.0 + rank * 0.2) - effEnemyDef * 0.25));
        }

        spawnFloatingText(`-${baseDmg}`, skill.color || '#ff7875', enemy.instanceId, skill.power >= 30);

        let updatedEffects = [...(enemy.statusEffects || [])];
        if (skill.statusEffect && Math.random() <= (skill.statusEffect.chance || 1)) {
          const debuff = createStatusEffect(skill.statusEffect.type, skill.statusEffect.duration);
          updatedEffects = addOrRefreshStatusEffect(updatedEffects, debuff).updatedList;
        }

        return {
          ...enemy,
          hp: Math.max(0, enemy.hp - baseDmg),
          statusEffects: updatedEffects,
        };
      });

      nextBattleState.log.push(
        `💥 ${nextBattleState.player.name} phóng [${skill.nameVi}] (Cấp ${rank}) càn quét toàn bộ kẻ thù! (-${skill.mpCost} MP)`
      );
    }
    // 3. Single Target Skill
    else {
      const chosenTargetId = targetId || battle.selectedEnemyId;
      const targetEnemy =
        nextBattleState.enemies.find((e) => e.instanceId === chosenTargetId && e.hp > 0) ||
        nextBattleState.enemies.find((e) => e.hp > 0);

      if (targetEnemy) {
        const effEnemyDef = getEffectiveDef(targetEnemy.def, targetEnemy.statusEffects || []);
        let baseDmg = 0;

        if (skill.category === 'magic') {
          SoundSystem.playMagic();
          baseDmg = Math.max(12, Math.floor(skill.power * rankMultiplier + effPlayerMatk * (1.25 + rank * 0.25) - effEnemyDef * 0.2));
        } else if (skill.id === 'shield_slam') {
          SoundSystem.playSkill();
          baseDmg = Math.max(10, Math.floor(skill.power * rankMultiplier + effPlayerDef * (1.3 + rank * 0.25) - effEnemyDef * 0.25));
        } else {
          SoundSystem.playSkill();
          baseDmg = Math.max(10, Math.floor(skill.power * rankMultiplier + effPlayerAtk * (1.2 + rank * 0.25) - effEnemyDef * 0.25));
        }

        if (skill.power >= 25) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 360);
        }

        spawnFloatingText(`-${baseDmg}`, skill.color || '#ffd666', targetEnemy.instanceId, skill.power >= 30);

        let updatedEffects = [...(targetEnemy.statusEffects || [])];
        if (skill.statusEffect && Math.random() <= (skill.statusEffect.chance || 1)) {
          const debuff = createStatusEffect(skill.statusEffect.type, skill.statusEffect.duration);
          updatedEffects = addOrRefreshStatusEffect(updatedEffects, debuff).updatedList;
          spawnFloatingText(`⚠️ ${debuff.name.toUpperCase()}`, '#ff7875', targetEnemy.instanceId);
        }

        targetEnemy.hp = Math.max(0, targetEnemy.hp - baseDmg);
        targetEnemy.statusEffects = updatedEffects;

        // Drain HP if applicable
        if (skill.healPower && skill.healPower > 0) {
          const drained = Math.min(skill.healPower, nextBattleState.player.maxHp - nextBattleState.player.hp);
          nextBattleState.player.hp += drained;
          spawnFloatingText(`+${drained} HP`, '#56d364', 'player');
        }

        nextBattleState.log.push(
          `⚔️ ${nextBattleState.player.name} thi triển [${skill.nameVi}] (Cấp ${rank}) trúng ${targetEnemy.name} gây ${baseDmg} sát thương! (-${skill.mpCost} MP)`
        );
      }
    }

    // Check Victory
    const livingEnemies = nextBattleState.enemies.filter((e) => e.hp > 0);
    if (livingEnemies.length === 0) {
      SoundSystem.playVictory();
      nextBattleState.result = 'victory';
      nextBattleState.turn = 'result';
      nextBattleState.selection = 'Chiến thắng!';
      nextBattleState.log.push('Chiến thắng! Toàn bộ quái vật đã bị tiêu diệt.');
      setBattle(nextBattleState);
      return;
    }

    // Advance turn to enemy
    nextBattleState.actionLocked = true;
    nextBattleState.turn = 'enemy';
    nextBattleState.selection = 'Lượt của quái vật.';
    setBattle(nextBattleState);
  };

  // Companion Party Assist Ability Handler
  const handlePartyAssist = (type: 'arrow_volley' | 'radiant_mend' | 'battle_cry') => {
    if (battle.actionLocked || battle.turn !== 'player' || battle.result) return;

    if (type === 'arrow_volley') {
      const cost = 10;
      if (battle.player.mp < cost) {
        SoundSystem.playSelect();
        setBattle((prev) => ({
          ...prev,
          log: [...prev.log, 'Không đủ MP cho Bão Tên Độc của Lio Fen (cần 10 MP).'],
        }));
        return;
      }

      SoundSystem.playSkill();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 320);

      const poisonDebuff = createStatusEffect('poisoned', 3);

      const updatedEnemies = battle.enemies.map((e) => {
        if (e.hp <= 0) return e;
        const dmg = Math.max(8, Math.floor(16 + Math.random() * 5 - e.def / 4));
        spawnFloatingText(`🏹 -${dmg}`, '#a4d4a0', e.instanceId);

        const res = addOrRefreshStatusEffect(e.statusEffects || [], poisonDebuff);

        return {
          ...e,
          hp: Math.max(0, e.hp - dmg),
          statusEffects: res.updatedList,
        };
      });

      const livingEnemies = updatedEnemies.filter((e) => e.hp > 0);
      const isVictory = livingEnemies.length === 0;

      if (isVictory) SoundSystem.playVictory();

      setBattle((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          mp: prev.player.mp - cost,
        },
        enemies: updatedEnemies,
        actionLocked: true,
        log: [
          ...prev.log,
          `🏹 Lio Fen bắn Bão Tên Độc trúng toàn bộ quái vật! (Trúng Độc 3 lượt, -${cost} MP)`,
          ...(isVictory ? ['Chiến thắng! Toàn bộ kẻ địch gục ngã.'] : []),
        ],
        result: isVictory ? 'victory' : prev.result,
        turn: isVictory ? 'result' : 'enemy',
        selection: isVictory ? 'Chiến thắng!' : 'Lượt của quái vật.',
      }));
    } else if (type === 'radiant_mend') {
      const cost = 12;
      if (battle.player.mp < cost) {
        SoundSystem.playSelect();
        setBattle((prev) => ({
          ...prev,
          log: [...prev.log, 'Không đủ MP cho Thánh Quang của Mira Sol (cần 12 MP).'],
        }));
        return;
      }

      SoundSystem.playHeal();
      const healAmount = Math.min(45, battle.player.maxHp - battle.player.hp);
      spawnFloatingText(`✨ +${healAmount} HP`, '#7caa79', 'player');

      let nextEffects = removeDebuffs(battle.player.statusEffects || []);
      const regen = createStatusEffect('regenerating', 3);
      const fortify = createStatusEffect('fortified', 2);
      nextEffects = addOrRefreshStatusEffect(nextEffects, regen).updatedList;
      nextEffects = addOrRefreshStatusEffect(nextEffects, fortify).updatedList;

      spawnFloatingText('🌿 TÁI SINH & HỘ THỂ', '#56d364', 'player');

      setBattle((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          hp: Math.min(prev.player.maxHp, prev.player.hp + healAmount),
          mp: prev.player.mp - cost,
          statusEffects: nextEffects,
        },
        actionLocked: true,
        log: [
          ...prev.log,
          `✨ Mira Sol thi triển Thánh Quang! Hồi phục +${healAmount} HP, thanh tẩy debuff và ban Tái Sinh + Kiên Cố! (-${cost} MP)`,
        ],
        turn: 'enemy',
        selection: 'Lượt của quái vật.',
      }));
    } else if (type === 'battle_cry') {
      const cost = 8;
      if (battle.player.mp < cost) {
        SoundSystem.playSelect();
        setBattle((prev) => ({
          ...prev,
          log: [...prev.log, 'Không đủ MP cho Tiếng Gầm Chiến Trận (cần 8 MP).'],
        }));
        return;
      }

      SoundSystem.playSkill();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 260);

      let nextEffects = [...(battle.player.statusEffects || [])];
      const empower = createStatusEffect('empowered', 3);
      const hasten = createStatusEffect('hastened', 3);
      nextEffects = addOrRefreshStatusEffect(nextEffects, empower).updatedList;
      nextEffects = addOrRefreshStatusEffect(nextEffects, hasten).updatedList;

      spawnFloatingText('⚔️ TĂNG LỰC (+40% CÔNG)', '#ffd666', 'player');

      setBattle((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          mp: prev.player.mp - cost,
          statusEffects: nextEffects,
        },
        actionLocked: true,
        log: [
          ...prev.log,
          `⚔️ Aster Vale gầm vang Tiếng Gầm Chiến Trận! Tăng 40% Công và 40% Tốc độ trong 3 lượt! (-${cost} MP)`,
        ],
        turn: 'enemy',
        selection: 'Lượt của quái vật.',
      }));
    }

    setShowPartySkills(false);
  };

  // Replay handler
  const handleReplay = () => {
    if (enemyTurnTimeoutRef.current) clearTimeout(enemyTurnTimeoutRef.current);
    lastTickedStepRef.current = '';

    const refreshedPlayer = {
      ...gameState.player,
      currentHp: gameState.player.stats.hp,
      currentMp: gameState.player.stats.mp,
    };

    const nextBattle = createBattleState(refreshedPlayer, enemyGroup.length ? enemyGroup : undefined);
    nextBattle.player.statusEffects = [];
    nextBattle.enemies = nextBattle.enemies.map((e) => ({ ...e, statusEffects: [] }));

    setBattle(nextBattle);
  };

  // Return to dungeon handler
  const handleReturn = () => {
    if (enemyTurnTimeoutRef.current) clearTimeout(enemyTurnTimeoutRef.current);

    const updatedPlayer = {
      ...gameState.player,
      currentHp: battle.player.hp,
      currentMp: battle.player.mp,
      statusEffects: battle.player.statusEffects?.map((s) => s.type) || [],
    };

    const updatedParty = gameState.party.map((member, i) =>
      i === 0
        ? {
            ...member,
            currentHp: battle.player.hp,
            currentMp: battle.player.mp,
            statusEffects: battle.player.statusEffects?.map((s) => s.type) || [],
          }
        : member
    );

    const baseState: GameState = {
      ...gameState,
      player: updatedPlayer,
      party: updatedParty,
    };

    if (battle.result === 'victory') {
      const monsterRewards = calculateMonsterRewards(battle.enemies, floorNumber);
      if (encounter.kind !== 'boss') {
        const withRewards = applyBattleRewards(baseState, monsterRewards);
        const defeated = baseState.dungeon.defeatedEncounters ?? [];
        const nextState: GameState = {
          ...withRewards,
          dungeon: {
            ...withRewards.dungeon,
            defeatedEncounters: [...new Set([...defeated, encounter.id])],
          },
        };
        saveGameState(nextState, 'default');
        onUpdateGameState(nextState);
        onReturnToDungeon();
        return;
      }

      // Boss defeated -> Trigger Floor Clear Scene!
      const withRewards = applyBattleRewards(baseState, monsterRewards);
      const nextState: GameState = {
        ...withRewards,
        dungeon: {
          ...withRewards.dungeon,
          enemyDefeated: true,
        },
      };
      saveGameState(nextState, 'default');
      onUpdateGameState(nextState);
      const reward = getFloorReward(floorNumber);
      onFloorCleared(reward);
      return;
    }

    // Defeat or flee
    const nextState: GameState = {
      ...baseState,
    };
    saveGameState(nextState, 'default');
    onUpdateGameState(nextState);
    onReturnToDungeon();
  };

  const currentActor = battle.initiative.find((actor) => actor.id === battle.currentActorId);
  const isPlayerTurn = battle.turn === 'player' && !battle.actionLocked && !battle.result;

  // Floor Biome Atmosphere Background
  const defaultBg = getBattleBackground(floorNumber);
  const activeBgPath = defaultBg.path.startsWith('/') ? defaultBg.path : `/${defaultBg.path}`;
  const playerStatuses = battle.player.statusEffects || [];

  const biomeAtmosphere = useMemo(() => {
    switch (floorDef.biome) {
      case 'magma':
        return {
          tint: 'bg-gradient-to-t from-[#260e09]/85 via-[#4a1c11]/25 to-[#1a0805]/40',
          particleColor: 'bg-[#ff7a45]',
          ambientIcon: '🔥',
        };
      case 'ice':
        return {
          tint: 'bg-gradient-to-t from-[#0d1f2e]/85 via-[#1b3d5c]/25 to-[#081521]/40',
          particleColor: 'bg-[#69c0ff]',
          ambientIcon: '❄️',
        };
      case 'roots':
        return {
          tint: 'bg-gradient-to-t from-[#0e2116]/85 via-[#1d422c]/25 to-[#0a170f]/40',
          particleColor: 'bg-[#95de64]',
          ambientIcon: '🌿',
        };
      case 'crown':
        return {
          tint: 'bg-gradient-to-t from-[#262010]/85 via-[#4d3e1d]/25 to-[#1c160a]/40',
          particleColor: 'bg-[#ffd666]',
          ambientIcon: '⚜️',
        };
      case 'archive':
      default:
        return {
          tint: 'bg-gradient-to-t from-[#111716]/85 via-[#1f302b]/25 to-[#111716]/35',
          particleColor: 'bg-[#7caa79]',
          ambientIcon: '🕯️',
        };
    }
  }, [floorDef.biome]);

  const potionItem = gameState.inventory.find((i) => i.id === 'potion');
  const potionCount = potionItem ? potionItem.quantity : 0;

  return (
    <div className="relative w-full min-h-[100dvh] lg:min-h-0 lg:h-full flex flex-col justify-between bg-[#111716] p-2 sm:p-4 select-none text-[#e4dec8] overflow-y-auto">
      {/* Outer border */}
      <div className="absolute inset-1 sm:inset-3 border border-[#59695d]/60 pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between border-b border-[#59695d] pb-2 sm:pb-3 px-2 sm:px-4 gap-2">
        <div>
          <h1 className="font-serif text-lg sm:text-2xl text-[#e2c77b] tracking-wider font-normal">
            LANTERNFALL
          </h1>
          <p className="text-[9px] sm:text-xs text-[#9aa697] tracking-wider uppercase font-mono">
            CHIẾN TRẬN / TẦNG {floorDef.floor}: {floorDef.nameVi.toUpperCase()} ({floorDef.name.toUpperCase()})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <PWAInstallButton />

          {/* Audio toggle button */}
          <button
            onClick={() => {
              const next = SoundSystem.toggleMute();
              setIsMuted(next);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-[#1b2421] hover:bg-[#28352e] border border-[#59695d] text-[10px] font-mono text-[#c4c2ad] cursor-pointer transition-colors"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX size={12} className="text-[#d36e61]" /> : <Volume2 size={12} className="text-[#7caa79]" />}
            <span className="hidden sm:inline">{isMuted ? 'TẮT ÂM' : 'ÂM THANH'}</span>
          </button>

          {/* Active floor biome badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-[#1b2421] border border-[#59695d] text-[10px] font-mono text-[#d5b66c]">
            <span>{biomeAtmosphere.ambientIcon}</span>
            <span className="hidden md:inline uppercase">{floorDef.nameVi}</span>
          </div>

          <span
            className={`text-[10px] sm:text-xs font-mono tracking-wider px-2 sm:px-3 py-1 border ${
              encounter.kind === 'boss'
                ? 'bg-[#351e1e] border-[#d36e61] text-[#e89184]'
                : 'bg-[#1b2421] border-[#59695d] text-[#c4c2ad]'
            }`}
          >
            {encounter.kind === 'boss' ? 'TRÙM (BOSS)' : 'QUÁI VẬT'}
          </span>
        </div>
      </div>

      {/* Arena Viewport (Pokemon Front-to-Back Battle Perspective + Mobile Optimized Height) */}
      <div className={`relative z-10 my-1.5 sm:my-2 bg-[#17201d] border-2 border-[#59695d] h-[270px] sm:h-[350px] lg:h-[390px] overflow-hidden shadow-2xl transition-transform ${
        isShaking ? 'animate-screen-shake ring-2 ring-[#d36e61]/40' : ''
      }`}>
        {/* Real Pixel Art Battle Background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <img
            src={activeBgPath}
            alt="Battle Arena Background"
            className="w-full h-full object-cover object-center scale-105 opacity-85"
            style={{ imageRendering: 'pixelated' }}
          />
          {/* Floor-specific Atmospheric Tint & Ambient Depth */}
          <div className={`absolute inset-0 ${biomeAtmosphere.tint}`} />
          <div className="absolute inset-0 bg-[#17201d]/15" />
        </div>

        {/* --- Octopath / Grandia Turn Order Initiative Timeline --- */}
        <div className="absolute top-2.5 left-3 z-30 flex items-center gap-1.5 px-2 py-1 bg-black/80 backdrop-blur-xs border border-[#59695d]/70 rounded-xs shadow-lg">
          <span className="text-[9px] font-mono text-[#d5b66c] uppercase font-bold tracking-wider mr-0.5">
            LƯỢT {battle.round}:
          </span>
          <div className="flex items-center gap-1">
            {battle.initiative.map((actor, idx) => {
              const isCurrent = actor.id === battle.currentActorId;
              const isPlayer = actor.side === 'player';
              return (
                <div
                  key={`${actor.id}-${idx}`}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] transition-all text-[8px] font-mono ${
                    isCurrent
                      ? 'bg-[#d5b66c] text-[#111716] font-bold shadow-[0_0_8px_rgba(213,182,108,0.8)] scale-105 ring-1 ring-white'
                      : isPlayer
                        ? 'bg-[#213327] text-[#9fd49b] border border-[#59695d]/60'
                        : 'bg-[#311c1c] text-[#e89184] border border-[#59695d]/60'
                  }`}
                  title={`${actor.name} (Tốc độ: ${actor.spd})`}
                >
                  <span className="font-semibold">{actor.name.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- 1. ENEMY BATTLE ZONE (Mid-Ground Corridor Floor - Đứng trực tiếp trên sàn đá) --- */}
        <div className="absolute z-10 bottom-[20%] sm:bottom-[23%] right-[6%] sm:right-[14%] lg:right-[18%] flex items-end justify-center gap-4 sm:gap-7">
          {battle.enemies.map((enemy, idx) => {
            const alive = enemy.hp > 0;
            const isSelected = enemy.instanceId === battle.selectedEnemyId;
            const isActing = enemy.instanceId === battle.currentActorId;
            const hpPercent = Math.max(0, Math.min(1, enemy.hp / (enemy.maxHp || 1))) * 100;
            const enemyStatuses = enemy.statusEffects || [];

            // Perspective depth stagger along the stone pathway
            const depthOffsetY = idx === 0 ? 'translate-y-2 z-30' : idx === 1 ? 'translate-y-0 z-20' : '-translate-y-2 z-10';
            const isBoss = enemy.kind === 'boss';

            return (
              <div
                key={enemy.instanceId}
                onClick={() => {
                  if (alive && !battle.result) {
                    SoundSystem.playSelect();
                    setBattle((prev) => ({ ...prev, selectedEnemyId: enemy.instanceId }));
                  }
                }}
                className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 ${depthOffsetY} ${
                  !alive ? 'opacity-25 grayscale' : 'opacity-100 hover:scale-105'
                }`}
              >
                {/* Floating Combat Popups */}
                {floatingTexts
                  .filter((f) => f.targetId === enemy.instanceId)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="absolute -top-7 pointer-events-none z-50 font-mono font-bold text-sm tracking-wider animate-float-damage whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                      style={{ color: f.color }}
                    >
                      {f.text}
                    </div>
                  ))}

                {/* Minimal Overhead HUD: Name + Status Icons + Health Bar */}
                <div
                  className={`flex flex-col items-center gap-0.5 mb-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs border transition-all ${
                    isSelected
                      ? 'border-[#d5b66c] shadow-[0_0_8px_rgba(213,182,108,0.6)] ring-1 ring-[#d5b66c]/60'
                      : 'border-[#59695d]/50'
                  }`}
                >
                  <div className="flex items-center gap-1 max-w-[110px]">
                    <span className="text-[10px] font-bold text-[#ead8c2] truncate font-serif">
                      {enemy.name}
                    </span>
                    {enemyStatuses.length > 0 && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {enemyStatuses.map((st) => (
                          <StatusBadge key={st.id} effect={st} size="sm" showLabel={false} />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Slim HP bar */}
                  <div className="w-16 sm:w-20 h-1.5 bg-[#151b18] border border-[#59695d]/70 rounded-[2px] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hpPercent > 50
                          ? 'bg-[#7caa79]'
                          : hpPercent > 20
                            ? 'bg-[#d5b66c]'
                            : 'bg-[#d36e61]'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Enemy Distant Sprite (Smaller in perspective, grounded) */}
                <div className="relative flex flex-col items-center">
                  <div className={`transition-transform duration-300 ${isActing ? 'scale-110 -translate-y-2' : ''}`}>
                    <AnimatedSprite
                      assetKey={enemy.assetKey}
                      displaySize={isBoss ? 96 : 76}
                      alt={enemy.name}
                      isAttacking={isActing && battle.turn === 'enemy'}
                    />
                  </div>

                  {/* Ground Contact Ellipse Shadow firmly on the floor */}
                  <div
                    className={`h-2.5 bg-black/80 rounded-[100%] blur-[2px] transition-all -mt-1 shadow-[0_2px_8px_rgba(0,0,0,0.85)] ${
                      isBoss ? 'w-24 sm:w-28' : 'w-16 sm:w-18'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* --- 2. FOREGROUND PLAYER HERO ZONE (Lower-Left / Front - Đứng vững ở tiền cảnh) --- */}
        <div className="absolute z-10 bottom-3 sm:bottom-4 left-3 sm:left-8 flex items-end gap-3 sm:gap-6">
          {/* Main Hero & Party Formation */}
          <div className="flex items-end gap-3 sm:gap-6">
            {/* Primary Hero: Aster Vale (Prominent & Large Foreground Presence) */}
            <div className="relative flex flex-col items-center group">
              {/* Floating Combat Popups on Player */}
              {floatingTexts
                .filter((f) => f.targetId === 'player')
                .map((f) => (
                  <div
                    key={f.id}
                    className="absolute -top-8 pointer-events-none z-50 font-mono font-bold text-sm tracking-wider animate-float-damage whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    style={{ color: f.color }}
                  >
                    {f.text}
                  </div>
                ))}

              {/* Guard Barrier Shield Aura */}
              {battle.guarding && (
                <div className="absolute inset-[-10px] rounded-full border-2 border-[#79c0ff] bg-[#79c0ff]/15 shadow-[0_0_18px_#79c0ff] animate-pulse pointer-events-none z-30" />
              )}

              {/* Turn Aura Indicator */}
              {isPlayerTurn && (
                <div className="absolute -top-7 px-2 py-0.5 bg-[#d5b66c] text-[#111716] text-[8px] font-bold font-mono tracking-widest rounded-xs shadow-[0_0_10px_rgba(213,182,108,0.8)] animate-bounce uppercase">
                  LƯỢT CỦA BẠN
                </div>
              )}

              {/* Minimal Overhead HUD: Name + Status Icons + Health & Mana Bars */}
              <div className="flex flex-col items-center gap-0.5 mb-1 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs border border-[#d5b66c]/60 shadow-md">
                <div className="flex items-center gap-1.5 max-w-[130px]">
                  <span className="text-[10px] font-bold font-serif text-[#e2c77b] truncate">
                    {battle.player.name}
                  </span>
                  {battle.guarding && (
                    <span className="text-[8px] font-mono px-1 bg-[#122838] text-[#79c0ff] border border-[#79c0ff]/60 rounded-xs">
                      THỦ
                    </span>
                  )}
                  {playerStatuses.length > 0 && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {playerStatuses.map((st) => (
                        <StatusBadge key={st.id} effect={st} size="sm" showLabel={false} />
                      ))}
                    </div>
                  )}
                </div>
                {/* Slim HP bar */}
                <div className="w-20 sm:w-24 h-1.5 bg-[#151b18] border border-[#59695d]/70 rounded-[2px] overflow-hidden">
                  <div
                    className="h-full bg-[#7caa79] transition-all duration-300"
                    style={{
                      width: `${Math.max(0, Math.min(1, battle.player.hp / (battle.player.maxHp || 1))) * 100}%`,
                    }}
                  />
                </div>
                {/* Slim MP bar */}
                <div className="w-20 sm:w-24 h-1 bg-[#151b18] border border-[#59695d]/50 rounded-[2px] overflow-hidden">
                  <div
                    className="h-full bg-[#75a6bf] transition-all duration-300"
                    style={{
                      width: `${Math.max(0, Math.min(1, battle.player.mp / (battle.player.maxMp || 1))) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Large Hero Silhouette / Sprite Box */}
              <div
                className={`relative w-24 h-24 sm:w-28 sm:h-28 bg-[#202b26]/90 border-2 flex flex-col items-center justify-center p-2 shadow-2xl transition-all duration-300 ${
                  isPlayerTurn
                    ? 'border-[#d5b66c] shadow-[0_0_20px_rgba(213,182,108,0.6)] scale-105'
                    : 'border-[#59695d]'
                } ${battle.guarding ? 'ring-2 ring-[#79c0ff]' : ''}`}
              >
                {/* Hero Icon Stance */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#18201c] border-2 border-[#7caa79] shadow-inner flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-sm font-serif font-bold text-[#e7d9a5] tracking-wider">
                    VALE
                  </span>
                  <span className="text-[8px] font-mono text-[#9aa697]">
                    {battle.guarding ? '🛡️ THỦ' : '⚔️ SẴN SÀNG'}
                  </span>
                </div>
              </div>

              {/* Foreground Hero Soft Ground Shadow */}
              <div className="w-24 sm:w-28 h-3.5 bg-black/85 rounded-[100%] blur-[2.5px] -mt-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.9)]" />
            </div>

            {/* Companion Support Party Members (Flanking in background-left) */}
            <div className="hidden sm:flex items-end gap-2 mb-1">
              {gameState.party.slice(1).map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center"
                  title={`${member.name} (${member.role})`}
                >
                  <div className="px-1.5 py-0.5 bg-black/75 border border-[#59695d]/50 rounded text-center mb-0.5">
                    <span className="text-[9px] font-semibold text-[#e4dec8] block truncate max-w-[65px]">
                      {member.name}
                    </span>
                  </div>
                  <div className="w-8 h-8 bg-[#18201c] border border-[#59695d] flex items-center justify-center shadow-md">
                    <span className="text-[8px] font-mono text-[#c4c2ad] uppercase">
                      {member.classId.slice(0, 3)}
                    </span>
                  </div>
                  <div className="w-12 h-1.5 bg-black/60 rounded-[100%] blur-[2px] mx-auto mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Control & Log Panels (Bottom half) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[195px]">
        {/* Left: Player Vitals & Status Effects Panel */}
        <div className="lg:col-span-3 bg-[#1b2421] border border-[#59695d] p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono tracking-wider text-[#d5b66c] uppercase">
                CHỈ SỐ ANH HÙNG
              </span>
              <span className="text-[9px] font-mono text-[#9aa697]">
                DEF: {getEffectiveDef(battle.player.def, playerStatuses)} | ATK: {getEffectiveAtk(battle.player.atk, playerStatuses)}
              </span>
            </div>
            <h3 className="font-serif text-sm font-bold text-[#e4dec8]">
              {battle.player.name} / CHIẾN BINH
            </h3>
          </div>

          <div className="space-y-1.5 py-1">
            <div>
              <div className="flex justify-between text-xs font-mono mb-0.5">
                <span className="text-[#9aa697]">HP (MÁU)</span>
                <span className="text-[#e4dec8]">
                  {battle.player.hp} / {battle.player.maxHp}
                </span>
              </div>
              <div className="w-full h-2 bg-[#151b18] border border-[#59695d]">
                <div
                  className="h-full bg-[#7caa79] transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(1, battle.player.hp / (battle.player.maxHp || 1))) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-0.5">
                <span className="text-[#9aa697]">MP (MANA)</span>
                <span className="text-[#e4dec8]">
                  {battle.player.mp} / {battle.player.maxMp}
                </span>
              </div>
              <div className="w-full h-2 bg-[#151b18] border border-[#59695d]">
                <div
                  className="h-full bg-[#75a6bf] transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(1, battle.player.mp / (battle.player.maxMp || 1))) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Active Status Effects Section in Player Panel */}
          <div className="pt-1.5 border-t border-[#313f37]">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#d5b66c] mb-1">
              HIỆU ỨNG HIỆN TẠI ({playerStatuses.length})
            </div>
            {playerStatuses.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {playerStatuses.map((st) => (
                  <StatusBadge key={st.id} effect={st} size="sm" showLabel={true} />
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-[#6f7e73] italic font-mono">
                {battle.guarding ? '🛡️ Đang phòng thủ (-50% sát thương)' : 'Không có hiệu ứng bất lợi'}
              </div>
            )}
          </div>
        </div>

        {/* Center: Turn Order & Battle Log */}
        <div className="lg:col-span-5 bg-[#1b2421] border border-[#59695d] p-3 flex flex-col justify-between">
          {/* Turn Order Bar */}
          <div className="border-b border-[#313f37] pb-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#9aa697]">THỨ TỰ HÀNH ĐỘNG • VÒNG {battle.round}</span>
              <span className="text-[#d5b66c] uppercase font-semibold">
                {battle.result ? (battle.result === 'victory' ? 'CHIẾN THẮNG' : 'THẤT BẠI') : `${currentActor?.name || 'UNKNOWN'}`}
              </span>
            </div>
            <div className="text-xs font-mono text-[#e4dec8] mt-0.5 truncate">
              {battle.initiative
                .map((a) => `${a.name.split(' ')[0]} (${a.spd})`)
                .join(' > ')}
            </div>
          </div>

          {/* Action Log Text */}
          <div className="flex-1 my-1.5 overflow-y-auto font-mono text-xs text-[#c7c8b2] space-y-1 pr-1 max-h-[85px]">
            {battle.log.slice(-4).map((entry, idx) => (
              <div
                key={idx}
                className={idx === battle.log.slice(-4).length - 1 ? 'text-[#e7d9a5] font-semibold' : 'opacity-85'}
              >
                › {entry}
              </div>
            ))}
          </div>

          <div className="text-[10px] font-mono text-[#9aa697]">
            {battle.selection}
          </div>
        </div>

        {/* Right: Commands Panel */}
        <div className="lg:col-span-4 bg-[#1b2421] border border-[#59695d] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#313f37] pb-1.5 mb-1.5">
            <span className="text-[10px] font-mono text-[#d5b66c] uppercase font-bold">
              MỆNH LỆNH CHIẾN ĐẤU
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  SoundSystem.playSelect();
                  setShowPartySkills(false);
                }}
                className={`px-2 py-0.5 text-[9px] font-mono border transition-colors ${
                  !showPartySkills
                    ? 'bg-[#313f37] border-[#d5b66c] text-[#e7d9a5] font-bold'
                    : 'bg-[#18201c] border-[#435248] text-[#9aa697]'
                }`}
              >
                CÁ NHÂN
              </button>
              <button
                onClick={() => {
                  SoundSystem.playSelect();
                  setShowPartySkills(true);
                }}
                className={`px-2 py-0.5 text-[9px] font-mono border flex items-center gap-1 transition-colors ${
                  showPartySkills
                    ? 'bg-[#313f37] border-[#7caa79] text-[#a4d4a0] font-bold'
                    : 'bg-[#18201c] border-[#435248] text-[#9aa697]'
                }`}
              >
                <Users size={10} />
                TỔ ĐỘI
              </button>
            </div>
          </div>

          {/* Action Commands or Party Assist Skills */}
          {!battle.result ? (
            !showPartySkills ? (
              <div className="grid grid-cols-2 gap-1.5 my-auto">
                {/* 1. Attack Button */}
                <button
                  onClick={handleAttack}
                  disabled={!isPlayerTurn}
                  className={`min-h-[46px] py-2 px-2.5 text-xs font-semibold font-mono tracking-wider border cursor-pointer transition-all active:scale-[0.98] touch-manipulation flex items-center justify-between bg-[#39443a] hover:bg-[#4a584c] border-[#d5b66c] text-[#e7d9a5] ${
                    !isPlayerTurn ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Swords size={13} /> TẤN CÔNG
                  </span>
                  <span className="text-[8px] font-mono opacity-80">ATK</span>
                </button>

                {/* 2. Skills & Magic (Opens 40-Skill Grimoire) */}
                <button
                  onClick={() => {
                    SoundSystem.playSelect();
                    setShowSkillGrimoire(true);
                  }}
                  disabled={!isPlayerTurn}
                  className={`min-h-[46px] py-2 px-2.5 text-xs font-semibold font-mono tracking-wider border cursor-pointer transition-all active:scale-[0.98] touch-manipulation flex items-center justify-between bg-gradient-to-r from-[#3b2d18] to-[#4d3a1f] hover:from-[#4d3a1f] hover:to-[#5e4726] border-[#ffd666] text-[#fff1b8] ${
                    !isPlayerTurn ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-[#ffd666]" /> KỸ NĂNG (40)
                  </span>
                  <span className="text-[8px] font-mono px-1 py-0.5 bg-black/60 rounded text-[#ffd666]">
                    MP
                  </span>
                </button>

                {/* 3. Guard (Pure Defense - No Attack) */}
                <button
                  onClick={handleGuard}
                  disabled={!isPlayerTurn}
                  className={`min-h-[46px] py-2 px-2.5 text-xs font-semibold font-mono tracking-wider border cursor-pointer transition-all active:scale-[0.98] touch-manipulation flex items-center justify-between bg-[#192b3a] hover:bg-[#253e54] border-[#79c0ff] text-[#bae0ff] ${
                    !isPlayerTurn ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  title="Dựng khiên thủ thế, giảm 50% sát thương nhận vào"
                >
                  <span className="flex items-center gap-1.5">
                    <Shield size={13} className="text-[#79c0ff]" /> PHÒNG THỦ
                  </span>
                  <span className="text-[8px] font-mono px-1 py-0.5 bg-black/60 rounded text-[#79c0ff]">
                    -50% DMG
                  </span>
                </button>

                {/* 4. Item (Potion Heal - No Attack) */}
                <button
                  onClick={handleUseItem}
                  disabled={!isPlayerTurn || potionCount <= 0}
                  className={`min-h-[46px] py-2 px-2.5 text-xs font-semibold font-mono tracking-wider border cursor-pointer transition-all active:scale-[0.98] touch-manipulation flex items-center justify-between bg-[#1b3323] hover:bg-[#274732] border-[#7caa79] text-[#d9f7be] ${
                    !isPlayerTurn || potionCount <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  title="Uống Dược Phẩm: Hồi 35 HP, thanh tẩy debuff và nhận Tái Sinh"
                >
                  <span className="flex items-center gap-1.5">
                    <Package size={13} className="text-[#7caa79]" /> DƯỢC PHẨM
                  </span>
                  <span className="text-[8px] font-mono px-1 py-0.5 bg-black/60 rounded text-[#7caa79]">
                    x{potionCount}
                  </span>
                </button>
              </div>
            ) : (
              /* Companion Party Assist Skills Panel */
              <div className="space-y-1.5 my-auto">
                <button
                  onClick={() => handlePartyAssist('arrow_volley')}
                  disabled={!isPlayerTurn || battle.player.mp < 10}
                  className="w-full min-h-[42px] p-2 bg-[#1b261f] hover:bg-[#28382d] border border-[#7caa79]/70 text-left cursor-pointer transition-all active:scale-[0.98] touch-manipulation flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="text-[11px] font-bold font-serif text-[#a4d4a0] flex items-center gap-1">
                      <span>Lio Fen: Bão Tên Độc</span>
                      <span className="text-[9px] font-mono text-[#d5b66c]">10 MP</span>
                    </div>
                    <div className="text-[8px] font-mono text-[#8a998c]">
                      Bắn toàn bộ quái vật và gây Trúng Độc (7 DMG/lượt).
                    </div>
                  </div>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 bg-[#111f16] text-[#7caa79] border border-[#7caa79]/40 rounded-xs shrink-0 flex items-center gap-0.5">
                    <Biohazard size={8} /> ĐỘC
                  </span>
                </button>

                <button
                  onClick={() => handlePartyAssist('radiant_mend')}
                  disabled={!isPlayerTurn || battle.player.mp < 12}
                  className="w-full min-h-[42px] p-2 bg-[#1f2329] hover:bg-[#2c333d] border border-[#75a6bf]/70 text-left cursor-pointer transition-all active:scale-[0.98] touch-manipulation flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="text-[11px] font-bold font-serif text-[#a8d3e8] flex items-center gap-1">
                      <span>Mira Sol: Hộ Thể Thánh Quang</span>
                      <span className="text-[9px] font-mono text-[#d5b66c]">12 MP</span>
                    </div>
                    <div className="text-[8px] font-mono text-[#8a998c]">
                      Hồi 45 HP, tẩy debuff, ban Tái Sinh & Kiên Cố.
                    </div>
                  </div>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 bg-[#121c24] text-[#75a6bf] border border-[#75a6bf]/40 rounded-xs shrink-0 flex items-center gap-0.5">
                    <ShieldCheck size={8} /> TRỊ LIỆU
                  </span>
                </button>

                <button
                  onClick={() => handlePartyAssist('battle_cry')}
                  disabled={!isPlayerTurn || battle.player.mp < 8}
                  className="w-full p-1.5 bg-[#2a2419] hover:bg-[#3d3322] border border-[#d5b66c]/70 text-left cursor-pointer transition-colors flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="text-[11px] font-bold font-serif text-[#ffd666] flex items-center gap-1">
                      <span>Aster Vale: Tiếng Gầm Chiến Trận</span>
                      <span className="text-[9px] font-mono text-[#d5b66c]">8 MP</span>
                    </div>
                    <div className="text-[8px] font-mono text-[#8a998c]">
                      Tăng 40% Công & 40% Tốc độ trong 3 lượt.
                    </div>
                  </div>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 bg-[#1f190e] text-[#ffd666] border border-[#ffd666]/40 rounded-xs shrink-0 flex items-center gap-0.5">
                    <Zap size={8} /> TĂNG LỰC
                  </span>
                </button>
              </div>
            )
          ) : (
            /* Battle Result Actions */
            <div className="flex flex-col gap-2 my-auto">
              {battle.result === 'victory' && (
                <div className="p-2 bg-[#17241c] border border-[#52c41a]/50 rounded text-xs font-mono mb-1">
                  <div className="flex items-center justify-between text-[#73d13d] font-bold mb-1">
                    <span>⚔️ CHIẾN THẮNG TRẬN ĐẤU!</span>
                    <span className="text-[#ffd666]">
                      +{victoryRewards.xp} EXP • +{victoryRewards.gold} VÀNG
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9aa697] space-y-0.5 max-h-16 overflow-y-auto">
                    {victoryRewards.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.name} (Cấp {item.level}):</span>
                        <span className="text-[#e4dec8]">+{item.xp} EXP, +{item.gold} Vàng</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleReturn}
                className="w-full py-2.5 px-3 bg-[#39443a] hover:bg-[#4a584c] border-2 border-[#d5b66c] text-xs font-mono font-bold text-[#e7d9a5] cursor-pointer shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              >
                <Sparkles size={14} className="text-[#ffd666]" />
                {battle.result === 'victory'
                  ? encounter.kind === 'boss'
                    ? 'HOÀN THÀNH TẦNG HẦM NGỤC (LÊN CẤP & NHẬN THƯỞNG)!'
                    : `QUAY LẠI KHÁM PHÁ (NHẬN +${victoryRewards.xp} EXP)`
                  : 'RÚT LUI VỀ CĂN CỨ'}
              </button>

              {battle.result === 'victory' && (
                <button
                  onClick={() => setShowSkillTree(true)}
                  className="w-full py-1.5 px-3 bg-[#243329] hover:bg-[#324538] border border-[#ffd666] text-[11px] font-mono font-bold text-[#ffd666] cursor-pointer transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={12} /> CÂY KỸ NĂNG & THIÊN PHÚ [K]
                </button>
              )}

              {battle.result === 'defeat' && (
                <button
                  onClick={handleReplay}
                  className="w-full py-1.5 px-3 bg-[#242f2b] hover:bg-[#35443b] border border-[#59695d] text-[10px] font-mono text-[#c4c2ad] cursor-pointer transition-colors text-center"
                >
                  THỬ LẠI TRẬN ĐẤU
                </button>
              )}
            </div>
          )}

          {/* Retreat button */}
          {!battle.result && (
            <div className="pt-1.5 border-t border-[#313f37] flex justify-between items-center text-[10px] font-mono">
              <button
                onClick={() => {
                  SoundSystem.playSelect();
                  handleReturn();
                }}
                disabled={!isPlayerTurn}
                className="text-[#9aa697] hover:text-[#e4dec8] cursor-pointer flex items-center gap-1 disabled:opacity-40"
              >
                <Flag size={10} /> RÚT LUI KHỎI TRẬN
              </button>
              <span className="text-[#899589]">
                {battle.enemies.filter((e) => e.hp > 0).length} QUÁI CÒN SỐNG
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grimoire Modal (Only Learned Skills) */}
      {showSkillGrimoire && (
        <SkillGrimoireModal
          playerMp={battle.player.mp}
          playerMaxMp={battle.player.maxMp}
          enemies={battle.enemies}
          selectedEnemyId={battle.selectedEnemyId}
          unlockedSkills={gameState.player?.unlockedSkills || { power_strike: 1 }}
          playerStats={gameState.player?.stats || { hp: 120, mp: 24, atk: 18, matk: 5, def: 13, mdef: 8, spd: 10 }}
          playerLevel={gameState.player?.level || 1}
          onCastSkill={handleCastSkill}
          onOpenSkillTree={() => {
            setShowSkillGrimoire(false);
            setShowSkillTree(true);
          }}
          onClose={() => setShowSkillGrimoire(false)}
        />
      )}

      {/* In-Battle Skill Tree Modal */}
      {showSkillTree && (
        <SkillTreeModal
          gameState={gameState}
          onUpdateGameState={(nextState) => {
            onUpdateGameState(nextState);
            if (nextState.player?.stats) {
              setBattle((prev) => ({
                ...prev,
                player: {
                  ...prev.player,
                  atk: nextState.player.stats.atk,
                  def: nextState.player.stats.def,
                  matk: nextState.player.stats.matk,
                  maxHp: nextState.player.stats.hp,
                  maxMp: nextState.player.stats.mp,
                },
              }));
            }
          }}
          onClose={() => setShowSkillTree(false)}
        />
      )}
    </div>
  );
};
