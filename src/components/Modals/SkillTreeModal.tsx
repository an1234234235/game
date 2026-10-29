import React, { useState, useMemo } from 'react';
import { GameState } from '../../types/game';
import {
  SKILL_BRANCHES,
  SKILL_TREE_NODES,
  SkillBranchId,
  SkillTreeNode,
  canUnlockOrUpgradeNode,
  getNodeRequiredLevel,
  getSkillTreeNode,
} from '../../data/skillTreeData';
import {
  unlockOrUpgradeSkill,
  resetSkillTreeState,
  getRequiredExpForLevel,
  calculateSkillTreePassives,
} from '../../systems/ProgressionSystem';
import { getSkillById } from '../../data/skills';
import { saveGameState } from '../../systems/SaveSystem';
import { SoundSystem } from '../../systems/SoundSystem';
import {
  X,
  Sparkles,
  Swords,
  Flame,
  Snowflake,
  Zap,
  Shield,
  HeartPulse,
  Skull,
  RotateCcw,
  Check,
  Lock,
  ChevronRight,
  Info,
  Search,
  Star,
  Award,
  ZapOff,
  Crosshair,
  Wind,
  Axe,
  CloudSnow,
  Tornado,
  Ghost,
  Sun,
  Sprout,
  Footprints,
  HeartHandshake,
  ShieldCheck,
  Crown,
  Lamp,
  Syringe,
  Droplet,
  EyeOff,
  FlaskConical,
  Scissors,
  ShieldAlert,
  Hammer,
  Megaphone,
} from 'lucide-react';

interface SkillTreeModalProps {
  gameState: GameState;
  onUpdateGameState: (state: GameState) => void;
  onClose: () => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  gameState,
  onUpdateGameState,
  onClose,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<SkillBranchId | 'all'>('warrior');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('power_strike');
  const [confirmReset, setConfirmReset] = useState(false);

  const currentSp = Number(gameState.player?.skillPoints ?? gameState.skillPoints ?? 0);
  const unlockedSkills = useMemo(() => {
    return (
      gameState.player?.unlockedSkills ??
      gameState.unlockedSkills ?? { power_strike: 1 }
    );
  }, [gameState]);

  // Compute total unlocked abilities count
  const unlockedCount = useMemo(() => {
    return Object.keys(unlockedSkills).filter((k) => (unlockedSkills[k] || 0) > 0).length;
  }, [unlockedSkills]);

  // Filter nodes according to selected branch & search query
  const filteredNodes = useMemo(() => {
    return SKILL_TREE_NODES.filter((node) => {
      const matchBranch = selectedBranch === 'all' || node.branch === selectedBranch;
      const matchSearch =
        !searchQuery ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.descriptionVi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBranch && matchSearch;
    });
  }, [selectedBranch, searchQuery]);

  // Group nodes by Tier for the branch layout
  const tier1Nodes = useMemo(() => filteredNodes.filter((n) => n.tier === 1), [filteredNodes]);
  const tier2Nodes = useMemo(() => filteredNodes.filter((n) => n.tier === 2), [filteredNodes]);
  const tier3Nodes = useMemo(() => filteredNodes.filter((n) => n.tier === 3), [filteredNodes]);
  const tier4Nodes = useMemo(() => filteredNodes.filter((n) => n.tier === 4), [filteredNodes]);

  const playerLevel = Number(gameState.player?.level || 1);
  const playerExp = Number(gameState.player?.experience || 0);
  const reqExp = getRequiredExpForLevel(playerLevel);
  const playerStats = gameState.player?.stats || { hp: 120, mp: 24, atk: 18, matk: 5, def: 13, mdef: 8, spd: 10 };
  const totalPassives = useMemo(() => calculateSkillTreePassives(unlockedSkills), [unlockedSkills]);

  const activeSelectedNode = useMemo(() => {
    return getSkillTreeNode(selectedNodeId) || SKILL_TREE_NODES[0];
  }, [selectedNodeId]);

  const activeSkillDef = useMemo(() => {
    return activeSelectedNode ? getSkillById(activeSelectedNode.id) : undefined;
  }, [activeSelectedNode]);

