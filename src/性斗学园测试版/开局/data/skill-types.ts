/**
 * 技能系统类型定义
 * 用于性斗学园的技能数据结构
 */

// ==================== 枚举定义 ====================

/** 技能类型 */
export enum SkillType {
  /** 物理攻击 - 直接造成快感伤害 */
  PHYSICAL = 'physical',
  /** 精神攻击 - 通过语言、心理压迫或状态扰乱制造优势 */
  MENTAL = 'mental',
  /** 魅力技能 - 基于魅力值的特殊效果 */
  CHARM = 'charm',
  /** 运气技能 - 有随机效果的技能 */
  LUCK = 'luck',
  /** 辅助技能 - 提供增益或恢复 */
  SUPPORT = 'support',
  /** 控制技能 - 限制对手行动 */
  CONTROL = 'control',
  /** 领域技能 - 持续作用的场地效果 */
  FIELD = 'field',
  /** 终结技能 - 强大的大招 */
  ULTIMATE = 'ultimate',
}

/** 伤害来源属性 */
export enum DamageSource {
  /** 性斗力 - 标准物理伤害来源 */
  SEX_POWER = 'sex_power',
  /** 魅力 - 魅力值作为伤害来源 */
  CHARM = 'charm',
  /** 幸运 - 随机伤害 */
  LUCK = 'luck',
  /** 等级 - 基于等级的伤害 */
  LEVEL = 'level',
  /** 潜力 - 基于潜力的伤害 */
  POTENTIAL = 'potential',
  /** 固定值 - 固定伤害 */
  FIXED = 'fixed',
  /** 当前快感 - 基于对手当前快感 */
  TARGET_LUST = 'target_lust',
  /** 缺失耐力 - 基于对手缺失耐力比例 */
  TARGET_MISSING_STAMINA = 'target_missing_stamina',
  /** 自身快感 - 基于自身快感（高风险高回报） */
  SELF_LUST = 'self_lust',
}

/** 技能目标 */
export enum SkillTarget {
  /** 单体敌人 */
  SINGLE_ENEMY = 'single_enemy',
  /** 所有敌人 */
  ALL_ENEMIES = 'all_enemies',
  /** 自己 */
  SELF = 'self',
  /** 单体友方 */
  SINGLE_ALLY = 'single_ally',
  /** 所有友方 */
  ALL_ALLIES = 'all_allies',
  /** 全场 - 敌我都受影响 */
  EVERYONE = 'everyone',
  /** 随机敌人 */
  RANDOM_ENEMY = 'random_enemy',
}

/** Buff/Debuff 类型 */
export enum BuffType {
  // === 增益 ===
  /** 攻击力提升 */
  ATK_UP = 'atk_up',
  /** 防御力提升 */
  DEF_UP = 'def_up',
  /** 忍耐力提升 */
  ENDURANCE_UP = 'endurance_up',
  /** 暴击率提升 */
  CRIT_UP = 'crit_up',
  /** 闪避率提升 */
  DODGE_UP = 'dodge_up',
  /** 回复 - 每回合恢复耐力 */
  REGEN = 'regen',
  /** 护盾 - 吸收快感伤害 */
  SHIELD = 'shield',
  /** 反伤 - 反弹部分伤害 */
  REFLECT = 'reflect',
  /** 吸血 - 造成伤害时恢复耐力 */
  LIFESTEAL = 'lifesteal',
  /** 隐身 - 降低被命中率 */
  STEALTH = 'stealth',
  /** 愤怒 - 攻击力大幅提升但防御下降 */
  RAGE = 'rage',
  /** 集中 - 下次攻击必定暴击 */
  FOCUS = 'focus',

  // === 减益 ===
  /** 攻击力下降 */
  ATK_DOWN = 'atk_down',
  /** 防御力下降 */
  DEF_DOWN = 'def_down',
  /** 忍耐力下降 */
  ENDURANCE_DOWN = 'endurance_down',
  /** 暴击率下降 */
  CRIT_DOWN = 'crit_down',
  /** 闪避率下降 */
  DODGE_DOWN = 'dodge_down',
  /** 持续快感 - 每回合增加快感 */
  DOT_LUST = 'dot_lust',
  /** 束缚 - 无法使用物理技能 */
  BIND = 'bind',
  /** 迷离 - 有概率技能误判 */
  DAZED = 'dazed',
  /** 魅惑 - 有概率攻击队友 */
  CHARM_DEBUFF = 'charm_debuff',
  /** 乏力 - 有概率跳过行动 */
  FATIGUE = 'fatigue',
  /** 兴奋 - 快感积累速度提升（可正可负） */
  AROUSAL = 'arousal',
  /** 敏感 - 受到的快感伤害增加 */
  SENSITIVE = 'sensitive',
  /** 高潮边缘 - 快感上限暂时降低 */
  EDGE = 'edge',
  /** 贤者时间 - 攻击力下降但忍耐提升 */
  POST_ORGASM = 'post_orgasm',
  /** 虚脱 - 全属性大幅下降 */
  EXHAUSTED = 'exhausted',
  /** 标记 - 受到额外伤害 */
  MARKED = 'marked',
}

