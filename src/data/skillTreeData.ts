import { getSkillById } from './skills';

export type SkillBranchId = 'warrior' | 'mage' | 'cleric' | 'shadow';

export interface SkillTreeNode {
  id: string;
  name: string;
  nameVi: string;
  branch: SkillBranchId;
  tier: 1 | 2 | 3 | 4;
  requiredLevel?: number;
  icon: string;
  color: string;
  cost: number;
  maxRank: number;
  prerequisites: string[];
  description: string;
  descriptionVi: string;
  rankBonuses: [string, string, string]; // [Rank 1, Rank 2, Rank 3]
  statPassive?: {
    stat: 'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'matk';
    amount: number;
    label: string;
  };
}

export interface SkillBranch {
  id: SkillBranchId;
  name: string;
  nameVi: string;
  icon: string;
  color: string;
  themeColor: string;
  accentBg: string;
  borderColor: string;
  descriptionVi: string;
}

export const SKILL_BRANCHES: SkillBranch[] = [
  {
    id: 'warrior',
    name: 'Vanguard & Blade Mastery',
    nameVi: 'Đấu Sĩ & Thiết Giáp',
    icon: 'Swords',
    color: '#e2c77b',
    themeColor: 'from-[#d5b66c]/20 to-[#3a2f1c]/10',
    accentBg: '#2a2214',
    borderColor: '#d5b66c',
    descriptionVi: 'Chuyên về đòn đánh vật lý cận chiến uy lực, phá giáp, phản đòn và che chắn vững chắc.',
  },
  {
    id: 'mage',
    name: 'Arcane & Elemental Sorcery',
    nameVi: 'Ma Pháp & Nguyên Tố',
    icon: 'Flame',
    color: '#ff7a45',
    themeColor: 'from-[#ff7a45]/20 to-[#3a1b18]/10',
    accentBg: '#2d1816',
    borderColor: '#ff7a45',
    descriptionVi: 'Khai thác hỏa tiễn thiêu đốt, bão tuyết đóng băng và lôi sét liên hoàn hủy diệt diện rộng.',
  },
  {
    id: 'cleric',
    name: 'Luminary & Divine Restoration',
    nameVi: 'Thánh Quang & Hộ Vệ',
    icon: 'Sparkles',
    color: '#73d13d',
    themeColor: 'from-[#73d13d]/20 to-[#1e341b]/10',
    accentBg: '#18291a',
    borderColor: '#73d13d',
    descriptionVi: 'Hồi phục sinh lực thần thánh, ban phước khiên hộ thể, thanh tẩy độc tố và tăng lực toàn diện.',
  },
  {
    id: 'shadow',
    name: 'Shadow & Hexes',
    nameVi: 'Ám Ảnh & Tuyệt Kỹ',
    icon: 'Skull',
    color: '#b37feb',
    themeColor: 'from-[#b37feb]/20 to-[#281b3a]/10',
    accentBg: '#221532',
    borderColor: '#b37feb',
    descriptionVi: 'Gieo rắc độc tố chết người, nguyền rủa suy kiệt, hóa cuồng nộ và tuyệt chiêu Thất Tinh trảm sát.',
  },
];

