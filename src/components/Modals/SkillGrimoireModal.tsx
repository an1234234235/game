import React, { useState, useMemo } from 'react';
import { SKILL_LIBRARY, SkillDefinition } from '../../data/skills';
import { EnemyState, Stats } from '../../types/game';
import {
  X,
  Swords,
  Flame,
  Snowflake,
  Zap,
  HeartPulse,
  ShieldCheck,
  Biohazard,
  Sparkles,
  Search,
  Crosshair,
  Crown,
  Droplet,
  Star,
  BookOpen,
  Lock,
} from 'lucide-react';

interface SkillGrimoireModalProps {
  playerMp: number;
  playerMaxMp: number;
  enemies: EnemyState[];
  selectedEnemyId: string | null;
  unlockedSkills?: Record<string, number>;
  playerStats?: Stats;
  playerLevel?: number;
  onCastSkill: (skill: SkillDefinition, targetId?: string) => void;
  onOpenSkillTree?: () => void;
  onClose: () => void;
}

export const SkillGrimoireModal: React.FC<SkillGrimoireModalProps> = ({
  playerMp,
  playerMaxMp,
  enemies,
  selectedEnemyId,
  unlockedSkills = { power_strike: 1 },
  playerStats = { hp: 120, mp: 24, atk: 18, matk: 5, def: 13, mdef: 8, spd: 10 },
  playerLevel = 1,
  onCastSkill,
  onOpenSkillTree,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTargetId, setCurrentTargetId] = useState<string>(() => {
    const alive =
      enemies.find((e) => e.instanceId === selectedEnemyId && e.hp > 0) ||
      enemies.find((e) => e.hp > 0);
    return alive?.instanceId || '';
  });

  const aliveEnemies = useMemo(() => enemies.filter((e) => e.hp > 0), [enemies]);

  // Only skills that the player has actually LEARNED from the Skill Tree!
  const learnedSkills = useMemo(() => {
    return SKILL_LIBRARY.filter((skill) => (unlockedSkills[skill.id] || 0) > 0);
  }, [unlockedSkills]);

  const filteredSkills = useMemo(() => {
    return learnedSkills.filter((skill) => {
      const matchesCategory =
        selectedCategory === 'all' || skill.category === selectedCategory;
      const matchesQuery =
        !searchQuery ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.descriptionVi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [learnedSkills, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const countFor = (cat: string) =>
      cat === 'all'
        ? learnedSkills.length
        : learnedSkills.filter((s) => s.category === cat).length;

    return [
      { id: 'all', label: `TẤT CẢ (${countFor('all')})` },
      { id: 'physical', label: `VẬT LÝ (${countFor('physical')})` },
      { id: 'magic', label: `PHÉP THUẬT (${countFor('magic')})` },
      { id: 'heal', label: `HỒI PHỤC (${countFor('heal')})` },
      { id: 'buff', label: `CƯỜNG HÓA (${countFor('buff')})` },
      { id: 'debuff', label: `NGUYỀN RỦA (${countFor('debuff')})` },
      { id: 'ultimate', label: `TUYỆT KỸ (${countFor('ultimate')})` },
    ];
  }, [learnedSkills]);

  const getElementBadge = (element: string) => {
    switch (element) {
      case 'fire':
        return (
          <span className="px-1.5 py-0.5 bg-[#421d17] text-[#ff7875] border border-[#ff4d4f]/40 rounded text-[9px] font-mono flex items-center gap-0.5">
            <Flame size={10} /> HỎA
          </span>
        );
      case 'ice':
        return (
          <span className="px-1.5 py-0.5 bg-[#172c3d] text-[#69c0ff] border border-[#4096ff]/40 rounded text-[9px] font-mono flex items-center gap-0.5">
            <Snowflake size={10} /> BĂNG
          </span>
        );
      case 'lightning':
        return (
          <span className="px-1.5 py-0.5 bg-[#383214] text-[#ffd666] border border-[#ffc53d]/40 rounded text-[9px] font-mono flex items-center gap-0.5">
            <Zap size={10} /> LÔI
          </span>
        );
      case 'nature':
        return (
          <span className="px-1.5 py-0.5 bg-[#1b3319] text-[#95de64] border border-[#73d13d]/40 rounded text-[9px] font-mono flex items-center gap-0.5">
            <Biohazard size={10} /> ĐỘC/MỘC
          </span>
        );
      case 'holy':
        return (
          <span className="px-1.5 py-0.5 bg-[#383319] text-[#fff1b8] border border-[#faad14]/40 rounded text-[9px] font-mono flex items-center gap-0.5">
            <Sparkles size={10} /> THÁNH QUANG
          </span>
        );
      case 'dark':
        return (
          <span className="px-1.5 py-0.5 bg-[#2a1738] text-[#d3adf7] border border-[#9254de]/40 rounded text-[9px] font-mono flex items-center gap-0.5">
            <Crown size={10} /> BÓNG TỐI
          </span>
        );
      case 'earth':
        return (
          <span className="px-1.5 py-0.5 bg-[#33251a] text-[#d48855] border border-[#d46b08]/40 rounded text-[9px] font-mono flex items-center gap-0.5">
            <Swords size={10} /> ĐỊA CHẤN
          </span>
        );
      case 'physical':
      default:
        return (
          <span className="px-1.5 py-0.5 bg-[#262c28] text-[#e2c77b] border border-[#d5b66c]/40 rounded text-[9px] font-mono flex items-center gap-0.5">
            <Swords size={10} /> VẬT LÝ
          </span>
        );
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case 'all_enemies':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#381f1d] text-[#ff9c6e] border border-[#ff7a45]/40 rounded">
            TOÀN ĐỘI QUÁI
          </span>
        );
      case 'self':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#172c20] text-[#85e89d] border border-[#56d364]/40 rounded">
            BẢN THÂN
          </span>
        );
      case 'all_allies':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#1c2e2e] text-[#87e8de] border border-[#13c2c2]/40 rounded">
            TOÀN ĐỘI TA
          </span>
        );
      case 'single_enemy':
      default:
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#202723] text-[#c4c2ad] border border-[#59695d]/40 rounded">
            ĐƠN MỤC TIÊU
          </span>
        );
    }
  };

  // Helper to compute dynamic damage estimate based on character stats and skill rank
  const getEstimatedPower = (skill: SkillDefinition, rank: number) => {
    const rankBonus = 1 + (rank - 1) * 0.25;
    if (skill.healPower && skill.healPower > 0) {
      const heal = Math.round(skill.healPower * rankBonus + (playerStats.matk || 12) * (0.9 + rank * 0.2));
      return { text: `~${heal} HP Hồi Máu`, sub: `(Dựa trên ${playerStats.matk || 12} MATK)` };
    }
    if (skill.category === 'magic') {
      const dmg = Math.round(skill.power * rankBonus + (playerStats.matk || 15) * (1.2 + rank * 0.25));
      return { text: `~${dmg} Sát Thương Phép`, sub: `(Dựa trên ${playerStats.matk || 15} MATK)` };
    }
    if (skill.id === 'shield_slam') {
      const dmg = Math.round(skill.power * rankBonus + (playerStats.def || 13) * (1.3 + rank * 0.25));
      return { text: `~${dmg} Sát Thương Khiên`, sub: `(Dựa trên ${playerStats.def || 13} DEF)` };
    }
    const dmg = Math.round(skill.power * rankBonus + (playerStats.atk || 18) * (1.1 + rank * 0.2));
    return { text: `~${dmg} Sát Thương Vật Lý`, sub: `(Dựa trên ${playerStats.atk || 18} ATK)` };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#141b18] border-2 border-[#59695d] shadow-[0_0_30px_rgba(0,0,0,0.9)] rounded flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-[#59695d] bg-[#1a231f]">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#d5b66c]" />
            <h2 className="text-sm sm:text-base font-serif font-bold text-[#e4dec8] tracking-wider uppercase">
              BÍ THƯ KỸ NĂNG ĐÃ HỌC (GRIMOIRE)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#25322b] text-[#ffd666] border border-[#d5b66c]/40 rounded-xs">
              CẤP {playerLevel} • {learnedSkills.length} ĐÃ HỌC
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* MP Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#101715] border border-[#59695d] rounded">
              <span className="text-[10px] font-mono text-[#9aa697]">MANA:</span>
              <span
                className={`text-xs font-mono font-bold ${
                  playerMp > 0 ? 'text-[#79c0ff]' : 'text-[#ff7875]'
                }`}
              >
                {playerMp} / {playerMaxMp} MP
              </span>
              <div className="w-16 h-1.5 bg-[#1b2421] border border-[#59695d]/60 rounded-xs overflow-hidden ml-1">
                <div
                  className="h-full bg-[#75a6bf] transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(1, playerMp / (playerMaxMp || 1))) * 100}%`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 bg-[#242f2b] hover:bg-[#34443e] border border-[#59695d] text-[#c4c2ad] cursor-pointer rounded transition-colors"
              title="Đóng (ESC)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-3 sm:px-5 py-2 border-b border-[#313f37] bg-[#17201d]">
          {/* Categories Tab Strip */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 text-[10px] sm:text-xs font-mono whitespace-nowrap border cursor-pointer transition-colors rounded-xs ${
                  selectedCategory === cat.id
                    ? 'bg-[#314238] border-[#d5b66c] text-[#e7d9a5] font-bold shadow-xs'
                    : 'bg-[#1b2421] border-[#435248] text-[#9aa697] hover:bg-[#25322b]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#899589]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm kỹ năng..."
              className="w-full bg-[#111716] border border-[#435248] rounded-xs pl-7 pr-2 py-1 text-xs font-mono text-[#e4dec8] focus:outline-none focus:border-[#d5b66c]"
            />
          </div>
        </div>

        {/* Target Selection Bar if multiple targets available */}
        {aliveEnemies.length > 1 && (
          <div className="flex items-center gap-2 px-3 sm:px-5 py-1.5 bg-[#1b2421] border-b border-[#313f37] text-[10px] font-mono">
            <span className="text-[#9aa697] flex items-center gap-1">
              <Crosshair size={12} className="text-[#d5b66c]" /> MỤC TIÊU ĐANG CHỌN:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {aliveEnemies.map((enemy) => (
                <button
                  key={enemy.instanceId}
                  onClick={() => setCurrentTargetId(enemy.instanceId)}
                  className={`px-2 py-0.5 border cursor-pointer rounded-xs transition-colors ${
                    currentTargetId === enemy.instanceId
                      ? 'bg-[#402a24] border-[#d36e61] text-[#ffccc7] font-bold'
                      : 'bg-[#151d1a] border-[#435248] text-[#a0aba1]'
                  }`}
                >
                  {enemy.name} ({enemy.hp}/{enemy.maxHp} HP)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Skills Grid */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[60vh]">
          {filteredSkills.length === 0 ? (
            <div className="col-span-full py-12 px-4 text-center bg-[#17201d] border border-dashed border-[#435248] rounded flex flex-col items-center justify-center gap-3">
              <Lock size={32} className="text-[#d5b66c]/60" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#e4dec8] mb-1">
                  Chưa Học Kỹ Năng Nào Trong Nhánh Này!
                </h4>
                <p className="text-xs text-[#9aa697] font-mono max-w-md mx-auto mb-3">
                  Trong Lanternfall, kỹ năng không có sẵn toàn bộ. Hãy đánh quái để nhận EXP, lên cấp nhận Điểm Kỹ Năng (SP), sau đó mở Cây Kỹ Năng để học và nâng cấp!
                </p>
                {onOpenSkillTree && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSkillTree();
                    }}
                    className="px-4 py-2 bg-[#2d3a2b] hover:bg-[#3d4f3b] border border-[#d5b66c] text-xs font-mono font-bold text-[#ffd666] cursor-pointer shadow-md rounded-xs"
                  >
                    ⭐ MỞ CÂY KỸ NĂNG NGAY (PHÍM K)
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredSkills.map((skill) => {
              const rank = unlockedSkills[skill.id] || 1;
              const canAfford = playerMp >= skill.mpCost;
              const isSingleEnemy = skill.target === 'single_enemy';
              const powerEst = getEstimatedPower(skill, rank);

              return (
                <div
                  key={skill.id}
                  className={`p-3 border rounded-xs transition-all flex flex-col justify-between ${
                    canAfford
                      ? 'bg-[#1b2421] border-[#435248] hover:border-[#d5b66c]/80 shadow-md'
                      : 'bg-[#141b18] border-[#313f37] opacity-60'
                  }`}
                >
                  <div>
                    {/* Top: Name & Badges */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif font-bold text-xs sm:text-sm text-[#e4dec8]">
                            {skill.nameVi}
                          </span>
                          <span className="text-[10px] text-[#8f9b8c] font-mono italic">
                            ({skill.name})
                          </span>
                          {/* Rank Badge */}
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-[#243322] border border-[#73d13d]/60 text-[#95de64] rounded-xs flex items-center gap-0.5">
                            <Star size={9} className="fill-[#73d13d]" /> CẤP {rank}/3
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {getElementBadge(skill.element)}
                          {getTargetLabel(skill.target)}
                          {/* Damage Scaling Indicator */}
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#232f28] text-[#ffd666] border border-[#d5b66c]/30 rounded">
                            {powerEst.text}
                          </span>
                        </div>
                      </div>

                      {/* MP Cost Display */}
                      <div className="shrink-0 text-right">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                            canAfford
                              ? 'bg-[#14232e] border-[#4096ff]/60 text-[#79c0ff]'
                              : 'bg-[#2b1816] border-[#ff4d4f]/60 text-[#ff7875]'
                          }`}
                        >
                          {skill.mpCost} MP
                        </span>
                        <div className="text-[8px] font-mono text-[#8a998c] mt-0.5">
                          {powerEst.sub}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-[#b4beb0] leading-relaxed mb-2 font-serif">
                      {skill.descriptionVi}
                    </p>
                  </div>

                  {/* Bottom: Cast Button */}
                  <div className="pt-2 border-t border-[#313f37] flex items-center justify-between gap-2">
                    <div className="text-[9px] font-mono text-[#8a9688]">
                      {skill.statusEffect
                        ? `Hiệu ứng: ${skill.statusEffect.type.toUpperCase()} (${skill.statusEffect.duration} lượt)`
                        : 'Sát thương trực tiếp'}
                    </div>

                    <button
                      onClick={() => {
                        if (canAfford) {
                          onCastSkill(skill, isSingleEnemy ? currentTargetId : undefined);
                        }
                      }}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider rounded-xs border cursor-pointer transition-all active:scale-95 touch-manipulation flex items-center gap-1 ${
                        canAfford
                          ? 'bg-gradient-to-r from-[#4d3f20] to-[#69552b] hover:from-[#614f29] hover:to-[#7d6634] border-[#d5b66c] text-[#fffb8f] shadow-sm'
                          : 'bg-[#242b27] border-[#435248] text-[#ff7875] cursor-not-allowed'
                      }`}
                    >
                      <span>{canAfford ? 'THI TRIỂN' : 'THIẾU MANA'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-3 sm:px-5 py-2.5 border-t border-[#59695d] bg-[#17201d] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#899589]">
          <div className="flex items-center gap-2">
            <span>HIỂN THỊ: {filteredSkills.length} KỸ NĂNG ĐÃ HỌC</span>
            <span className="text-[#d5b66c]">•</span>
            <span>Kỹ năng càng cao cấp càng tốn nhiều Mana</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSkillTree && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSkillTree();
                }}
                className="px-2.5 py-1 bg-[#253229] hover:bg-[#324438] border border-[#d5b66c] text-[#ffd666] cursor-pointer rounded-xs transition-colors flex items-center gap-1 font-bold"
              >
                <Sparkles size={11} /> CÂY KỸ NĂNG (PHÍM K)
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 bg-[#242f2b] hover:bg-[#34443e] border border-[#59695d] text-[#c4c2ad] cursor-pointer rounded transition-colors"
            >
              ĐÓNG (ESC)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