/** 技能稀有度 */
export enum SkillRarity {
  /** 普通 - 初始就有 */
  COMMON = 'C',
  /** 稀有 - 较为少见 */
  RARE = 'B',
  /** 精良 - 需要特定条件获得 */
  EPIC = 'A',
  /** 传说 - 极难获得 */
  LEGENDARY = 'S',
  /** 神话 - 独一无二 */
  MYTHIC = 'SS',
}

/** 技能解锁条件类型 */
export enum UnlockConditionType {
  /** 等级要求 */
  LEVEL = 'level',
  /** 体质要求 */
  CONSTITUTION = 'constitution',
  /** 技能前置 */
  SKILL_PREREQUISITE = 'skill_prerequisite',
  /** 属性要求 */
  ATTRIBUTE = 'attribute',
  /** 好感度要求 */
  AFFECTION = 'affection',
  /** 特定事件 */
  EVENT = 'event',
  /** 胜利次数 */
  WINS = 'wins',
  /** 高潮次数 */
  ORGASM_COUNT = 'orgasm_count',
}

// ==================== 接口定义 ====================

/** Buff/Debuff 效果 */
export interface BuffEffect {
  /** Buff 类型 */
  type: BuffType;
  /** 效果值（百分比或固定值） */
  value: number;
  /** 是否为百分比 */
  isPercent: boolean;
  /** 持续回合数 (-1 表示永久) */
  duration: number;
  /** 是否可叠加 */
  stackable: boolean;
  /** 最大叠加层数 */
  maxStacks?: number;
  /** 特殊条件触发 */
  trigger?: string;
}

/** 伤害公式组件 */
export interface DamageComponent {
  /** 伤害来源 */
  source: DamageSource;
  /** 系数（百分比） */
  coefficient: number;
  /** 基础固定值 */
  baseValue?: number;
}

/** 技能解锁条件 */
export interface UnlockCondition {
  /** 条件类型 */
  type: UnlockConditionType;
  /** 条件值 */
  value: string | number;
  /** 条件描述 */
  description: string;
}

/** 技能升级数据 */
export interface SkillUpgrade {
  /** 升级所需技能点 */
  cost: number;
  /** 升级后伤害提升百分比 */
  damageIncrease: number;
  /** 升级后消耗减少 */
  costReduction: number;
  /** 升级后冷却减少 */
  cooldownReduction: number;
  /** 特殊解锁效果 */
  specialEffect?: string;
}

/** 完整技能数据 */
export interface SkillData {
  // === 基本信息 ===
  /** 唯一ID */
  id: string;
  /** 技能名称 */
  name: string;
  /** 技能描述 */
  description: string;
  /** 详细效果说明 */
  effectDescription: string;
  /** 图标名称 */
  icon: string;
  /** 技能类型 */
  type: SkillType;
  /** 稀有度 */
  rarity: SkillRarity;

  // === 消耗与冷却 ===
  /** 耐力消耗 */
  staminaCost: number;
  /** 快感消耗（某些特殊技能） */
  lustCost?: number;
  /** 冷却回合数 */
  cooldown: number;
  /** 施放时间（0=即时，>0需要蓄力回合） */
  castTime: number;

  // === 伤害与效果 ===
  /** 伤害公式组件列表 */
  damageFormula: DamageComponent[];
  /** 目标类型 */
  target: SkillTarget;
  /** 基础命中率（100 = 100%） */
  accuracy: number;
  /** 基础暴击率修正 */
  critModifier: number;
  /** 施加的 Buff/Debuff */
  buffs: BuffEffect[];

  // === 特殊机制 ===
  /** 是否忽视防御 */
  ignoreDefense: boolean;
  /** 是否可被闪避 */
  canBeDodged: boolean;
  /** 是否可被反射 */
  canBeReflected: boolean;
  /** 连击次数 */
  hitCount: number;
  /** 自身副作用（如自伤） */
  selfEffect?: BuffEffect[];
  /** 条件触发效果 */
  conditionalEffects?: {
    condition: string;
    effect: BuffEffect;
  }[];