export const SKILL_TREE_NODES: SkillTreeNode[] = [
  // ==========================================
  // 1. WARRIOR / VANGUARD BRANCH (10 Abilities)
  // ==========================================
  {
    id: 'power_strike',
    name: 'Power Strike',
    nameVi: 'Chém Uy Lực',
    branch: 'warrior',
    tier: 1,
    icon: 'Swords',
    color: '#e2c77b',
    cost: 1,
    maxRank: 3,
    prerequisites: [],
    description: 'A heavy, focused slash that unbalances the foe and reduces their attack power.',
    descriptionVi: 'Nhát chém dồn lực gây sát thương mạnh và làm yếu đối thủ (-30% Công).',
    rankBonuses: [
      'Cấp 1: Kích hoạt kỹ năng cơ bản (24 Uy Lực, gây Suy Yếu 2 lượt)',
      'Cấp 2: Tăng +25% Sát Thương (30 Uy Lực), giảm -1 MP',
      'Cấp 3: Tăng +50% Sát Thương (36 Uy Lực), +5 ATK vĩnh viễn',
    ],
    statPassive: { stat: 'atk', amount: 5, label: '+5 Công (ATK)' },
  },
  {
    id: 'shield_slam',
    name: 'Shield Slam',
    nameVi: 'Khiên Kích Đập',
    branch: 'warrior',
    tier: 1,
    icon: 'ShieldAlert',
    color: '#79c0ff',
    cost: 1,
    maxRank: 3,
    prerequisites: [],
    description: 'Batter the target with a heavy shield, dealing blunt damage and staggering them.',
    descriptionVi: 'Dùng khiên nện mạnh vào mục tiêu gây sát thương theo giáp và làm choáng váng.',
    rankBonuses: [
      'Cấp 1: Kích hoạt đòn đập khiên (20 Uy Lực, 80% Suy Yếu)',
      'Cấp 2: Tăng tỷ lệ làm suy yếu lên 100%, +25% Sát Thương',
      'Cấp 3: Tăng +50% Sát Thương, +5 DEF vĩnh viễn',
    ],
    statPassive: { stat: 'def', amount: 5, label: '+5 Thủ (DEF)' },
  },
  {
    id: 'double_cleave',
    name: 'Twin Cleave',
    nameVi: 'Song Đao Trảm',
    branch: 'warrior',
    tier: 2,
    icon: 'Scissors',
    color: '#d5b66c',
    cost: 1,
    maxRank: 3,
    prerequisites: ['power_strike'],
    description: 'Execute two rapid consecutive slashes carving deep into the enemy.',
    descriptionVi: 'Tung ra hai nhát chém chớp nhoáng xé toạc phòng thủ kẻ địch.',
    rankBonuses: [
      'Cấp 1: Tung 2 nhát chém liên hoàn cực nhanh (28 Uy Lực)',
      'Cấp 2: Tăng +25% Sát thương (35 Uy Lực), giảm -2 MP',
      'Cấp 3: Tăng +50% Sát thương (42 Uy Lực), +6 ATK vĩnh viễn',
    ],
    statPassive: { stat: 'atk', amount: 6, label: '+6 Công (ATK)' },
  },
  {
    id: 'counter_stance',
    name: 'Riposte Thrust',
    nameVi: 'Phản Đòn Đâm',
    branch: 'warrior',
    tier: 2,
    icon: 'Crosshair',
    color: '#9ad0b8',
    cost: 1,
    maxRank: 3,
    prerequisites: ['shield_slam'],
    description: 'Parry stance strike that boosts user speed and delivers a sharp puncture.',
    descriptionVi: 'Đòn đâm phản công bất ngờ tăng tốc độ và đâm trúng yếu huyệt đối thủ.',
    rankBonuses: [
      'Cấp 1: Phản kích nhắm điểm yếu (21 Uy Lực, tăng Tốc Độ 2 lượt)',
      'Cấp 2: Tăng thời hạn Tăng Tốc lên 3 lượt, +25% Sát Thương',
      'Cấp 3: Tăng +50% Sát Thương, +4 SPD vĩnh viễn',
    ],
    statPassive: { stat: 'spd', amount: 4, label: '+4 Tốc (SPD)' },
  },
  {
    id: 'battle_cry',
    name: 'War Roar',
    nameVi: 'Chiến Hống Uy Phong',
    branch: 'warrior',
    tier: 2,
    icon: 'Megaphone',
    color: '#fa541c',
    cost: 1,
    maxRank: 3,
    prerequisites: ['power_strike'],
    description: 'Unleashes a fearsome bellow that inspires fury, boosting ATK by 40% for 3 turns.',
    descriptionVi: 'Gầm vang dũng mãnh, kích phát nhuệ khí tăng 40% Sức Tấn Công trong 3 lượt.',
    rankBonuses: [
      'Cấp 1: Tiếng gầm kích nộ (+40% ATK trong 3 lượt)',
      'Cấp 2: Kéo dài hiệu lực lên 4 lượt, giảm tiêu hao MP',
      'Cấp 3: Tăng thêm +15 Max HP và +4 ATK cơ bản',
    ],
    statPassive: { stat: 'hp', amount: 15, label: '+15 Máu Tối Đa' },
  },
  {
    id: 'armor_shatter',
    name: 'Armor Shatter',
    nameVi: 'Phá Giáp Kích',
    branch: 'warrior',
    tier: 3,
    icon: 'Hammer',
    color: '#ff9b5e',
    cost: 1,
    maxRank: 3,
    prerequisites: ['double_cleave'],
    description: 'Strike directly at weak seams, sundering enemy armor and lowering their defense.',
    descriptionVi: 'Đâm thẳng vào điểm yếu, phá vỡ giáp kẻ địch và thiêu rụi phòng thủ.',
    rankBonuses: [
      'Cấp 1: Đòn đập nứt giáp (22 Uy Lực, phá giáp 3 lượt)',
      'Cấp 2: Tăng sát thương phá giáp +25%, giảm -2 MP',
      'Cấp 3: Tăng sát thương +50%, đòn tấn công luôn chí mạng',
    ],
  },
  {
    id: 'whirlwind_sweep',
    name: 'Whirlwind Sweep',
    nameVi: 'Bão Kiếm Quét',
    branch: 'warrior',
    tier: 3,
    icon: 'Wind',
    color: '#a8d5a2',
    cost: 1,
    maxRank: 3,
    prerequisites: ['double_cleave'],
    description: 'Spin with fierce momentum, hitting ALL enemies across the entire battlefield.',
    descriptionVi: 'Xoay tròn lưỡi kiếm chém trúng TẤT CẢ quái vật trên chiến trường.',
    rankBonuses: [
      'Cấp 1: Chém quét toàn bộ chiến trường (18 Uy Lực diện rộng)',
      'Cấp 2: Tăng +25% Sát Thương toàn thể (23 Uy Lực)',
      'Cấp 3: Tăng +50% Sát Thương (27 Uy Lực), -3 MP tiêu hao',
    ],
  },
  {
    id: 'iron_bastion',
    name: 'Iron Wall',
    nameVi: 'Thiết Bích Phòng Hộ',
    branch: 'warrior',
    tier: 3,
    icon: 'Shield',
    color: '#4096ff',
    cost: 1,
    maxRank: 3,
    prerequisites: ['shield_slam'],
    description: 'Assumes an unyielding defensive posture, raising DEF by 50% for 3 turns.',
    descriptionVi: 'Lập thế thủ vững như tường sắt, gia tăng 50% Giáp Phòng Thủ trong 3 lượt.',
    rankBonuses: [
      'Cấp 1: Tư thế phòng thủ bất hoại (+50% DEF 3 lượt)',
      'Cấp 2: Kéo dài thời gian hiệu ứng lên 4 lượt, hồi phục 10 HP',
      'Cấp 3: +8 DEF vĩnh viễn và +20 Max HP',
    ],
    statPassive: { stat: 'def', amount: 8, label: '+8 Giáp (DEF)' },
  },
  {
    id: 'blade_dance',
    name: 'Blade Dance',
    nameVi: 'Vũ Điệu Lưỡi Gươm',
    branch: 'warrior',
    tier: 3,
    icon: 'Sparkles',
    color: '#ffd666',
    cost: 1,
    maxRank: 3,
    prerequisites: ['double_cleave'],
    description: 'An elegant series of swift sword thrusts that bypasses parries.',
    descriptionVi: 'Chuỗi kiếm vũ uyển chuyển nhưng sắc bén, gây 3 đòn liên hoàn cực mạnh.',
    rankBonuses: [
      'Cấp 1: Vũ điệu kiếm chém xuyên hộ thể (30 Uy Lực)',
      'Cấp 2: Tăng +25% Sát thương (38 Uy Lực), -2 MP',
      'Cấp 3: Tăng +50% Sát thương (45 Uy Lực), +5 SPD vĩnh viễn',
    ],
    statPassive: { stat: 'spd', amount: 5, label: '+5 Tốc (SPD)' },
  },
  {
    id: 'executioner_strike',
    name: "Executioner's Blade",
    nameVi: 'Trảm Quyết',
    branch: 'warrior',
    tier: 4,
    icon: 'Axe',
    color: '#d36e61',
    cost: 1,
    maxRank: 3,
    prerequisites: ['armor_shatter'],
    description: 'A ruthless finishing blow dealing massive devastating damage to wounded foes.',
    descriptionVi: 'Cú trảm chí mạng tàn khốc, gây sát thương cực lớn dứt điểm kẻ địch.',
    rankBonuses: [
      'Cấp 1: Đòn trảm dứt điểm kinh hoàng (36 Uy Lực)',
      'Cấp 2: Tăng lên 45 Uy Lực, tiêu hao ít hơn 3 MP',
      'Cấp 3: 54 Uy Lực siêu khủng, tiêu diệt quái dưới 25% máu ngay lập tức',
    ],
  },

  // ==========================================
  // 2. MAGE / ARCANIST BRANCH (10 Abilities)
  // ==========================================
  {
    id: 'ember_flare',
    name: 'Ember Flare',
    nameVi: 'Hỏa Tiễn Rực Cháy',
    branch: 'mage',
    tier: 1,
    icon: 'Flame',
    color: '#ff7a45',
    cost: 1,
    maxRank: 3,
    prerequisites: [],
    description: 'Hurls a fiery sphere that scorches the enemy, inflicting Burned (9 DMG/turn).',
    descriptionVi: 'Bắn cầu lửa thiêu rụi mục tiêu, gây hiệu ứng Đốt Cháy (mất 9 máu/lượt).',
    rankBonuses: [
      'Cấp 1: Bắn cầu lửa gây 24 Sát Thương + Đốt Cháy 3 lượt',
      'Cấp 2: Tăng sát thương đốt lên 13/lượt, +25% Uy Lực',
      'Cấp 3: Tăng +50% Uy Lực (36 Uy Lực), +6 MP Tối Đa',
    ],
    statPassive: { stat: 'mp', amount: 6, label: '+6 MP Tối Đa' },
  },
  {
    id: 'frost_spike',
    name: 'Frost Spike',
    nameVi: 'Chông Băng Giá',
    branch: 'mage',
    tier: 1,
    icon: 'Snowflake',
    color: '#69c0ff',
    cost: 1,
    maxRank: 3,
    prerequisites: [],
    description: 'Conjures an icicle spear that pierces the foe and chills their movements.',
    descriptionVi: 'Phóng mũi tên băng xuyên thủng kẻ địch, làm lạnh buốt và giảm tốc đối phương.',
    rankBonuses: [
      'Cấp 1: Phóng chông băng sắc nhọn (22 Uy Lực, làm Chậm)',
      'Cấp 2: Tăng tỷ lệ làm chậm lên 100%, +25% Sát Thương',
      'Cấp 3: Tăng +50% Sát Thương (33 Uy Lực), giảm -2 MP',
    ],
  },
  {
    id: 'thunder_jolt',
    name: 'Thunder Jolt',
    nameVi: 'Lôi Kích Chớp',
    branch: 'mage',
    tier: 1,
    icon: 'Zap',
    color: '#ffd666',
    cost: 1,
    maxRank: 3,
    prerequisites: [],
    description: 'Calls down a sharp electric lightning strike crackling with high critical rate.',
    descriptionVi: 'Giáng sấm sét giật mạnh làm tê liệt và gián đoạn hành động kẻ thù.',
    rankBonuses: [
      'Cấp 1: Giáng sét điện chớp nhoáng (25 Uy Lực)',
      'Cấp 2: Tăng +25% Sát Thương (32 Uy Lực), giảm -1 MP',
      'Cấp 3: Tăng +50% Sát Thương (38 Uy Lực), tỷ lệ bạo kích 40%',
    ],
  },
  {
    id: 'toxic_spray',
    name: 'Venom Geyser',
    nameVi: 'Phun Độc Đầm Lầy',
    branch: 'mage',
    tier: 2,
    icon: 'Biohazard',
    color: '#73d13d',
    cost: 1,
    maxRank: 3,
    prerequisites: ['ember_flare'],
    description: 'Sprays a noxious wave of acidic venom, poisoning all opposing targets.',
    descriptionVi: 'Phun luồng độc axit ăn mòn bao phủ toàn bộ kẻ địch, gây Độc Tố (4 lượt).',
    rankBonuses: [
      'Cấp 1: Phun độc lên TOÀN BỘ quái vật (18 Uy Lực, Trúng Độc 4 lượt)',
      'Cấp 2: Tăng độc tố thêm 4 sát thương mỗi lượt, giảm -2 MP',
      'Cấp 3: Tăng +50% Sát thương trực tiếp, trúng độc kéo dài 5 lượt',
    ],
  },
  {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    nameVi: 'Lôi Xích Liên Hoàn',
    branch: 'mage',
    tier: 2,
    icon: 'ZapOff',
    color: '#ffc53d',
    cost: 1,
    maxRank: 3,
    prerequisites: ['thunder_jolt'],
    description: 'Fires an arc of high-voltage lightning that leaps through all enemy ranks.',
    descriptionVi: 'Phóng chuỗi tia sét nối liền lan truyền sát thương lên TẤT CẢ quái vật.',
    rankBonuses: [
      'Cấp 1: Phóng chuỗi sét quét qua toàn đội hình địch (22 Uy Lực)',
      'Cấp 2: Tăng +25% Sát Thương (28 Uy Lực), giảm -3 MP',
      'Cấp 3: Tăng +50% Sát Thương (33 Uy Lực), gây Choáng nhẹ',
    ],
  },
  {
    id: 'inferno_pillar',
    name: 'Inferno Pillar',
    nameVi: 'Cột Lửa Hủy Diệt',
    branch: 'mage',
    tier: 2,
    icon: 'FlameKindling',
    color: '#ff4d4f',
    cost: 1,
    maxRank: 3,
    prerequisites: ['ember_flare'],
    description: 'Erupts a towering pillar of magma from beneath the enemy, dealing huge fire damage.',
    descriptionVi: 'Triệu hồi cột dung nham khổng lồ thiêu đốt mãnh liệt kẻ thù.',
    rankBonuses: [
      'Cấp 1: Cột lửa bùng nổ khủng khiếp (32 Uy Lực + Thiêu Đốt)',
      'Cấp 2: Tăng lên 40 Uy Lực, sát thương đốt tăng thêm +5/lượt',
      'Cấp 3: 48 Uy Lực hủy diệt, bỏ qua 30% giáp phép đối phương',
    ],
  },
  {
    id: 'blizzard_storm',
    name: 'Blizzard Gale',
    nameVi: 'Bão Tuyết Cuồng Phong',
    branch: 'mage',
    tier: 3,
    icon: 'CloudSnow',
    color: '#85a5ff',
    cost: 1,
    maxRank: 3,
    prerequisites: ['frost_spike'],
    description: 'Summons a sub-zero blizzard howling across the battlefield, freezing all enemies.',
    descriptionVi: 'Triệu hồi bão tuyết băng giá quét qua toàn bộ kẻ địch trên sàn đấu.',
    rankBonuses: [
      'Cấp 1: Bão tuyết đóng băng toàn sàn (24 Uy Lực diện rộng)',
      'Cấp 2: Tăng lên 30 Uy Lực, giảm -3 MP',
      'Cấp 3: 36 Uy Lực, làm giảm 30% Tốc Độ toàn bộ quái vật',
    ],
  },
  {
    id: 'wind_tempest',
    name: 'Gale Tempest',
    nameVi: 'Lốc Xoáy Cuồng Nộ',
    branch: 'mage',
    tier: 3,
    icon: 'Tornado',
    color: '#95de64',
    cost: 1,
    maxRank: 3,
    prerequisites: ['chain_lightning'],
    description: 'Creates a vortex of razor winds cutting down enemy formations.',
    descriptionVi: 'Tạo lốc xoáy sắc như lưỡi dao càn quét đội hình quân địch.',
    rankBonuses: [
      'Cấp 1: Lốc xoáy càn quét (23 Uy Lực toàn thể)',
      'Cấp 2: Tăng +25% Sát Thương (29 Uy Lực)',
      'Cấp 3: Tăng +50% Sát Thương (35 Uy Lực), giảm -3 MP',
    ],
  },
  {
    id: 'abyssal_drain',
    name: 'Abyssal Drain',
    nameVi: 'Hấp Huyết Vực Thẳm',
    branch: 'mage',
    tier: 3,
    icon: 'Ghost',
    color: '#b37feb',
    cost: 1,
    maxRank: 3,
    prerequisites: ['toxic_spray'],
    description: 'Channels dark siphon magic, dealing damage while draining health back to the caster.',
    descriptionVi: 'Rút cạn sinh lực kẻ thù, chuyển hóa sát thương thành máu hồi cho bản thân.',
    rankBonuses: [
      'Cấp 1: Rút 20 Sát Thương và hồi ngay 18 Máu cho bản thân',
      'Cấp 2: Tăng hồi máu lên 25 HP, +25% Sát Thương',
      'Cấp 3: Tăng hồi máu lên 32 HP, +50% Sát Thương (30 Uy Lực)',
    ],
  },
  {
    id: 'meteor_cataclysm',
    name: 'Meteor Fall',
    nameVi: 'Thiên Thạch Rơi',
    branch: 'mage',
    tier: 4,
    icon: 'Sun',
    color: '#f5222d',
    cost: 1,
    maxRank: 3,
    prerequisites: ['inferno_pillar'],
    description: 'Summons a blazing celestial meteor crashing down with catastrophic magic blast.',
    descriptionVi: 'Kéo thiên thạch rực lửa từ trên cao đâm sầm xuống hủy diệt toàn bộ quân địch.',
    rankBonuses: [
      'Cấp 1: Thiên thạch hủy diệt toàn sàn (42 Uy Lực diện rộng + Đốt)',
      'Cấp 2: Tăng lên 52 Uy Lực cực đại, giảm -4 MP',
      'Cấp 3: 63 Uy Lực tột đỉnh, sát thương thiêu đốt kéo dài 5 lượt',
    ],
  },

  // ==========================================
  // 3. CLERIC & LUMINARY BRANCH (9 Abilities)
  // ==========================================
  {
    id: 'mend_wounds',
    name: 'Mend Wounds',
    nameVi: 'Chữa Lành Vết Thương',
    branch: 'cleric',
    tier: 1,
    icon: 'HeartPulse',
    color: '#7caa79',
    cost: 1,
    maxRank: 3,
    prerequisites: [],
    description: 'Channels soothing holy light, immediately restoring 38 Hit Points.',
    descriptionVi: 'Vận thánh quang dịu mát, lập tức hồi phục 38 Máu cho anh hùng.',
    rankBonuses: [
      'Cấp 1: Hồi phục ngay lập tức +38 HP',
      'Cấp 2: Tăng lượng hồi máu lên +50 HP, giảm -1 MP',
      'Cấp 3: Hồi phục +62 HP, ban thêm hiệu ứng phòng hộ nhẹ',
    ],
    statPassive: { stat: 'hp', amount: 20, label: '+20 Máu Tối Đa' },
  },
  {
    id: 'inner_focus',
    name: 'Inner Clarity',
    nameVi: 'Thiền Định Tụ Khí',
    branch: 'cleric',
    tier: 1,
    icon: 'Sparkle',
    color: '#13c2c2',
    cost: 1,
    maxRank: 3,
    prerequisites: [],
    description: 'Calm the breathing to instantly regenerate 14 MP and heighten focus.',
    descriptionVi: 'Tĩnh tâm gom khí lực, hồi ngay 14 Điểm Mana (MP) mà không tốn năng lượng.',
    rankBonuses: [
      'Cấp 1: Hồi ngay 14 MP không tốn năng lượng',
      'Cấp 2: Tăng lượng MP hồi phục lên 20 MP',
      'Cấp 3: Hồi phục 26 MP và nhận hiệu ứng Tập Trung',
    ],
    statPassive: { stat: 'mp', amount: 10, label: '+10 MP Tối Đa' },
  },
  {
    id: 'purifying_radiance',
    name: 'Purifying Light',
    nameVi: 'Thánh Quang Thanh Tẩy',
    branch: 'cleric',
    tier: 2,
    icon: 'SunMedium',
    color: '#faad14',
    cost: 1,
    maxRank: 3,
    prerequisites: ['mend_wounds'],
    description: 'Cleanses all debilitating debuffs (Poison, Burn, Weaken) and restores 25 HP.',
    descriptionVi: 'Tẩy sạch toàn bộ trạng thái bất lợi (Độc, Đốt cháy, Yếu) và hồi 25 Máu.',
    rankBonuses: [
      'Cấp 1: Thanh tẩy toàn bộ debuff và hồi 25 HP',
      'Cấp 2: Hồi phục tăng lên 35 HP, giảm -2 MP',
      'Cấp 3: Hồi phục 45 HP và kháng debuff trong lượt tiếp theo',
    ],
  },
  {
    id: 'regenerative_bloom',
    name: 'Verdant Bloom',
    nameVi: 'Sinh Mệnh Nở Hoa',
    branch: 'cleric',
    tier: 2,
    icon: 'Sprout',
    color: '#73d13d',
    cost: 1,
    maxRank: 3,
    prerequisites: ['mend_wounds'],
    description: 'Grants continuous Regeneration healing (+8 HP each turn for 4 turns).',
    descriptionVi: 'Ban phước lành tái sinh liên tục, tự động hồi máu mỗi khi bắt đầu lượt mới.',
    rankBonuses: [
      'Cấp 1: Ban hiệu ứng Tái Sinh (hồi 8 HP/lượt trong 4 lượt)',
      'Cấp 2: Tăng lượng hồi lên 12 HP/lượt, hồi ngay 15 HP lúc kích hoạt',
      'Cấp 3: Tái sinh kéo dài 5 lượt (hồi 16 HP/lượt), +10 Max HP',
    ],
    statPassive: { stat: 'hp', amount: 10, label: '+10 Máu Tối Đa' },
  },
  {
    id: 'windstride_haste',
    name: 'Windstride',
    nameVi: 'Phong Bộ Thần Tốc',
    branch: 'cleric',
    tier: 2,
    icon: 'Footprints',
    color: '#36cfc9',
    cost: 1,
    maxRank: 3,
    prerequisites: ['inner_focus'],
    description: 'Channels wind essence around the boots, accelerating turn order by +40% SPD.',
    descriptionVi: 'Cuộn gió dưới chân, tăng 40% Tốc Độ hành động giúp luôn đi trước quái vật.',
    rankBonuses: [
      'Cấp 1: Tăng 40% Tốc Độ trong 3 lượt',
      'Cấp 2: Kéo dài lên 4 lượt, giảm -2 MP',
      'Cấp 3: +4 SPD vĩnh viễn và né tránh đòn đánh đầu tiên',
    ],
    statPassive: { stat: 'spd', amount: 4, label: '+4 Tốc (SPD)' },
  },
  {
    id: 'greater_heal',
    name: 'Greater Cure',
    nameVi: 'Đại Trị Liệu',
    branch: 'cleric',
    tier: 3,
    icon: 'HeartHandshake',
    color: '#52c41a',
    cost: 1,
    maxRank: 3,
    prerequisites: ['purifying_radiance'],
    description: 'A powerful surge of restorative energy that heals 80 Hit Points.',
    descriptionVi: 'Dòng năng lượng phục hồi dồi dào, hồi ngay 80 Máu vượt trội.',
    rankBonuses: [
      'Cấp 1: Hồi phục thần tốc +80 HP',
      'Cấp 2: Tăng lượng hồi máu lên +105 HP, giảm -3 MP',
      'Cấp 3: Hồi phục tối đa +130 HP, hồi kèm 15 MP',
    ],
  },
  {
    id: 'aegis_barrier',
    name: 'Holy Aegis',
    nameVi: 'Khiên Thần Hộ Thể',
    branch: 'cleric',
    tier: 3,
    icon: 'ShieldCheck',
    color: '#13c2c2',
    cost: 1,
    maxRank: 3,
    prerequisites: ['regenerative_bloom'],
    description: 'Envelops the warrior in a sacred barrier, granting Fortified (+50% DEF) & Regen.',
    descriptionVi: 'Tạo lồng chắn thần thánh, ban hiệu ứng Kiên Cố (+50% Thủ) và hồi máu.',
    rankBonuses: [
      'Cấp 1: Khiên thần hộ thể (+50% DEF 3 lượt, hồi 20 HP)',
      'Cấp 2: Kéo dài lên 4 lượt, hồi phục tăng lên 35 HP',
      'Cấp 3: +6 DEF vĩnh viễn và miễn nhiễm sát thương chí mạng',
    ],
    statPassive: { stat: 'def', amount: 6, label: '+6 Giáp (DEF)' },
  },
  {
    id: 'divine_blessing',
    name: 'Divine Blessing',
    nameVi: 'Ân Điển Thần Thánh',
    branch: 'cleric',
    tier: 3,
    icon: 'Crown',
    color: '#fa8c16',
    cost: 1,
    maxRank: 3,
    prerequisites: ['greater_heal'],
    description: 'Bestows holy grace: heals 50 HP, restores 10 MP, and grants Empowered buff.',
    descriptionVi: 'Nhận ân điển: hồi 50 Máu, ban hiệu ứng Tăng Lực (+40% Công) trong 3 lượt.',
    rankBonuses: [
      'Cấp 1: Hồi 50 HP, ban hiệu ứng Tăng Lực (+40% Công 3 lượt)',
      'Cấp 2: Hồi 70 HP, hồi 15 MP, giảm tiêu hao',
      'Cấp 3: Ban hiệu ứng toàn năng: +50% Công và +50% Thủ trong 4 lượt',
    ],
  },
  {
    id: 'judgment_lantern',
    name: 'Judgment of Lanternfall',
    nameVi: 'Đèn Cổ Thẩm Phán',
    branch: 'cleric',
    tier: 4,
    icon: 'Lamp',
    color: '#ffd666',
    cost: 1,
    maxRank: 3,
    prerequisites: ['divine_blessing'],
    description: 'Releases primordial blaze of the ancient lantern: strikes all foes and heals caster.',
    descriptionVi: 'Bộc phát ánh sáng thần thánh từ Đèn Cổ: sát thương toàn bộ quái vật và hồi máu.',
    rankBonuses: [
      'Cấp 1: Bộc phát ánh sáng Đèn Cổ (50 Uy Lực toàn thể, hồi 30 HP)',
      'Cấp 2: Tăng lên 62 Uy Lực, hồi 45 HP cho bản thân',
      'Cấp 3: 75 Uy Lực tuyệt đối, thanh tẩy toàn bộ debuff và hồi đầy 60 HP',
    ],
  },

  // ==========================================
  // 4. SHADOW & HEXES BRANCH (8 Abilities)
  // ==========================================
  {
    id: 'poison_dart',
    name: 'Toxic Needle',
    nameVi: 'Phi Tiêu Độc',
    branch: 'shadow',
    tier: 1,
    icon: 'Syringe',
    color: '#52c41a',
    cost: 1,
    maxRank: 3,
    prerequisites: [],
    description: 'Strikes with an envenomed needle, causing lingering Poison (12 DMG/turn).',
    descriptionVi: 'Phóng tiêu tẩm độc cực độc, làm đối phương trúng độc sâu 4 lượt.',
    rankBonuses: [
      'Cấp 1: Phi tiêu độc tố (14 Uy Lực, Độc 12 DMG/lượt trong 4 lượt)',
      'Cấp 2: Tăng sát thương độc lên 16 DMG/lượt, giảm -1 MP',
      'Cấp 3: Tăng lên 20 DMG/lượt, gây Suy Yếu 2 lượt',
    ],
  },
  {
    id: 'vicious_rend',
    name: 'Vicious Rend',
    nameVi: 'Xé Rách Vết Thương',
    branch: 'shadow',
    tier: 1,
    icon: 'Droplet',
    color: '#e85d56',
    cost: 1,
    maxRank: 3,
    prerequisites: [],
    description: 'Tears open a deep laceration that inflicts painful bleeding over several turns.',
    descriptionVi: 'Gây vết thương hở sâu, khiến kẻ địch chảy máu mất máu liên tục mỗi lượt.',
    rankBonuses: [
      'Cấp 1: Xé toạc da thịt (20 Uy Lực, Chảy Máu 3 lượt)',
      'Cấp 2: Tăng +25% Sát Thương (25 Uy Lực), giảm -1 MP',
      'Cấp 3: Tăng +50% Sát Thương (30 Uy Lực), bỏ qua giáp phòng ngự',
    ],
  },
  {
    id: 'blinding_ash',
    name: 'Ashen Blindness',
    nameVi: 'Khói Tro Mù Mắt',
    branch: 'shadow',
    tier: 2,
    icon: 'EyeOff',
    color: '#8c8c8c',
    cost: 1,
    maxRank: 3,
    prerequisites: ['poison_dart'],
    description: 'Flings burnt ash into the eyes of all enemies, crippling their offense.',
    descriptionVi: 'Hắt đám tro tàn vào mắt kẻ địch, làm giảm mạnh độ chính xác và lực đánh.',
    rankBonuses: [
      'Cấp 1: Làm mù TOÀN BỘ kẻ địch (12 Uy Lực, Suy Yếu 2 lượt)',
      'Cấp 2: Kéo dài hiệu ứng suy yếu lên 3 lượt, giảm -2 MP',
      'Cấp 3: Uy Lực tăng lên 20, kẻ địch có tỷ lệ đánh trượt 40%',
    ],
  },
  {
    id: 'corrosive_acid',
    name: 'Armor Corrosion',
    nameVi: 'Axit Ăn Mòn',
    branch: 'shadow',
    tier: 2,
    icon: 'FlaskConical',
    color: '#a0d911',
    cost: 1,
    maxRank: 3,
    prerequisites: ['vicious_rend'],
    description: 'Melts armor plates with virulent bile, leaving the target permanently vulnerable.',
    descriptionVi: 'Tưới axit cực mạnh làm tan chảy giáp sắt, khiến kẻ thù nhận thêm nhiều sát thương.',
    rankBonuses: [
      'Cấp 1: Ăn mòn giáp trụ (15 Uy Lực, Ăn mòn 3 lượt)',
      'Cấp 2: Tăng +25% Sát Thương, tăng tốc độ rút máu đối thủ',
      'Cấp 3: Tăng +50% Sát Thương, giảm 50% chỉ số giáp của đối thủ',
    ],
  },
  {
    id: 'curse_of_ruin',
    name: 'Hex of Ruin',
    nameVi: 'Lời Nguyền Suy Kiệt',
    branch: 'shadow',
    tier: 3,
    icon: 'Skull',
    color: '#9254de',
    cost: 1,
    maxRank: 3,
    prerequisites: ['blinding_ash'],
    description: 'Inflicts ancient ruin hex that withers both enemy attack strength and defense.',
    descriptionVi: 'Nguyền rủa đối thủ làm suy yếu toàn diện cả Công lẫn Giáp (-30%).',
    rankBonuses: [
      'Cấp 1: Lời nguyền cổ suy kiệt (16 Uy Lực, Suy Yếu nặng 3 lượt)',
      'Cấp 2: Tăng thời hạn lời nguyền lên 4 lượt, giảm -2 MP',
      'Cấp 3: Tăng Uy Lực lên 26, giảm 40% Công và 40% Thủ kẻ địch',
    ],
  },
  {
    id: 'frost_freeze',
    name: 'Deep Permafrost',
    nameVi: 'Băng Kết Tuyệt Đối',
    branch: 'shadow',
    tier: 3,
    icon: 'Snowflake',
    color: '#1890ff',
    cost: 1,
    maxRank: 3,
    prerequisites: ['corrosive_acid'],
    description: 'Encases the enemy in glacial rime, severely dampening their speed and offense.',
    descriptionVi: 'Đóng băng cứng ngắc mục tiêu, kìm hãm hoàn toàn sức mạnh kẻ thù.',
    rankBonuses: [
      'Cấp 1: Đóng băng mục tiêu (19 Uy Lực, Cóng buốt 3 lượt)',
      'Cấp 2: Tăng lên 25 Uy Lực, giảm -2 MP',
      'Cấp 3: Tăng lên 32 Uy Lực, đối thủ mất lượt đầu tiên sau khi bị đóng băng',
    ],
  },
  {
    id: 'berserker_trance',
    name: 'Berserk Trance',
    nameVi: 'Hóa Điên Huyết Chiến',
    branch: 'shadow',
    tier: 3,
    icon: 'Flame',
    color: '#eb2f96',
    cost: 1,
    maxRank: 3,
    prerequisites: ['curse_of_ruin'],
    description: 'Sacrifices 10 HP to enter an unstoppable frenzy, raising ATK and SPD drastically.',
    descriptionVi: 'Hiến tế 10 Máu để nhập trạng thái cuồng nộ: tăng vượt trội Công và Tốc độ.',
    rankBonuses: [
      'Cấp 1: Kích hoạt Huyết Chiến (+40% ATK & SPD trong 4 lượt)',
      'Cấp 2: Giảm lượng máu hiến tế xuống chỉ còn 5 HP, giảm -2 MP',
      'Cấp 3: Tăng lên +60% ATK & SPD, hút 20% sát thương gây ra thành máu',
    ],
  },
  {
    id: 'omnislash_fury',
    name: 'Blade of the Seven Stars',
    nameVi: 'Thất Tinh Tuyệt Kiếm',
    branch: 'shadow',
    tier: 4,
    icon: 'Zap',
    color: '#ff4d4f',
    cost: 1,
    maxRank: 3,
    prerequisites: ['berserker_trance'],
    description: 'Unleashes 7 supersonic strikes in blink of an eye. Catastrophic single-target execution.',
    descriptionVi: '7 nhát chém chớp nhoáng với tốc độ âm thanh, đòn trừng phạt tối thượng xé xác kẻ thù.',
    rankBonuses: [
      'Cấp 1: 7 đòn trảm chớp nhoáng siêu tốc (60 Uy Lực hủy diệt)',
      'Cấp 2: Tăng lên 75 Uy Lực, giảm -4 MP',
      'Cấp 3: 90 Uy Lực chí tôn vô song, 100% bạo kích xé rách mọi kẻ thù',
    ],
  },
];

