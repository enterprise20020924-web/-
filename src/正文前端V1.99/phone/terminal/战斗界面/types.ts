/**
 * 战斗界面类型定义
 * 与MVU变量结构对应
 */

export type StatType = 'sexPower' | 'endurance' | 'evasion' | 'crit' | 'charm' | 'luck';

/** 战斗属性：资源来自 MVU/运行态，派生属性由 selector 或战斗运行态实时计算。 */
export interface CombatStats {
  maxEndurance: number; // 核心状态.$最大耐力
  currentEndurance: number; // 核心状态.$耐力
  maxPleasure: number; // 核心状态.$最大快感
  currentPleasure: number; // 核心状态.$快感
  climaxCount: number; // 本次战斗运行态
  maxClimaxCount: number; // 性斗系统.胜负规则.高潮次数上限，战斗内最高 5

  // 派生属性
  sexPower: number;
  baseEndurance: number;
  evasion: number;
  /** 开战时的闪避率快照，用于在命中修正后保持部分/完全闪避的初始比例。 */
  dodgeProfileEvasion: number;
  crit: number;
  charm: number;
  luck: number;
  level: number; // 角色基础._等级 / 对手等级
}

/** 技能伤害来源 */
export enum DamageSource {
  SEX_POWER = 'sex_power',
  CHARM = 'charm',
  LUCK = 'luck',
  FIXED = 'fixed',
  TARGET_PLEASURE = 'target_pleasure', // 新增：目标快感
}

/** 技能类型 */
export enum SkillType {
  PHYSICAL = 'physical',
  MENTAL = 'mental',
  CHARM = 'charm',
  SUPPORT = 'support',
  CONTROL = 'control',
  ULTIMATE = 'ultimate',
  // 兼容旧版技能类型
  ATTACK = 'attack',
  BUFF = 'buff',
  DEBUFF = 'debuff',
}

/** Buff类型 */
export enum BuffType {
  ATK_UP = 'atk_up',
  DEF_UP = 'def_up',
  ATK_DOWN = 'atk_down',
  DEF_DOWN = 'def_down',
  SENSITIVE = 'sensitive',
  BIND = 'bind',
  DODGE_UP = 'dodge_up',
  DODGE_DOWN = 'dodge_down',
  CRIT_UP = 'crit_up',
  CRIT_DOWN = 'crit_down',
  LUCK_DOWN = 'luck_down',
  CHARM_DOWN = 'charm_down',
  FOCUS = 'focus',
  FATIGUE = 'fatigue',
  DOT_LUST = 'dot_lust',
  REGEN = 'regen',
}

/** Buff效果 */
export interface BuffEffect {
  type: BuffType;
  value: number;
  isPercent: boolean;
  duration: number;
  stackable: boolean;
  maxStacks?: number;
}

/** 伤害公式组件 */
export interface DamageComponent {
  source: DamageSource;
  coefficient: number;
  baseValue: number;
}

/** 技能数据 */
export interface SkillData {
  id: string;
  name: string;
  description: string;
  effectDescription: string;
  icon?: string;
  type: SkillType;
  rarity?: 'C' | 'B' | 'A' | 'S' | 'SS'; // 新增：稀有度
  level?: number; // 新增：等级
  staminaCost: number;
  cooldown: number;
  castTime: number;
  damageFormula: DamageComponent[];
  powerCoeff?: number; // 新增：威力系数
  accuracy: number;
  accuracyModifier?: number; // 新增：命中率修正
  critModifier: number;
  damageSource?: string; // 新增：伤害来源
  damageDescription?: string; // 新增：伤害描述
  buffs: BuffEffect[];
  canBeReflected: boolean;
  hitCount: number;
  tags?: string[];
  voiceLine?: string;
}

/** 技能实例 (运行时) */
export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: SkillType;
  cooldown: number;
  currentCooldown: number;
  data?: SkillData;
  effect?: (user: Character, target: Character) => CombatLogEntry;
}

/** 物品 */
export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  effect: (user: Character, target: Character) => CombatLogEntry;
  // 物品数值信息（用于显示）
  staminaRestore?: number;
  pleasureReduce?: number;
  pleasureIncrease?: number;
  bonuses?: Record<string, number>; // 临时buff的加成属性
  combatEffects?: Record<string, any>; // 复用技能效果列表格式的战斗效果
}