  // === 解锁与升级 ===
  /** 解锁条件 */
  unlockConditions: UnlockCondition[];
  /** 升级数据（最多5级） */
  upgrades: SkillUpgrade[];
  /** 当前等级（运行时） */
  currentLevel?: number;

  // === 显示相关 ===
  /** 动画类型 */
  animationType?: string;
  /** 音效ID */
  soundEffect?: string;
  /** 台词（使用时说的话） */
  voiceLine?: string;
}

/** 技能快捷引用（用于存储已学习技能） */
export interface LearnedSkill {
  /** 技能ID */
  skillId: string;
  /** 当前等级 */
  level: number;
  /** 剩余冷却 */
  currentCooldown: number;
  /** 是否装备（放入技能栏） */
  equipped: boolean;
  /** 技能栏位置（0-5） */
  slotIndex?: number;
}

// ==================== 常量 ====================

/** 技能类型中文名 */
export const SKILL_TYPE_NAMES: Record<SkillType, string> = {
  [SkillType.PHYSICAL]: '物理',
  [SkillType.MENTAL]: '精神',
  [SkillType.CHARM]: '魅惑',
  [SkillType.LUCK]: '运气',
  [SkillType.SUPPORT]: '辅助',
  [SkillType.CONTROL]: '控制',
  [SkillType.FIELD]: '领域',
  [SkillType.ULTIMATE]: '终结',
};

/** 伤害来源中文名 */
export const DAMAGE_SOURCE_NAMES: Record<DamageSource, string> = {
  [DamageSource.SEX_POWER]: '性斗力',
  [DamageSource.CHARM]: '魅力',
  [DamageSource.LUCK]: '幸运',
  [DamageSource.LEVEL]: '等级',
  [DamageSource.POTENTIAL]: '潜力',
  [DamageSource.FIXED]: '固定值',
  [DamageSource.TARGET_LUST]: '目标快感',
  [DamageSource.TARGET_MISSING_STAMINA]: '目标缺失耐力',
  [DamageSource.SELF_LUST]: '自身快感',
};

/** Buff 类型中文名 */
export const BUFF_TYPE_NAMES: Record<BuffType, string> = {
  [BuffType.ATK_UP]: '攻击提升',
  [BuffType.DEF_UP]: '防御提升',
  [BuffType.ENDURANCE_UP]: '忍耐提升',
  [BuffType.CRIT_UP]: '暴击提升',
  [BuffType.DODGE_UP]: '闪避提升',
  [BuffType.REGEN]: '持续回复',
  [BuffType.SHIELD]: '护盾',
  [BuffType.REFLECT]: '反伤',
  [BuffType.LIFESTEAL]: '吸血',
  [BuffType.STEALTH]: '隐身',
  [BuffType.RAGE]: '狂暴',
  [BuffType.FOCUS]: '集中',
  [BuffType.ATK_DOWN]: '攻击下降',
  [BuffType.DEF_DOWN]: '防御下降',
  [BuffType.ENDURANCE_DOWN]: '忍耐下降',
  [BuffType.CRIT_DOWN]: '暴击下降',
  [BuffType.DODGE_DOWN]: '闪避下降',
  [BuffType.DOT_LUST]: '持续快感',
  [BuffType.BIND]: '束缚',
  [BuffType.DAZED]: '迷离',
  [BuffType.CHARM_DEBUFF]: '魅惑',
  [BuffType.FATIGUE]: '乏力',
  [BuffType.AROUSAL]: '兴奋',
  [BuffType.SENSITIVE]: '敏感',
  [BuffType.EDGE]: '高潮边缘',
  [BuffType.POST_ORGASM]: '贤者时间',
  [BuffType.EXHAUSTED]: '虚脱',
  [BuffType.MARKED]: '标记',
};

/** 技能稀有度颜色 */
export const SKILL_RARITY_COLORS: Record<SkillRarity, string> = {
  [SkillRarity.COMMON]: '#9ca3af', // 灰色
  [SkillRarity.RARE]: '#60a5fa', // 蓝色
  [SkillRarity.EPIC]: '#a78bfa', // 紫色
  [SkillRarity.LEGENDARY]: '#fbbf24', // 金色
  [SkillRarity.MYTHIC]: '#f472b6', // 粉色
};

/** 最大技能等级 */
export const MAX_SKILL_LEVEL = 5;

/** 默认技能栏数量 */
export const DEFAULT_SKILL_SLOTS = 6;