  // Dynamic Lucide Icon Mapper
  const renderIcon = (iconName: string, size = 18, className = '') => {
    switch (iconName) {
      case 'Swords':
        return <Swords size={size} className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert size={size} className={className} />;
      case 'Scissors':
        return <Scissors size={size} className={className} />;
      case 'Crosshair':
        return <Crosshair size={size} className={className} />;
      case 'Megaphone':
        return <Megaphone size={size} className={className} />;
      case 'Hammer':
        return <Hammer size={size} className={className} />;
      case 'Wind':
        return <Wind size={size} className={className} />;
      case 'Shield':
        return <Shield size={size} className={className} />;
      case 'Axe':
        return <Axe size={size} className={className} />;
      case 'Flame':
      case 'FlameKindling':
        return <Flame size={size} className={className} />;
      case 'Snowflake':
        return <Snowflake size={size} className={className} />;
      case 'Zap':
        return <Zap size={size} className={className} />;
      case 'ZapOff':
        return <ZapOff size={size} className={className} />;
      case 'CloudSnow':
        return <CloudSnow size={size} className={className} />;
      case 'Tornado':
        return <Tornado size={size} className={className} />;
      case 'Ghost':
        return <Ghost size={size} className={className} />;
      case 'Sun':
      case 'SunMedium':
        return <Sun size={size} className={className} />;
      case 'HeartPulse':
        return <HeartPulse size={size} className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake size={size} className={className} />;
      case 'Sprout':
        return <Sprout size={size} className={className} />;
      case 'Footprints':
        return <Footprints size={size} className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} className={className} />;
      case 'Crown':
        return <Crown size={size} className={className} />;
      case 'Lamp':
        return <Lamp size={size} className={className} />;
      case 'Syringe':
        return <Syringe size={size} className={className} />;
      case 'Droplet':
        return <Droplet size={size} className={className} />;
      case 'EyeOff':
        return <EyeOff size={size} className={className} />;
      case 'FlaskConical':
        return <FlaskConical size={size} className={className} />;
      case 'Skull':
        return <Skull size={size} className={className} />;
      case 'Biohazard':
        return <Skull size={size} className={className} />;
      case 'Sparkle':
      case 'Sparkles':
      default:
        return <Sparkles size={size} className={className} />;
    }
  };

  // Handle Unlock or Upgrade Node
  const handleUnlockNode = (node: SkillTreeNode) => {
    const { canUnlock } = canUnlockOrUpgradeNode(node, unlockedSkills, currentSp, playerLevel);
    if (!canUnlock) {
      SoundSystem.playSelect();
      return;
    }

    const nextState = unlockOrUpgradeSkill(gameState, node.id, node.cost);
    const newRank = (nextState.player?.unlockedSkills?.[node.id] || 1);

    // Apply stat bonus if max rank reached
    if (newRank >= node.maxRank && node.statPassive) {
      const statKey = node.statPassive.stat;
      const bonus = node.statPassive.amount;
      if (nextState.player?.stats && statKey in nextState.player.stats) {
        nextState.player.stats[statKey as keyof typeof nextState.player.stats] += bonus;
        if (statKey === 'hp') nextState.player.currentHp += bonus;
        if (statKey === 'mp') nextState.player.currentMp += bonus;
      }
    }

    if (newRank >= node.maxRank) {
      SoundSystem.playLevelUp();
    } else {
      SoundSystem.playSkill();
    }

    saveGameState(nextState, 'default');
    onUpdateGameState(nextState);
  };

  // Handle Reset Skill Tree
  const handleResetTree = () => {
    SoundSystem.playSelect();
    const nextState = resetSkillTreeState(gameState);
    saveGameState(nextState, 'default');
    onUpdateGameState(nextState);
    setConfirmReset(false);
  };

  const currentBranchDef = SKILL_BRANCHES.find((b) => b.id === selectedBranch);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060a08]/85 backdrop-blur-sm p-2 sm:p-4 select-none">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-[#141b18] border-2 border-[#d5b66c] shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden rounded-xs">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#19231f] border-b border-[#36473d]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#25332c] border border-[#d5b66c] flex items-center justify-center text-[#ffd666]">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl text-[#f3ebdb] tracking-wide font-bold">
                  CÂY KỸ NĂNG & THIÊN PHÚ
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#25322b] text-[#ffd666] border border-[#d5b66c] rounded font-bold">
                  {gameState.player.name} • CẤP {playerLevel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#9aa697] font-mono mt-0.5">
                <span>Khai mở: <strong className="text-[#ffd666]">{unlockedCount} / 37</strong> kỹ năng</span>
                <span>•</span>
                <span className="text-[#79c0ff]">EXP: {playerExp} / {reqExp}</span>
              </div>
            </div>
          </div>

          {/* Available Skill Points & Action Bar */}
          <div className="flex items-center gap-2.5 mt-2 sm:mt-0">
            {/* SP Counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#202c25] border-2 border-[#d5b66c] rounded shadow-inner">
              <Star size={15} className="text-[#ffd666] fill-[#ffd666] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-[#9aa697] uppercase leading-none">
                  ĐIỂM KỸ NĂNG CÒN LẠI
                </span>
                <span className="text-sm font-mono font-bold text-[#ffd666] leading-tight">
                  {currentSp} SP
                </span>
              </div>
            </div>

            {/* Reset Tree Button */}
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#221c1a] hover:bg-[#342421] border border-[#ff7875]/50 text-[#ff7875] text-xs font-mono rounded cursor-pointer transition-colors"
                title="Tẩy điểm để thu hồi lại toàn bộ điểm kỹ năng đã cộng"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">TẨY ĐIỂM</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-[#2e1715] p-1 border border-[#ff4d4f] rounded text-[11px] font-mono">
                <span className="text-[#ffa39e] px-1">Xác nhận hoàn điểm?</span>
                <button
                  onClick={handleResetTree}
                  className="px-2 py-0.5 bg-[#820014] hover:bg-[#a8071a] text-white font-bold cursor-pointer rounded"
                >
                  CÓ
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-0.5 bg-[#36423a] text-[#b8bfb4] cursor-pointer rounded"
                >
                  HỦY
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                SoundSystem.playSelect();
                onClose();
              }}
              className="p-1.5 text-[#9aa697] hover:text-[#e4dec8] hover:bg-[#25322b] rounded cursor-pointer border border-[#3b4b42]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Branch Selector Tabs & Search Filter */}
        <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#17201d] border-b border-[#313f37] gap-2">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {SKILL_BRANCHES.map((branch) => {
              const isSelected = selectedBranch === branch.id;
              return (
                <button
                  key={branch.id}
                  onClick={() => {
                    SoundSystem.playSelect();
                    setSelectedBranch(branch.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#293830] text-[#ffd666] border border-[#d5b66c] shadow-sm'
                      : 'bg-[#1b2420] text-[#9aa697] hover:text-[#e4dec8] hover:bg-[#222e28] border border-[#36473d]'
                  }`}
                >
                  {renderIcon(branch.icon, 14, isSelected ? 'text-[#ffd666]' : 'text-[#7e8e81]')}
                  <span>{branch.nameVi}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                SoundSystem.playSelect();
                setSelectedBranch('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xs cursor-pointer transition-all ${
                selectedBranch === 'all'
                  ? 'bg-[#293830] text-[#ffd666] border border-[#d5b66c]'
                  : 'bg-[#1b2420] text-[#9aa697] hover:text-[#e4dec8] hover:bg-[#222e28] border border-[#36473d]'
              }`}
            >
              <Award size={14} />
              <span>TẤT CẢ (37)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#79887b]"
            />
            <input
              type="text"
              placeholder="Tìm kiếm kỹ năng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1 bg-[#121916] border border-[#36473d] text-xs font-mono text-[#e4dec8] focus:border-[#d5b66c] outline-hidden rounded-xs placeholder-[#5a6b5e]"
            />
          </div>
        </div>

        {/* Passives & Level Up Info Banner */}
        <div className="px-4 py-1.5 bg-[#17221c] border-b border-[#2d3b33] flex flex-wrap items-center justify-between text-[10px] sm:text-xs font-mono text-[#aeb9ad] gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#ffd666] font-bold flex items-center gap-1">
              <Sparkles size={11} /> THIÊN PHÚ ĐÃ CỘNG:
            </span>
            <span className="text-[#e4dec8]">+{totalPassives.atk} ATK</span>
            <span className="text-[#e4dec8]">+{totalPassives.matk} MATK</span>
            <span className="text-[#e4dec8]">+{totalPassives.def} DEF</span>
            <span className="text-[#e4dec8]">+{totalPassives.mdef} MDEF</span>
            <span className="text-[#e4dec8]">+{totalPassives.hp} HP</span>
            <span className="text-[#e4dec8]">+{totalPassives.mp} MP</span>
            <span className="text-[#e4dec8]">+{totalPassives.spd} SPD</span>
          </div>
          <span className="text-[#73d13d] bg-[#1a2d1d] px-2 py-0.5 rounded border border-[#2e5733]">
            Đánh quái lên cấp: +2 SP • Vượt tầng ngục: +3 SP
          </span>
        </div>

        {/* Branch Overview Lore Banner */}
        {currentBranchDef && selectedBranch !== 'all' && (
          <div className="px-4 py-2 bg-[#1b2420] border-b border-[#2d3b33] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#d5b66c] font-semibold font-mono uppercase text-[11px]">
                NHÁNH {currentBranchDef.nameVi}:
              </span>
              <span className="text-[#aeb9ad] font-serif italic text-[11px]">
                {currentBranchDef.descriptionVi}
              </span>
            </div>
            <span className="hidden md:inline text-[10px] font-mono text-[#ffd666] bg-[#2a2215] px-2 py-0.5 rounded border border-[#d5b66c]/50">
              KỸ NĂNG SCALE DAME THEO CHỈ SỐ NHÂN VẬT
            </span>
          </div>
        )}

        {/* Main Content Area: Left Tree Nodes Grid + Right Detailed Inspector */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Skill Tree Canvas / Tier Groups (8 Cols) */}
          <div className="lg:col-span-8 overflow-y-auto p-3 sm:p-4 space-y-5 bg-[#121815]">
            {filteredNodes.length === 0 ? (
              <div className="py-16 text-center text-[#7e8e81] font-mono text-sm">
                Không tìm thấy kỹ năng nào khớp với từ khóa "{searchQuery}".
              </div>
            ) : selectedBranch === 'all' ? (
              // Flat Grid for All 37 Skills
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredNodes.map((node) => {
                  const rank = unlockedSkills[node.id] || 0;
                  const isUnlocked = rank > 0;
                  const isMaxRank = rank >= node.maxRank;
                  const { canUnlock, reason } = canUnlockOrUpgradeNode(node, unlockedSkills, currentSp);
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        SoundSystem.playSelect();
                        setSelectedNodeId(node.id);
                      }}
                      className={`p-2.5 rounded-xs border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#ffd666] bg-[#222e27] shadow-[0_0_12px_rgba(213,182,108,0.25)]'
                          : isUnlocked
                          ? 'border-[#3f5749] bg-[#1a241f] hover:border-[#678b75]'
                          : canUnlock
                          ? 'border-[#8c783c] bg-[#1f241d] hover:border-[#ffd666]'
                          : 'border-[#2a3630] bg-[#131b17] opacity-65'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-9 h-9 rounded-xs border flex items-center justify-center shrink-0 ${
                              isUnlocked
                                ? 'bg-[#293d31] border-[#52c41a] text-[#73d13d]'
                                : canUnlock
                                ? 'bg-[#332b1a] border-[#ffd666] text-[#ffd666] animate-pulse'
                                : 'bg-[#18211d] border-[#313f37] text-[#69796c]'
                            }`}
                          >
                            {renderIcon(node.icon, 18)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#e4dec8] flex items-center gap-1.5">
                              <span>{node.nameVi}</span>
                              <span className="text-[10px] font-mono text-[#8c9c8e] font-normal">
                                ({node.name})
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#9aa697]">
                              Bậc {node.tier} • {node.branch.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        {/* Rank Stars */}
                        <div className="flex items-center gap-0.5 text-xs">
                          {Array.from({ length: node.maxRank }).map((_, idx) => (
                            <Star
                              key={idx}
                              size={11}
                              className={
                                idx < rank
                                  ? 'text-[#ffd666] fill-[#ffd666]'
                                  : 'text-[#3f5045]'
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-[#2a3630] flex items-center justify-between text-[11px] font-mono">
                        <span
                          className={`${
                            isMaxRank
                              ? 'text-[#ffd666] font-bold'
                              : isUnlocked
                              ? 'text-[#73d13d]'
                              : canUnlock
                              ? 'text-[#ffa940]'
                              : 'text-[#829285]'
                          }`}
                        >
                          {isMaxRank
                            ? '★ TỐI ĐA (MAX)'
                            : isUnlocked
                            ? `Cấp ${rank}/${node.maxRank}`
                            : canUnlock
                            ? 'Sẵn sàng mở khóa'
                            : reason || 'Khóa'}
                        </span>
                        <span className="text-[#d5b66c] text-[10px]">
                          Chi phí: {node.cost} SP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Structured Branch Tier Tree Layout
              <div className="space-y-6">
                {/* Helper / Branch Header */}
                <div className="text-[10px] font-mono text-[#9aa697] uppercase tracking-wider flex items-center justify-between border-b border-[#25332b] pb-1">
                  <span>TIẾN TRÌNH CÂY THIÊN PHÚ THEO BẬC</span>
                  <span>MỞ KHÓA BẬC TIẾP THEO KHI HỌC KỸ NĂNG TIỀN ĐỀ</span>
                </div>

                {/* Tier 1 Group: Novice */}
                {tier1Nodes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#73d13d]" />
                      <span className="text-xs font-mono font-bold text-[#b7e3b1] uppercase">
                        BẬC 1: KỸ NĂNG NHẬP MÔN (NOVICE)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tier1Nodes.map((node) => renderNodeCard(node))}
                    </div>
                  </div>
                )}

                {/* Tier 2 Group: Adept */}
                {tier2Nodes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#233028]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#4096ff]" />
                      <span className="text-xs font-mono font-bold text-[#91caff] uppercase">
                        BẬC 2: KỸ NĂNG CHUYÊN SÂU (ADEPT)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tier2Nodes.map((node) => renderNodeCard(node))}
                    </div>
                  </div>
                )}

                {/* Tier 3 Group: Master */}
                {tier3Nodes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#233028]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#d5b66c]" />
                      <span className="text-xs font-mono font-bold text-[#ffd666] uppercase">
                        BẬC 3: TUYỆT KỸ BẬC CAO (MASTER)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tier3Nodes.map((node) => renderNodeCard(node))}
                    </div>
                  </div>
                )}

                {/* Tier 4 Group: Capstone Ultimate */}
                {tier4Nodes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#233028]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#ff4d4f] animate-ping" />
                      <span className="text-xs font-mono font-bold text-[#ff7875] uppercase">
                        BẬC 4: ĐẠI TUYỆT KỸ TỐI THƯỢNG (CAPSTONE ULTIMATE)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {tier4Nodes.map((node) => renderNodeCard(node, true))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Node Inspector & Upgrade Action (4 Cols) */}
          <div className="lg:col-span-4 bg-[#17211d] border-t lg:border-t-0 lg:border-l border-[#36473d] p-4 flex flex-col justify-between overflow-y-auto">
            {activeSelectedNode ? (
              <div className="space-y-4">
                {/* Node Inspector Header */}
                <div className="border-b border-[#314036] pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#202c25] text-[#d5b66c] border border-[#43574b] rounded">
                      BẬC {activeSelectedNode.tier} • {activeSelectedNode.branch.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-[#9aa697]">
                      {unlockedSkills[activeSelectedNode.id] || 0} / {activeSelectedNode.maxRank} SAO
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded border-2 flex items-center justify-center shrink-0 shadow-md"
                      style={{
                        borderColor: activeSelectedNode.color,
                        backgroundColor: '#1d2722',
                        color: activeSelectedNode.color,
                      }}
                    >
                      {renderIcon(activeSelectedNode.icon, 24)}
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-[#f3ebdb] font-bold leading-tight">
                        {activeSelectedNode.nameVi}
                      </h3>
                      <div className="text-xs font-mono text-[#a6b6a8]">
                        {activeSelectedNode.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lore / Base Description */}
                <div className="p-2.5 bg-[#121916] border border-[#2b3a31] rounded-xs">
                  <span className="text-[10px] font-mono text-[#d5b66c] uppercase block mb-1 font-semibold">
                    MÔ TẢ CHIẾN ĐẤU
                  </span>
                  <p className="text-xs text-[#cfd7cc] leading-relaxed font-serif italic">
                    "{activeSelectedNode.descriptionVi}"
                  </p>
                </div>

                {/* Level Requirement & MP Cost Details */}
                <div className="p-2.5 bg-[#141d19] border border-[#2d3e33] rounded-xs space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9aa697]">YÊU CẦU CẤP ĐỘ:</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded-xs ${
                        playerLevel >= getNodeRequiredLevel(activeSelectedNode)
                          ? 'bg-[#18291e] text-[#73d13d] border border-[#52c41a]/40'
                          : 'bg-[#291e1d] text-[#ff7875] border border-[#ff4d4f]/40'
                      }`}
                    >
                      Cấp {getNodeRequiredLevel(activeSelectedNode)} (Hiện tại: Cấp {playerLevel})
                    </span>
                  </div>

                  {activeSkillDef && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#9aa697]">TIÊU HAO MANA:</span>
                        <span className="font-bold text-[#79c0ff]">
                          {activeSkillDef.mpCost} MP {activeSelectedNode.tier >= 3 ? '(Kỹ năng cấp cao)' : ''}
                        </span>
                      </div>

                      <div className="pt-1 border-t border-[#233128] space-y-1">
                        <div className="text-[10px] text-[#d5b66c] font-bold">
                          CƠ CHẾ SCALE THEO CHỈ SỐ:
                        </div>
                        <div className="text-[11px] text-[#e4dec8]">
                          {activeSkillDef.category === 'magic'
                            ? `Ma Thuật: ${activeSkillDef.power} Uy lực + 135% Ma Công (MATK)`
                            : activeSkillDef.healPower
                            ? `Trị Liệu: ${activeSkillDef.healPower} Hồi phục + 95% Ma Công (MATK)`
                            : activeSkillDef.id === 'shield_slam'
                            ? `Khiên Kích: ${activeSkillDef.power} Uy lực + 130% Thủ (DEF)`
                            : `Vật Lý: ${activeSkillDef.power} Uy lực + 120% Sức Mạnh (ATK)`}
                        </div>
                        <div className="text-[11px] text-[#73d13d] font-bold">
                          Ước tính sát thương: ~
                          {activeSkillDef.category === 'magic'
                            ? Math.round(activeSkillDef.power + (playerStats.matk || 15) * 1.35)
                            : activeSkillDef.healPower
                            ? Math.round(activeSkillDef.healPower + (playerStats.matk || 15) * 0.95)
                            : activeSkillDef.id === 'shield_slam'
                            ? Math.round(activeSkillDef.power + (playerStats.def || 13) * 1.3)
                            : Math.round(activeSkillDef.power + (playerStats.atk || 18) * 1.2)}
                          {' '}{activeSkillDef.healPower ? 'HP Hồi Máu' : 'Sát Thương'}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Passive Stat Bonus Badge */}
                {activeSelectedNode.statPassive && (
                  <div className="p-2 bg-[#1b2b20] border border-[#52c41a]/40 rounded-xs flex items-center justify-between text-xs font-mono">
                    <span className="text-[#95de64] flex items-center gap-1.5">
                      <Sparkles size={13} /> THIÊN PHÚ VĨNH VIỄN:
                    </span>
                    <span className="font-bold text-[#52c41a]">
                      {activeSelectedNode.statPassive.label}
                    </span>
                  </div>
                )}

                {/* Prerequisites Check */}
                {activeSelectedNode.prerequisites.length > 0 && (
                  <div className="p-2.5 bg-[#1a221e] border border-[#313f37] rounded-xs text-xs font-mono">
                    <span className="text-[10px] text-[#9aa697] uppercase block mb-1 font-semibold">
                      ĐIỀU KIỆN TIỀN ĐỀ CẦN CÓ:
                    </span>
                    <div className="space-y-1">
                      {activeSelectedNode.prerequisites.map((prereqId) => {
                        const prereqNode = getSkillTreeNode(prereqId);
                        const isSatisfied = (unlockedSkills[prereqId] || 0) >= 1;
                        return (
                          <div
                            key={prereqId}
                            className={`flex items-center justify-between p-1 px-2 rounded-xs text-[11px] ${
                              isSatisfied
                                ? 'bg-[#18291e] text-[#73d13d]'
                                : 'bg-[#291e1d] text-[#ff7875]'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {isSatisfied ? <Check size={12} /> : <Lock size={12} />}
                              {prereqNode?.nameVi || prereqId}
                            </span>
                            <span>{isSatisfied ? 'ĐÃ ĐẠT' : 'CHƯA MỞ'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rank Tiers Progression Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-[#d5b66c] uppercase block font-semibold">
                    CÁC CẤP ĐỘ NÂNG CẤP:
                  </span>
                  {activeSelectedNode.rankBonuses.map((bonusText, idx) => {
                    const currentRank = unlockedSkills[activeSelectedNode.id] || 0;
                    const isActive = currentRank > idx;
                    const isNext = currentRank === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xs border text-xs font-mono transition-colors ${
                          isActive
                            ? 'bg-[#1e2a22] border-[#52c41a]/50 text-[#d9f7be]'
                            : isNext
                            ? 'bg-[#26281e] border-[#ffd666]/60 text-[#fff1b8]'
                            : 'bg-[#141b18] border-[#29362e] text-[#69796c]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold flex items-center gap-1">
                            <Star
                              size={11}
                              className={
                                isActive
                                  ? 'text-[#52c41a] fill-[#52c41a]'
                                  : isNext
                                  ? 'text-[#ffd666] fill-[#ffd666]'
                                  : 'text-[#48554b]'
                              }
                            />
                            Cấp {idx + 1}
                          </span>
                          {isActive && (
                            <span className="text-[10px] text-[#52c41a] font-bold">
                              ĐANG KÍCH HOẠT
                            </span>
                          )}
                          {isNext && (
                            <span className="text-[10px] text-[#ffd666] font-bold">
                              CẤP TIẾP THEO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] opacity-90">{bonusText}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Bottom Upgrade / Unlock CTA */}
            {activeSelectedNode && (
              <div className="pt-4 border-t border-[#314036] mt-4">
                {(() => {
                  const rank = unlockedSkills[activeSelectedNode.id] || 0;
                  const isMax = rank >= activeSelectedNode.maxRank;
                  const { canUnlock, reason } = canUnlockOrUpgradeNode(
                    activeSelectedNode,
                    unlockedSkills,
                    currentSp,
                    playerLevel
                  );

                  if (isMax) {
                    return (
                      <div className="w-full py-2.5 px-3 bg-[#243329] border border-[#52c41a] text-center text-xs font-mono font-bold text-[#73d13d] flex items-center justify-center gap-2">
                        <Check size={16} /> ĐÃ ĐẠT CẤP TỐI ĐA (MAX RANK)
                      </div>
                    );
                  }

                  if (!canUnlock) {
                    return (
                      <div className="w-full py-2.5 px-3 bg-[#1e2420] border border-[#3b4c40] text-center text-xs font-mono text-[#829285] flex items-center justify-center gap-2">
                        <Lock size={14} /> {reason}
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={() => handleUnlockNode(activeSelectedNode)}
                      className="w-full py-2.5 px-4 bg-[#394a2f] hover:bg-[#4b633d] active:bg-[#5a7749] border-2 border-[#ffd666] text-[#ffd666] hover:text-white font-mono font-bold text-xs tracking-wider cursor-pointer shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={15} />
                      {rank === 0
                        ? `MỞ KHÓA KỸ NĂNG (-${activeSelectedNode.cost} SP)`
                        : `NÂNG LÊN CẤP ${rank + 1} (-${activeSelectedNode.cost} SP)`}
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info Strip */}
        <div className="px-4 py-2 bg-[#121815] border-t border-[#2d3a33] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#8c9c8e]">
          <span>
            💡 Mẹo: Kỹ năng sau khi mở khóa sẽ lập tức sẵn sàng trong sách ma thuật chiến đấu.
          </span>
          <span className="text-[#d5b66c]">
            Vượt qua mỗi tầng dã ngoại để nhận thêm +3 Điểm Kỹ Năng (SP).
          </span>
        </div>
      </div>
    </div>
  );

  // Helper renderer for a single Node Card in the Tree
  function renderNodeCard(node: SkillTreeNode, isWide = false) {
    const rank = unlockedSkills[node.id] || 0;
    const isUnlocked = rank > 0;
    const isMaxRank = rank >= node.maxRank;
    const { canUnlock, reason } = canUnlockOrUpgradeNode(node, unlockedSkills, currentSp, playerLevel);
    const reqLvl = getNodeRequiredLevel(node);
    const isSelected = selectedNodeId === node.id;

    return (
      <div
        key={node.id}
        onClick={() => {
          SoundSystem.playSelect();
          setSelectedNodeId(node.id);
        }}
        className={`p-3 rounded-xs border cursor-pointer transition-all flex flex-col justify-between ${
          isWide ? 'sm:col-span-2' : ''
        } ${
          isSelected
            ? 'border-[#ffd666] bg-[#243329] shadow-[0_0_15px_rgba(213,182,108,0.3)]'
            : isUnlocked
            ? 'border-[#43594d] bg-[#1a2520] hover:border-[#678b75]'
            : canUnlock
            ? 'border-[#8c783c] bg-[#20251c] hover:border-[#ffd666]'
            : 'border-[#27322c] bg-[#131b17] opacity-65'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xs border flex items-center justify-center shrink-0 ${
                isUnlocked
                  ? 'bg-[#293d31] border-[#52c41a] text-[#73d13d]'
                  : canUnlock
                  ? 'bg-[#332b1a] border-[#ffd666] text-[#ffd666] animate-pulse'
                  : 'bg-[#18211d] border-[#313f37] text-[#69796c]'
              }`}
            >
              {renderIcon(node.icon, 20)}
            </div>
            <div>
              <div className="text-xs font-bold text-[#f3ebdb] flex items-center gap-1.5">
                <span>{node.nameVi}</span>
                <span className="text-[10px] font-mono text-[#8c9c8e] font-normal">
                  ({node.name})
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#9aa697] line-clamp-1">
                {node.descriptionVi}
              </div>
            </div>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5 shrink-0">
            {Array.from({ length: node.maxRank }).map((_, idx) => (
              <Star
                key={idx}
                size={12}
                className={
                  idx < rank
                    ? 'text-[#ffd666] fill-[#ffd666]'
                    : 'text-[#38483e]'
                }
              />
            ))}
          </div>
        </div>

        {/* Card Footer Status */}
        <div className="mt-2.5 pt-2 border-t border-[#2b3a32] flex items-center justify-between text-[11px] font-mono">
          <span
            className={`${
              isMaxRank
                ? 'text-[#ffd666] font-bold'
                : isUnlocked
                ? 'text-[#73d13d]'
                : canUnlock
                ? 'text-[#ffa940] font-medium'
                : 'text-[#7e8e81]'
            }`}
          >
            {isMaxRank
              ? '★ ĐÃ TỐI ĐA'
              : isUnlocked
              ? `Cấp ${rank}/${node.maxRank}`
              : canUnlock
              ? 'Mở khóa ngay'
              : reason || 'Khóa'}
          </span>

          <span className="text-[#d5b66c] text-[10px] font-bold">
            {node.cost} SP
          </span>
        </div>
      </div>
    );
  }
};