/** 角色 */
export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
  stats: CombatStats;
  skills: Skill[];
  items: Item[];
  isPlayer: boolean;
  statusEffects: StatusEffect[];
}

/** 状态效果 (运行时) */
export interface StatusEffect {
  id: string;
  name: string;
  duration: number;
  icon: string;
  effect: BuffEffect;
  type: 'buff' | 'debuff';
}

/** 战斗日志条目 */
export interface CombatLogEntry {
  id: string;
  turn: number;
  message: string;
  source: string;
  type: 'damage' | 'heal' | 'info' | 'critical' | 'buff' | 'debuff' | 'danger' | 'climax' | 'victory';
}

/** 回合状态 */
export interface TurnState {
  currentTurn: number;
  phase: 'playerInput' | 'processing' | 'enemyAction' | 'victory' | 'defeat' | 'climaxResolution' | 'gameOver';
  enemyIntention: Skill | null;
  /** 上一回合实际使用的敌方技能，用于避免连续预告同一技能。 */
  lastEnemySkillId: string | null;
  climaxTarget: 'player' | 'enemy' | null;
}

/** MVU数据结构 - 对应新的Schema */
export interface MvuStatData {
  角色基础: {
    _等级: number;
    _姓名: string;
    经验值: number;
    声望: number;
    _段位: string;
    难度: '简单' | '普通' | '困难' | '抖M' | '作弊';
    性别: '男' | '女' | '非二元';
  };
  核心状态: {
    $属性点: number;
    $技能点: number;
    $最大耐力: number;
    $耐力: number;
    $最大快感: number;
    $快感: number;
    堕落度: number;
    _潜力: number;
  };
  基础属性: {
    _魅力: number;
    _幸运: number;
    _闪避率: number;
    _暴击率: number;
  };
  临时状态: {
    状态列表: Record<
      string,
      {
        加成: BonusStats;
        剩余回合: number;
        描述?: string;
        资源变化?: { 快感?: number; 耐力?: number; 是否为百分比?: boolean };
        特殊效果?: { 类型?: string; 效果值?: number; 是否为百分比?: boolean };
      }
    >;
  };
  永久状态: {
    状态列表: Record<
      string,
      {
        加成: BonusStats;
        描述?: string;
        资源变化?: { 快感?: number; 耐力?: number; 是否为百分比?: boolean };
        特殊效果?: { 类型?: string; 效果值?: number; 是否为百分比?: boolean };
      }
    >;
  };
  性斗系统: {
    对手名称: string;
    性斗类型: string;
    胜负规则: {
      高潮次数上限: number;
      允许认输: boolean;
    };
  };
  物品系统: {
    _天海信用点: number;
    背包: Record<string, any>;
    _装备栏: {
      主装备: { 名称: string; 等级: string; 加成属性: BonusStats; 描述: string };
      副装备: { 名称: string; 等级: string; 加成属性: BonusStats; 描述: string };
      饰品1: { 名称: string; 等级: string; 加成属性: BonusStats; 描述: string };
      饰品2: { 名称: string; 等级: string; 加成属性: BonusStats; 描述: string };
      特殊装备: { 名称: string; 等级: string; 加成属性: BonusStats; 描述: string };
    };
  };
  技能系统: {
    主动技能: Record<string, any>;
    $天赋: Record<string, any>;
  };
  关系系统: {
    在场人物: string[];
    [key: string]: any; // 动态关系字段
  };
  任务系统: {
    自由任务?: Record<string, any>;
    主线任务: {
      名称: string;
      描述: string;
      状态: string;
      目标: Record<string, any>;
      奖励: string;
      期限: string;
    };
    支线任务: Record<string, any>;
    已完成记录: string[];
  };
  位置系统: {
    坐标: string;
    楼层: number;
    地点名称: string;
  };
  时间系统: {
    日期: string;
    星期: number;
    时间: string;
  };
  势力声望: {
    学生会: number;
    女权协会: number;
    BF社: number;
    体育联盟: number;
    研究会: number;
    地下联盟: number;
    男性自保联盟: number;
    雌堕会: number;
  };
}

/** 加成属性 */
export interface BonusStats {
  魅力加成: number;
  幸运加成: number;
  基础性斗力加成: number;
  基础性斗力成算: number;
  基础忍耐力加成: number;
  基础忍耐力成算: number;
  闪避率加成: number;
  暴击率加成: number;
}