export function getSkillTreeNode(id: string): SkillTreeNode | undefined {
  return SKILL_TREE_NODES.find((node) => node.id === id);
}

export function getNodesByBranch(branch: SkillBranchId): SkillTreeNode[] {
  return SKILL_TREE_NODES.filter((node) => node.branch === branch);
}

export function getNodeRequiredLevel(node: SkillTreeNode): number {
  if (node.requiredLevel) return node.requiredLevel;
  switch (node.tier) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 4;
    case 4:
      return 6;
    default:
      return 1;
  }
}

export function canUnlockOrUpgradeNode(
  node: SkillTreeNode,
  unlockedSkills: Record<string, number>,
  skillPoints: number,
  playerLevel: number = 1
): { canUnlock: boolean; reason?: string } {
  const currentRank = unlockedSkills[node.id] || 0;

  if (currentRank >= node.maxRank) {
    return { canUnlock: false, reason: 'Đã đạt cấp tối đa (MAX)' };
  }

  const reqLevel = getNodeRequiredLevel(node);
  if (playerLevel < reqLevel) {
    return {
      canUnlock: false,
      reason: `Yêu cầu Nhân vật Cấp ${reqLevel} (Hiện tại: Cấp ${playerLevel})`,
    };
  }

  if (skillPoints < node.cost) {
    return { canUnlock: false, reason: `Cần ${node.cost} Điểm Kỹ Năng (SP)` };
  }

  // Check prerequisites
  for (const prereqId of node.prerequisites) {
    if (!unlockedSkills[prereqId] || unlockedSkills[prereqId] < 1) {
      const prereqNode = getSkillTreeNode(prereqId);
      const name = prereqNode?.nameVi || prereqNode?.name || prereqId;
      return { canUnlock: false, reason: `Yêu cầu mở khóa: ${name}` };
    }
  }

  return { canUnlock: true };
}
