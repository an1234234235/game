export interface Stats {
  hp: number;
  mp: number;
  atk: number;
  matk: number;
  def: number;
  mdef: number;
  spd: number;
}

export interface Character {
  id: string;
  name: string;
  classId: 'warrior' | 'guardian' | 'ranger' | 'mage' | 'cleric' | string;
  role: string;
  level: number;
  stats: Stats;
  currentHp: number;
  currentMp: number;
  skills: string[];
  equipment: string[];
  statusEffects: string[];
  experience?: number;
  gold?: number;
  skillPoints?: number;
  unlockedSkills?: Record<string, number>;
}

export interface EnemyTemplate {
  id: string;
  name: string;
  kind: 'monster' | 'boss';
  level: number;
  hp: number;
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  spd: number;
  skills: string[];
  assetKey: string;
}

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

export interface BattleEnemy {
  id: string;
  instanceId: string;
  name: string;
  kind: 'monster' | 'boss';
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  spd: number;
  skills: string[];
  assetKey: string;
  statusEffects?: ActiveStatusEffect[];
}

export interface InitiativeActor {
  id: string;
  name: string;
  side: 'player' | 'enemy';
  spd: number;
  order?: number;
}

export interface BattlePlayer {
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  statusEffects?: ActiveStatusEffect[];
}

export interface BattleState {
  player: BattlePlayer;
  enemies: BattleEnemy[];
  turn: 'player' | 'enemy' | 'result';
  currentActorId: string | null;
  initiative: InitiativeActor[];
  initiativeIndex: number;
  actionLocked: boolean;
  guarding: boolean;
  result: 'victory' | 'defeat' | 'escaped' | null;
  round: number;
  log: string[];
  selection: string;
  selectedEnemyId: string | null;
}

export interface FloorReward {
  xp: number;
  gold: number;
}

export interface FloorDefinition {
  id: number;
  floor: number;
  name: string;
  description: string;
  boss: string;
  reward: FloorReward;
}

export interface FloorEncounter {
  id: string;
  enemyId: string;
  kind: 'monster' | 'boss';
  x: number;
  y: number;
  enemyIds?: string[];
}

export interface ProgressionState {
  currentFloor: number;
  unlockedFloors: number[];
  completedFloors: number[];
  totalXp: number;
  totalGold: number;
  bestFloor: number;
  lastReward: {
    floor: number;
    xp: number;
    gold: number;
  } | null;
}

export interface DungeonState {
  playerX: number;
  playerY: number;
  enemyDefeated: boolean;
  defeatedEncounters: string[];
  floor: number;
  floorName: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

export interface GameState {
  gameTitle: string;
  player: Character;
  party: Character[];
  inventory: InventoryItem[];
  progression: ProgressionState;
  dungeon: DungeonState;
  skillPoints?: number;
  unlockedSkills?: Record<string, number>;
}

export type SceneMode = 'menu' | 'intro' | 'exploration' | 'battle' | 'floor-clear';
