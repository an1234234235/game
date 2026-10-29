import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, FloorEncounter, EnemyTemplate } from '../types/game';
import { getFloorDefinition, getFloorEncounters, createEncounterEnemyGroup } from '../data/floors';
import { ENEMIES } from '../data/enemies';
import { saveGameState } from '../systems/SaveSystem';
import { InventoryModal } from './Modals/InventoryModal';
import { FormationModal } from './Modals/FormationModal';
import { WorldMapModal } from './Modals/WorldMapModal';
import { PauseModal } from './Modals/PauseModal';
import { SkillTreeModal } from './Modals/SkillTreeModal';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Sparkles,
  Package,
  Users,
  Compass,
  Menu,
  Flame,
  Swords,
  Footprints,
  Shield,
  Eye,
  Lock,
} from 'lucide-react';
import { SoundSystem } from '../systems/SoundSystem';

interface ExplorationScreenProps {
  gameState: GameState;
  onUpdateGameState: (state: GameState) => void;
  onStartBattle: (encounter: FloorEncounter, enemyGroup: EnemyTemplate[]) => void;
  onReturnToMenu: () => void;
  onRestartFloor: () => void;
}

const MAP_WIDTH = 14;
const MAP_HEIGHT = 9;

export const ExplorationScreen: React.FC<ExplorationScreenProps> = ({
  gameState,
  onUpdateGameState,
  onStartBattle,
  onReturnToMenu,
  onRestartFloor,
}) => {
  const [activeModal, setActiveModal] = useState<
    'inventory' | 'formation' | 'worldmap' | 'pause' | 'skilltree' | null
  >(null);
  const [notice, setNotice] = useState('Không khí tĩnh lặng. Ánh sáng đèn cổ rọi qua màn sương mù tăm tối...');
  const [isMuted, setIsMuted] = useState(() => SoundSystem.getMuted());

  const currentSp = Number(gameState.player?.skillPoints ?? gameState.skillPoints ?? 0);

  const floorNumber = gameState.dungeon.floor ?? 1;
  const floorDef = useMemo(() => getFloorDefinition(floorNumber), [floorNumber]);
  const encounters = useMemo(() => getFloorEncounters(floorNumber), [floorNumber]);

  const walls = useMemo(() => new Set(floorDef.walls || []), [floorDef.walls]);
  const floorChests = useMemo(() => floorDef.chests || [], [floorDef.chests]);
  const floorShrines = useMemo(() => floorDef.shrines || [], [floorDef.shrines]);
  const bossPos = useMemo(() => floorDef.bossPos || { x: 10, y: 4 }, [floorDef.bossPos]);

  const { playerX, playerY, defeatedEncounters = [] } = gameState.dungeon;

  // Check which encounters are active
  const monstersRemain = encounters.some((c) => c.kind === 'monster' && !defeatedEncounters.includes(c.id));

  // Determine nearby entity
  const nearbyEncounter = encounters.find(
    (c) => Math.abs(playerX - c.x) + Math.abs(playerY - c.y) <= 1 && !defeatedEncounters.includes(c.id)
  );

  const nearbyChest = floorChests.find(
    (ch) => Math.abs(playerX - ch.x) + Math.abs(playerY - ch.y) <= 1
  );
  const isChestOpened = nearbyChest ? defeatedEncounters.includes(nearbyChest.id) : false;

  const nearbyShrine = floorShrines.find(
    (sh) => Math.abs(playerX - sh.x) + Math.abs(playerY - sh.y) <= 1
  );

  // Player move handler
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (activeModal) return;

      const nextX = playerX + dx;
      const nextY = playerY + dy;
      const enemyBlocked = !gameState.dungeon.enemyDefeated && nextX === bossPos.x && nextY === bossPos.y && monstersRemain;

      if (
        nextX < 1 ||
        nextX > MAP_WIDTH - 2 ||
        nextY < 1 ||
        nextY > MAP_HEIGHT - 2 ||
        walls.has(`${nextX},${nextY}`) ||
        enemyBlocked
      ) {
        if (enemyBlocked) {
          SoundSystem.playSelect();
          setNotice('Cánh cổng phòng trùm bị phong ấn ma thuật! Hãy tiêu diệt hết quái vật trong tầng trước.');
        }
        return;
      }

      SoundSystem.playDungeonStep();

      const nextState: GameState = {
        ...gameState,
        dungeon: {
          ...gameState.dungeon,
          playerX: nextX,
          playerY: nextY,
        },
      };

      saveGameState(nextState, 'default');
      onUpdateGameState(nextState);
    },
    [activeModal, gameState, onUpdateGameState, playerX, playerY, walls, bossPos, monstersRemain]
  );

  // Interact handler
  const handleInteract = useCallback(() => {
    if (activeModal) return;

    // 1. Check nearby monster encounter
    if (nearbyEncounter) {
      if (nearbyEncounter.kind === 'boss' && monstersRemain) {
        SoundSystem.playSelect();
        setNotice('Phòng trùm bị khóa bởi cổ tự bóng tối. Cần quét sạch quái vật trong tầng trước!');
        return;
      }

      SoundSystem.playSelect();
      saveGameState(gameState, 'default');
      const enemyIds = createEncounterEnemyGroup(nearbyEncounter);
      const enemyGroup: EnemyTemplate[] = enemyIds.map((id) => (ENEMIES as Record<string, EnemyTemplate>)[id] || ENEMIES['ice-king']);
      onStartBattle(nearbyEncounter, enemyGroup);
      return;
    }

    // 2. Check interactive chest
    if (nearbyChest) {
      if (!isChestOpened) {
        SoundSystem.playChestOpen();
        const goldFound = nearbyChest.gold || 30;
        const nextInventory = gameState.inventory.map((item) =>
          item.id === 'potion' ? { ...item, quantity: item.quantity + 1 } : item
        );
        const nextState: GameState = {
          ...gameState,
          inventory: nextInventory,
          gold: (gameState.gold ?? 0) + goldFound,
          dungeon: {
            ...gameState.dungeon,
            defeatedEncounters: [...defeatedEncounters, nearbyChest.id],
          },
        };
        saveGameState(nextState, 'default');
        onUpdateGameState(nextState);
        setNotice(`✨ Bạn đã mở "${nearbyChest.name}"! Nhận được +1 Bình Dược Liệu và +${goldFound} Vàng!`);
      } else {
        SoundSystem.playSelect();
        setNotice('Rương đá đã được mở trống không.');
      }
      return;
    }

    // 3. Check interactive Hearthfire Shrine
    if (nearbyShrine) {
      SoundSystem.playRest();
      const nextHp = gameState.player.stats.hp;
      const nextMp = gameState.player.stats.mp;

      const nextState: GameState = {
        ...gameState,
        player: {
          ...gameState.player,
          currentHp: nextHp,
          currentMp: nextMp,
          statusEffects: [],
        },
        party: gameState.party.map((m) => ({
          ...m,
          currentHp: m.stats.hp,
          currentMp: m.stats.mp,
          statusEffects: [],
        })),
      };

      saveGameState(nextState, 'default');
      onUpdateGameState(nextState);
      setNotice(`🔥 "${nearbyShrine.name}" tỏa ánh lửa thiêng dịu ấm. Toàn đội đã hồi phục 100% HP & MP!`);
      return;
    }

    SoundSystem.playSelect();
    setNotice('Không có mục tiêu nào trong tầm tay để tương tác.');
  }, [activeModal, nearbyEncounter, monstersRemain, gameState, onStartBattle, nearbyChest, isChestOpened, nearbyShrine, defeatedEncounters, onUpdateGameState]);

  // Use Potion from Inventory
  const handleUseItem = (itemId: string) => {
    if (itemId === 'potion') {
      const potion = gameState.inventory.find((i) => i.id === 'potion');
      if (!potion || potion.quantity <= 0) return;
      if (gameState.player.currentHp >= gameState.player.stats.hp) {
        SoundSystem.playSelect();
        setNotice('Máu của anh hùng đã đầy.');
        return;
      }

      SoundSystem.playHeal();
      const healed = Math.min(35, gameState.player.stats.hp - gameState.player.currentHp);
      const nextHp = gameState.player.currentHp + healed;

      const nextState: GameState = {
        ...gameState,
        player: {
          ...gameState.player,
          currentHp: nextHp,
        },
        party: gameState.party.map((m, i) => (i === 0 ? { ...m, currentHp: nextHp } : m)),
        inventory: gameState.inventory.map((i) =>
          i.id === 'potion' ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };

      saveGameState(nextState, 'default');
      onUpdateGameState(nextState);
      setNotice(`✨ Đã dùng Bình Dược Liệu hồi phục +${healed} HP cho Aster Vale.`);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModal) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer(1, 0);
          break;
        case 'e':
        case 'E':
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleInteract();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setActiveModal((m) => (m === 'inventory' ? null : 'inventory'));
          break;
        case 'k':
        case 'K':
        case 't':
        case 'T':
          e.preventDefault();
          setActiveModal((m) => (m === 'skilltree' ? null : 'skilltree'));
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setActiveModal((m) => (m === 'worldmap' ? null : 'worldmap'));
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          setActiveModal((m) => (m === 'pause' ? null : 'pause'));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, handleInteract, activeModal]);

  const potionItem = gameState.inventory.find((i) => i.id === 'potion');
  const potionCount = potionItem ? potionItem.quantity : 0;

  // Biome-specific styling
  const biomeTheme = useMemo(() => {
    switch (floorDef.biome) {
      case 'magma':
        return {
          wallBg: 'bg-[#3d1e18] border-[#8a4230]',
          innerWall: 'bg-[#2b1410] border-[#5e2d21]',
          floorEven: 'bg-[#261917] hover:bg-[#382320]',
          floorOdd: 'bg-[#211513] hover:bg-[#331f1c]',
          accent: '#e87d56',
          gridBorder: 'border-[#8a4230]/60',
          decorTorch: '🔥',
        };
      case 'ice':
        return {
          wallBg: 'bg-[#1c2e3d] border-[#427094]',
          innerWall: 'bg-[#14212c] border-[#294860]',
          floorEven: 'bg-[#172530] hover:bg-[#223645]',
          floorOdd: 'bg-[#131f29] hover:bg-[#1e2f3d]',
          accent: '#69c0ff',
          gridBorder: 'border-[#427094]/60',
          decorTorch: '❄️',
        };
      case 'roots':
        return {
          wallBg: 'bg-[#1e3023] border-[#446d4e]',
          innerWall: 'bg-[#152119] border-[#2c4733]',
          floorEven: 'bg-[#19261d] hover:bg-[#25382b]',
          floorOdd: 'bg-[#141f18] hover:bg-[#203024]',
          accent: '#7caa79',
          gridBorder: 'border-[#446d4e]/60',
          decorTorch: '🌿',
        };
      case 'crown':
        return {
          wallBg: 'bg-[#3b3524] border-[#8a794c]',
          innerWall: 'bg-[#282317] border-[#594e31]',
          floorEven: 'bg-[#262217] hover:bg-[#383322]',
          floorOdd: 'bg-[#201c13] hover:bg-[#302b1c]',
          accent: '#d5b66c',
          gridBorder: 'border-[#8a794c]/60',
          decorTorch: '⚜️',
        };
      case 'archive':
      default:
        return {
          wallBg: 'bg-[#24332e] border-[#536e64]',
          innerWall: 'bg-[#192420] border-[#364942]',
          floorEven: 'bg-[#1c2724] hover:bg-[#283833]',
          floorOdd: 'bg-[#17211e] hover:bg-[#23312c]',
          accent: '#7caa79',
          gridBorder: 'border-[#536e64]/60',
          decorTorch: '🕯️',
        };
    }
  }, [floorDef.biome]);

  return (
    <div className="relative w-full min-h-[100dvh] lg:min-h-0 lg:h-full flex flex-col justify-between bg-[#0e1413] p-2 sm:p-4 select-none text-[#e4dec8] overflow-y-auto">
      {/* Outer border */}
      <div className="absolute inset-1 sm:inset-3 border border-[#59695d]/60 pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between border-b border-[#59695d] pb-2 sm:pb-3 px-2 sm:px-4 gap-2">
        <div>
          <h1 className="font-serif text-lg sm:text-2xl text-[#e2c77b] tracking-wider font-normal">
            LANTERNFALL
          </h1>
          <p className="text-[9px] sm:text-xs text-[#9aa697] tracking-wider uppercase font-mono">
            TẦNG {floorDef.floor}: {floorDef.nameVi.toUpperCase()} ({floorDef.name.toUpperCase()})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <PWAInstallButton />

          {/* Sound Mute Toggle */}
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

          {/* Rest Shrines indicator */}
          <div className="flex items-center gap-1 px-2 py-1 bg-[#1b2421] border border-[#59695d] text-[10px] font-mono text-[#e2c77b]">
            <Flame size={12} className="text-[#ff9b5e] animate-pulse" />
            <span className="hidden sm:inline">TẾ ĐÀN:</span>
            <span>{floorShrines.length}</span>
          </div>

          {/* Skill Tree / SP button */}
          <button
            onClick={() => {
              SoundSystem.playSelect();
              setActiveModal('skilltree');
            }}
            className="flex items-center gap-1 px-2 py-1 bg-[#202b26] hover:bg-[#2e3e35] border border-[#d5b66c] text-[10px] font-mono text-[#ffd666] cursor-pointer transition-colors shadow-sm"
            title="Mở Cây Kỹ Năng & Thiên Phú (Phím K)"
          >
            <Sparkles size={11} className="text-[#ffd666] animate-pulse" />
            <span className="font-bold">{currentSp} SP</span>
          </button>

          {/* Floor badge */}
          <span className="text-[10px] sm:text-xs font-mono tracking-wider px-2 sm:px-3 py-1 bg-[#202b26] border border-[#d5b66c]/60 text-[#e7d9a5]">
            TẦNG {floorDef.floor} / 5
          </span>
        </div>
      </div>

      {/* Main Dungeon Exploration Area */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 my-2 flex-1">
        {/* Left Column: Explorer Vitals & Quick Inventory */}
        <div className="lg:col-span-3 bg-[#17201d] border border-[#59695d] p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#313f37] pb-1.5 mb-2">
              <span className="text-[10px] font-mono text-[#d5b66c] uppercase tracking-wider">
                THÔNG TIN NHÓM THÁM HIỂM
              </span>
              <span className="text-[9px] font-mono text-[#9aa697]">
                VÀNG: {gameState.gold ?? 0} G
              </span>
            </div>

            {/* Leader Vitals */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-serif font-bold text-[#e4dec8]">{gameState.player.name}</span>
                <span className="text-[9px] text-[#9aa697] uppercase">CHIẾN BINH (CẤP {gameState.player.level || 1})</span>
              </div>

              {/* HP Bar */}
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-0.5">
                  <span className="text-[#9aa697]">HP (MÁU)</span>
                  <span className="text-[#e4dec8]">
                    {gameState.player.currentHp} / {gameState.player.stats.hp}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#151b18] border border-[#59695d] rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-[#7caa79] transition-all duration-300"
                    style={{
                      width: `${Math.max(0, Math.min(1, gameState.player.currentHp / (gameState.player.stats.hp || 1))) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* MP Bar */}
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-0.5">
                  <span className="text-[#9aa697]">MP (MANA)</span>
                  <span className="text-[#e4dec8]">
                    {gameState.player.currentMp} / {gameState.player.stats.mp}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#151b18] border border-[#59695d] rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-[#75a6bf] transition-all duration-300"
                    style={{
                      width: `${Math.max(0, Math.min(1, gameState.player.currentMp / (gameState.player.stats.mp || 1))) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Item Use */}
            <div className="p-2 bg-[#1b2421] border border-[#435248] rounded-xs mb-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#d5b66c] mb-1.5">
                <span className="flex items-center gap-1">
                  <Package size={11} /> DƯỢC PHẨM NHANH
                </span>
                <span>x{potionCount}</span>
              </div>
              <button
                onClick={() => handleUseItem('potion')}
                disabled={potionCount <= 0 || gameState.player.currentHp >= gameState.player.stats.hp}
                className="w-full py-1.5 px-2 bg-[#2d3a33] hover:bg-[#3b4b42] disabled:opacity-40 border border-[#59695d] text-[10px] font-mono text-[#c4c2ad] cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                UỐNG BÌNH HỒI MÁU (+35 HP)
              </button>
            </div>

            {/* Party roster */}
            <div>
              <div className="text-[10px] font-mono text-[#9aa697] uppercase tracking-wider mb-1">
                ĐỒNG ĐỘI ({gameState.party.length})
              </div>
              <div className="space-y-1">
                {gameState.party.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-1.5 bg-[#202b26] border border-[#435248] text-xs font-mono"
                  >
                    <span className="text-[#e4dec8]">{member.name}</span>
                    <span className="text-[9px] text-[#9aa697] uppercase">{member.classId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status & Field Notes */}
          <div className="mt-3 pt-2 border-t border-[#313f37]">
            <div className="p-2 bg-[#1b2421] border border-[#303d35] text-xs text-[#c7c8b2] italic leading-relaxed min-h-[46px]">
              "{notice}"
            </div>
          </div>
        </div>

        {/* Center Column: Floor Map & Ergonomic Controls */}
        <div className="lg:col-span-6 bg-[#17201d] border border-[#59695d] p-2.5 sm:p-4 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex items-center justify-between border-b border-[#59695d] pb-1.5 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-1 bg-[#d5b66c]" />
              <h2 className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#d5b66c] uppercase">
                BẢN ĐỒ CHI TIẾT TẦNG {floorDef.floor}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono text-[#899589] uppercase tracking-wider">
              <span>{floorDef.nameVi}</span>
              <span className="text-[#c89582]">{monstersRemain ? `(${encounters.filter(e => e.kind === 'monster' && !defeatedEncounters.includes(e.id)).length} QUÁI CÒN LẠI)` : 'ĐÃ DỌN SẠCH QUÁI'}</span>
            </div>
          </div>

          {/* Interactive Atmospheric Grid Map */}
          <div className={`relative my-auto p-1.5 sm:p-2 bg-[#121917] border-2 ${biomeTheme.gridBorder} shadow-2xl max-w-full overflow-x-auto touch-manipulation rounded-xs`}>
            <div
              className="grid gap-[1px] select-none mx-auto bg-[#0a0f0e] p-[1px]"
              style={{
                gridTemplateColumns: `repeat(${MAP_WIDTH}, minmax(20px, 32px))`,
                gridTemplateRows: `repeat(${MAP_HEIGHT}, minmax(20px, 32px))`,
              }}
            >
              {Array.from({ length: MAP_HEIGHT }).map((_, r) =>
                Array.from({ length: MAP_WIDTH }).map((_, c) => {
                  const key = `${c},${r}`;
                  const isWall = walls.has(key);
                  const isPlayer = playerX === c && playerY === r;

                  const encounter = encounters.find(
                    (enc) => enc.x === c && enc.y === r && !defeatedEncounters.includes(enc.id)
                  );
                  const isBossLocked = encounter?.kind === 'boss' && monstersRemain;

                  const chest = floorChests.find((ch) => ch.x === c && ch.y === r);
                  const chestOpened = chest ? defeatedEncounters.includes(chest.id) : false;

                  const shrine = floorShrines.find((sh) => sh.x === c && sh.y === r);

                  // Distance from player for lantern lighting
                  const distFromPlayer = Math.sqrt((playerX - c) ** 2 + (playerY - r) ** 2);
                  const isIlluminated = distFromPlayer <= 3.2;

                  const isEven = (r + c) % 2 === 0;

                  return (
                    <div
                      key={key}
                      onClick={() => {
                        const dist = Math.abs(playerX - c) + Math.abs(playerY - r);
                        if (dist === 1) {
                          movePlayer(c - playerX, r - playerY);
                        } else if (dist === 0) {
                          handleInteract();
                        }
                      }}
                      className={`relative aspect-square flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ${
                        isWall
                          ? `${biomeTheme.wallBg} border-t border-l border-white/10 shadow-inner`
                          : isEven
                            ? biomeTheme.floorEven
                            : biomeTheme.floorOdd
                      } ${!isIlluminated ? 'brightness-75' : 'brightness-105'}`}
                      title={`Vị trí: (${c}, ${r})`}
                    >
                      {/* 3D Wall Brick Effect */}
                      {isWall && (
                        <div className={`w-[78%] h-[78%] border border-black/50 ${biomeTheme.innerWall} rounded-[1px] flex items-center justify-center`}>
                          {(c + r) % 5 === 0 && (
                            <span className="text-[7px] opacity-75">{biomeTheme.decorTorch}</span>
                          )}
                        </div>
                      )}

                      {/* Floor Subtle Cobblestone Center */}
                      {!isWall && !isPlayer && !encounter && !chest && !shrine && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/5 pointer-events-none" />
                      )}

                      {/* Chest Marker */}
                      {chest && !isPlayer && (
                        <div
                          className={`w-[85%] h-[85%] border rounded-[2px] flex flex-col items-center justify-center shadow-md transition-transform hover:scale-110 ${
                            chestOpened
                              ? 'bg-[#2b241c] border-[#5e4f3a]'
                              : 'bg-gradient-to-b from-[#f5d580] to-[#b58b38] border-[#ffe8a8] ring-1 ring-[#e2c77b]/50 animate-pulse'
                          }`}
                          title={chestOpened ? 'Rương rỗng' : `Rương cổ: ${chest.name}`}
                        >
                          <span className={`text-[9px] font-bold ${chestOpened ? 'text-[#877963]' : 'text-[#241a05]'}`}>
                            {chestOpened ? '⌸' : '🎁'}
                          </span>
                        </div>
                      )}

                      {/* Hearthfire Shrine Marker */}
                      {shrine && !isPlayer && (
                        <div
                          className="w-[85%] h-[85%] bg-gradient-to-t from-[#8a3319] to-[#e87d56] border border-[#ffc199] rounded-[2px] flex items-center justify-center shadow-[0_0_10px_#e87d56] animate-pulse hover:scale-110"
                          title={`Tế Đàn Hồi Phục: ${shrine.name}`}
                        >
                          <span className="text-[10px] leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            ♨
                          </span>
                        </div>
                      )}

                      {/* Monster or Boss Marker */}
                      {encounter && !isPlayer && (
                        <div
                          className={`w-[85%] h-[85%] border-2 rounded-[2px] flex flex-col items-center justify-center transition-all ${
                            encounter.kind === 'boss'
                              ? 'bg-gradient-to-b from-[#a82e2e] to-[#591616] border-[#ff7875] ring-2 ring-red-500/60 shadow-[0_0_12px_rgba(255,77,79,0.8)]'
                              : 'bg-gradient-to-b from-[#8c5737] to-[#4d2f1d] border-[#d48855] shadow-[0_0_8px_rgba(212,136,85,0.7)]'
                          } ${isBossLocked ? 'opacity-40 grayscale' : 'opacity-100 animate-bounce'}`}
                          title={encounter.kind === 'boss' ? (isBossLocked ? 'Phòng Trùm (Bị Phong Ấn)' : 'TRÙM TẦNG!') : 'Quái Vật'}
                        >
                          {encounter.kind === 'boss' ? (
                            isBossLocked ? (
                              <Lock size={11} className="text-white/80" />
                            ) : (
                              <span className="text-[10px] font-bold text-[#fff1b8] leading-none">👑</span>
                            )
                          ) : (
                            <span className="text-[9px] font-bold text-[#ffffff] leading-none">💀</span>
                          )}
                        </div>
                      )}

                      {/* Animated Player Marker (Lantern Bearer) */}
                      {isPlayer && (
                        <div className="relative w-full h-full flex items-center justify-center z-20">
                          {/* Lantern Light Ring */}
                          <div className="absolute inset-[-4px] rounded-full bg-[#fadb14]/20 blur-[3px] pointer-events-none animate-ping" />
                          <div className="w-[86%] h-[86%] bg-gradient-to-b from-[#7caa79] to-[#386b45] border-2 border-[#fffb8f] rounded-[3px] shadow-[0_0_10px_#7caa79] flex items-center justify-center">
                            <span className="text-[10px] font-black text-[#111716] leading-none">
                              ⚔️
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Map Legend & Exploration Guides */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1 py-1.5 border-t border-[#313f37] mt-2 text-[9px] font-mono text-[#9aa697]">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><span className="text-xs">⚔️</span> Bạn</span>
              <span className="flex items-center gap-1"><span className="text-xs">💀</span> Quái Vật</span>
              <span className="flex items-center gap-1"><span className="text-xs">👑</span> Trùm Tầng</span>
              <span className="flex items-center gap-1"><span className="text-xs">🎁</span> Rương Báu</span>
              <span className="flex items-center gap-1"><span className="text-xs">♨</span> Tế Đàn Hồi HP/MP</span>
            </div>
            <div className="text-[#d5b66c]">
              BẤM PHÍM MŨI TÊN HOẶC CHẠM Ô ĐỂ DI CHUYỂN
            </div>
          </div>

          {/* --- ERGONOMIC MOBILE & DESKTOP D-PAD CONTROLLER BAR --- */}
          <div className="w-full flex items-center justify-between gap-3 pt-2 border-t border-[#313f37] mt-1">
            {/* Quick Action Button: Interact / Attack / Open */}
            <button
              onClick={handleInteract}
              className={`flex-1 py-2 px-3 text-xs font-mono font-bold tracking-wider border cursor-pointer transition-all active:scale-[0.98] shadow-md touch-manipulation flex items-center justify-center gap-1.5 ${
                nearbyEncounter
                  ? 'bg-[#5e2b27] hover:bg-[#783731] border-[#d36e61] text-[#ffccc7] animate-pulse'
                  : nearbyChest && !isChestOpened
                    ? 'bg-[#5c4a1e] hover:bg-[#786128] border-[#d5b66c] text-[#fffb8f] animate-pulse'
                    : nearbyShrine
                      ? 'bg-[#2b4c38] hover:bg-[#386148] border-[#7caa79] text-[#d9f7be]'
                      : 'bg-[#202b26] hover:bg-[#2b3a33] border-[#59695d] text-[#e4dec8]'
              }`}
            >
              {nearbyEncounter ? (
                <>
                  <Swords size={13} />
                  <span>KHIÊU CHIẾN ({nearbyEncounter.kind === 'boss' ? 'TRÙM' : 'QUÁI'})</span>
                </>
              ) : nearbyChest ? (
                <>
                  <Package size={13} />
                  <span>{isChestOpened ? 'RƯƠNG ĐÃ MỞ' : 'MỞ RƯƠNG BÁU'}</span>
                </>
              ) : nearbyShrine ? (
                <>
                  <Flame size={13} />
                  <span>CẦU NGUYỆN (HỒI ĐẦY HP & MP)</span>
                </>
              ) : (
                <>
                  <Footprints size={13} />
                  <span>TƯƠNG TÁC (E / ENTER)</span>
                </>
              )}
            </button>

            {/* Virtual Ergonomic D-PAD for Mobile / Touch screens */}
            <div className="grid grid-cols-3 gap-1 w-[124px] shrink-0 touch-manipulation">
              <div />
              <button
                onClick={() => movePlayer(0, -1)}
                className="w-10 h-10 bg-[#25322b] hover:bg-[#34463c] active:bg-[#43594d] border border-[#59695d] rounded flex items-center justify-center text-[#e4dec8] cursor-pointer shadow-sm active:scale-95"
                title="Đi Lên (W / Mũi Tên Lên)"
              >
                <ArrowUp size={16} />
              </button>
              <div />

              <button
                onClick={() => movePlayer(-1, 0)}
                className="w-10 h-10 bg-[#25322b] hover:bg-[#34463c] active:bg-[#43594d] border border-[#59695d] rounded flex items-center justify-center text-[#e4dec8] cursor-pointer shadow-sm active:scale-95"
                title="Sang Trái (A / Mũi Tên Trái)"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={handleInteract}
                className="w-10 h-10 bg-[#3b4b42] hover:bg-[#4c6054] active:bg-[#5d7567] border border-[#d5b66c] rounded flex items-center justify-center text-[#ffd666] font-bold text-xs cursor-pointer shadow-sm active:scale-95"
                title="Tương tác"
              >
                OK
              </button>
              <button
                onClick={() => movePlayer(1, 0)}
                className="w-10 h-10 bg-[#25322b] hover:bg-[#34463c] active:bg-[#43594d] border border-[#59695d] rounded flex items-center justify-center text-[#e4dec8] cursor-pointer shadow-sm active:scale-95"
                title="Sang Phải (D / Mũi Tên Phải)"
              >
                <ArrowRight size={16} />
              </button>

              <div />
              <button
                onClick={() => movePlayer(0, 1)}
                className="w-10 h-10 bg-[#25322b] hover:bg-[#34463c] active:bg-[#43594d] border border-[#59695d] rounded flex items-center justify-center text-[#e4dec8] cursor-pointer shadow-sm active:scale-95"
                title="Đi Xuống (S / Mũi Tên Xuống)"
              >
                <ArrowDown size={16} />
              </button>
              <div />
            </div>
          </div>
        </div>

        {/* Right Column: Menu Modals Navigation & Dungeon Codex */}
        <div className="lg:col-span-3 bg-[#17201d] border border-[#59695d] p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#313f37] pb-1.5 mb-2">
              <span className="text-[10px] font-mono text-[#d5b66c] uppercase tracking-wider">
                QUẢN LÝ DÃ NGOẠI
              </span>
              <span className="text-[9px] font-mono text-[#9aa697]">MENU</span>
            </div>

            {/* Quick Menu Buttons */}
            <div className="space-y-1.5 mb-3">
              <button
                onClick={() => {
                  SoundSystem.playSelect();
                  setActiveModal('inventory');
                }}
                className="w-full flex items-center justify-between p-2 bg-[#202b26] hover:bg-[#2b3a33] border border-[#59695d] text-xs font-mono text-[#e4dec8] cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Package size={13} className="text-[#d5b66c]" /> HÀNH TRANG (INVENTORY)
                </span>
                <span className="text-[9px] text-[#9aa697]">[I]</span>
              </button>

              <button
                onClick={() => {
                  SoundSystem.playSelect();
                  setActiveModal('formation');
                }}
                className="w-full flex items-center justify-between p-2 bg-[#202b26] hover:bg-[#2b3a33] border border-[#59695d] text-xs font-mono text-[#e4dec8] cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Users size={13} className="text-[#7caa79]" /> ĐỘI HÌNH & KỸ NĂNG
                </span>
                <span className="text-[9px] text-[#9aa697]">[F]</span>
              </button>

              <button
                onClick={() => {
                  SoundSystem.playSelect();
                  setActiveModal('skilltree');
                }}
                className="w-full flex items-center justify-between p-2 bg-[#202b26] hover:bg-[#2b3a33] border border-[#d5b66c]/80 text-xs font-mono text-[#ffd666] cursor-pointer transition-colors group shadow-sm"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkles size={13} className="text-[#ffd666] group-hover:rotate-12 transition-transform" />
                  CÂY KỸ NĂNG (SKILL TREE)
                </span>
                <span className="flex items-center gap-1">
                  {currentSp > 0 && (
                    <span className="px-1.5 py-0.2 text-[9px] bg-[#d5b66c] text-[#141b18] font-bold rounded-xs animate-pulse">
                      +{currentSp} SP
                    </span>
                  )}
                  <span className="text-[9px] text-[#9aa697]">[K]</span>
                </span>
              </button>

              <button
                onClick={() => {
                  SoundSystem.playSelect();
                  setActiveModal('worldmap');
                }}
                className="w-full flex items-center justify-between p-2 bg-[#202b26] hover:bg-[#2b3a33] border border-[#59695d] text-xs font-mono text-[#e4dec8] cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Compass size={13} className="text-[#69c0ff]" /> BẢN ĐỒ THẾ GIỚI
                </span>
                <span className="text-[9px] text-[#9aa697]">[M]</span>
              </button>

              <button
                onClick={() => {
                  SoundSystem.playSelect();
                  setActiveModal('pause');
                }}
                className="w-full flex items-center justify-between p-2 bg-[#202b26] hover:bg-[#2b3a33] border border-[#59695d] text-xs font-mono text-[#e4dec8] cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Menu size={13} className="text-[#e87d56]" /> TÙY CHỌN & LƯU GAME
                </span>
                <span className="text-[9px] text-[#9aa697]">[ESC]</span>
              </button>
            </div>

            {/* Floor Lore Codex */}
            <div className="p-2.5 bg-[#1b2421] border border-[#435248] rounded-xs">
              <div className="text-[10px] font-mono text-[#d5b66c] uppercase mb-1 font-semibold">
                TRUYỀN THUYẾT: {floorDef.nameVi}
              </div>
              <p className="text-[11px] text-[#b8bfb4] leading-relaxed font-serif italic">
                "{floorDef.description}"
              </p>
              <div className="mt-2 pt-1.5 border-t border-[#313f37] flex justify-between text-[9px] font-mono text-[#9aa697]">
                <span>TRÙM: {ENEMIES[floorDef.boss]?.name || floorDef.boss}</span>
                <span className="text-[#d5b66c]">PHẦN THƯỞNG: +{floorDef.reward.gold} VÀNG</span>
              </div>
            </div>
          </div>

          {/* Quick Exit */}
          <div className="pt-2 border-t border-[#313f37]">
            <button
              onClick={onReturnToMenu}
              className="w-full py-1.5 px-3 bg-[#1e2622] hover:bg-[#29352f] border border-[#59695d] text-[10px] font-mono text-[#9aa697] cursor-pointer transition-colors text-center"
            >
              VỀ MENU CHÍNH (TIẾN TRÌNH ĐÃ LƯU)
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'inventory' && (
        <InventoryModal
          gameState={gameState}
          onClose={() => setActiveModal(null)}
          onUseItem={handleUseItem}
        />
      )}
      {activeModal === 'formation' && (
        <FormationModal
          gameState={gameState}
          onClose={() => setActiveModal(null)}
          onUpdateParty={(nextParty) => {
            const nextState = { ...gameState, party: nextParty };
            saveGameState(nextState, 'default');
            onUpdateGameState(nextState);
          }}
        />
      )}
      {activeModal === 'worldmap' && (
        <WorldMapModal
          currentFloor={floorNumber}
          onClose={() => setActiveModal(null)}
          onSelectFloor={(floor) => {
            // Optional teleport if unlocked
            setActiveModal(null);
          }}
        />
      )}
      {activeModal === 'pause' && (
        <PauseModal
          onClose={() => setActiveModal(null)}
          onRestartFloor={onRestartFloor}
          onReturnToMenu={onReturnToMenu}
        />
      )}
      {activeModal === 'skilltree' && (
        <SkillTreeModal
          gameState={gameState}
          onUpdateGameState={onUpdateGameState}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};
