/**
 * 体质系统类型定义
 * 用于性斗学园的体质/被动特性数据结构
 */

// ==================== 枚举定义 ====================

/** 体质类别 */
export enum ConstitutionCategory {
  /** 身体特征 - 关于身体的物理特性 */
  PHYSICAL = 'physical',
  /** 敏感体质 - 关于敏感度的特性 */
  SENSITIVITY = 'sensitivity',
  /** 精神特质 - 关于心理的特性 */
  MENTAL = 'mental',
  /** 恢复能力 - 关于回复的特性 */
  RECOVERY = 'recovery',
  /** 特殊体质 - 独特的体质 */
  SPECIAL = 'special',
  /** 属性倾向 - S/M 等属性 */
  TENDENCY = 'tendency',
  /** 种族特性 - 非人类特有 */
  RACIAL = 'racial',
}

/** 体质稀有度 */
export enum ConstitutionRarity {
  /** 普通 */
  COMMON = 'C',
  /** 稀有 */
  RARE = 'B',
  /** 精良 */
  EPIC = 'A',
  /** 传说 */
  LEGENDARY = 'S',
  /** 神话 */
  MYTHIC = 'SS',
  /** 超规格 */
  EX = 'EX',
}

/** 触发时机 */
export enum TriggerTiming {
  /** 回合开始 */
  TURN_START = 'turn_start',
  /** 回合结束 */
  TURN_END = 'turn_end',
  /** 受到攻击时 */
  ON_HIT = 'on_hit',
  /** 攻击时 */
  ON_ATTACK = 'on_attack',
  /** 暴击时 */
  ON_CRIT = 'on_crit',
  /** 被暴击时 */
  ON_CRIT_RECEIVED = 'on_crit_received',
  /** 高潮时 */
  ON_ORGASM = 'on_orgasm',
  /** 对方高潮时 */
  ON_ENEMY_ORGASM = 'on_enemy_orgasm',
  /** 快感达到阈值 */
  ON_LUST_THRESHOLD = 'on_lust_threshold',
  /** 耐力低于阈值 */
  ON_LOW_STAMINA = 'on_low_stamina',
  /** 战斗开始 */
  BATTLE_START = 'battle_start',
  /** 战斗结束 */
  BATTLE_END = 'battle_end',
  /** 被观看时 */
  ON_SPECTATE = 'on_spectate',
  /** 技能使用时 */
  ON_SKILL_USE = 'on_skill_use',
  /** 闪避成功时 */
  ON_DODGE = 'on_dodge',
  /** 常驻/永久生效 */
  PASSIVE = 'passive',
}

// ==================== 接口定义 ====================

/** 属性修正 */
export interface StatModifier {
  /** 属性名称 */
  stat: string;
  /** 修正值 */
  value: number;
  /** 是否为百分比 */
  isPercent: boolean;
}

/** 触发效果 */
export interface TriggerEffect {
  /** 触发时机 */
  timing: TriggerTiming;
  /** 触发概率（0-100） */
  chance: number;
  /** 触发条件描述 */
  condition?: string;
  /** 效果描述 */
  effectDescription: string;
  /** 数值效果 */
  statEffects?: StatModifier[];
  /** 特殊效果ID（由战斗系统处理） */
  specialEffectId?: string;
  /** 内部冷却（回合） */
  internalCooldown?: number;
}

/** 敏感度修正 */
export interface SensitivityModifier {
  /** 部位名称 */
  bodyPart: string;
  /** 修正值（百分比） */
  modifier: number;
}

/** 体质数据 */
export interface ConstitutionData {
  // === 基本信息 ===
  /** 唯一ID */
  id: string;
  /** 体质名称 */
  name: string;
  /** 体质描述 */
  description: string;
  /** 详细效果说明 */
  effectDescription: string;
  /** 图标名称 */
  icon: string;
  /** 体质类别 */
  category: ConstitutionCategory;
  /** 稀有度 */
  rarity: ConstitutionRarity;

  // === 属性效果 ===
  /** 永久属性修正（常驻） */
  permanentModifiers: StatModifier[];
  /** 敏感度修正 */
  sensitivityModifiers: SensitivityModifier[];

  // === 触发效果 ===
  /** 触发效果列表 */
  triggerEffects: TriggerEffect[];

  // === 限制条件 ===
  /** 性别限制（空为不限） */
  genderRestriction: string[];
  /** 与其他体质互斥 */
  excludeConstitutions: string[];
  /** 前置体质要求 */
  requireConstitutions: string[];
  /** 最大可拥有数量 */
  maxCount: number;

  // === 显示相关 ===
  /** 正面/负面 */
  isPositive: boolean;
  /** 是否隐藏（需要特殊方式发现） */
  hidden: boolean;
  /** 风味文字 */
  flavorText?: string;
}

// ==================== 常量 ====================

/** 体质类别中文名 */
export const CONSTITUTION_CATEGORY_NAMES: Record<ConstitutionCategory, string> = {
  [ConstitutionCategory.PHYSICAL]: '身体特征',
  [ConstitutionCategory.SENSITIVITY]: '敏感体质',
  [ConstitutionCategory.MENTAL]: '精神特质',
  [ConstitutionCategory.RECOVERY]: '恢复能力',
  [ConstitutionCategory.SPECIAL]: '特殊体质',
  [ConstitutionCategory.TENDENCY]: '属性倾向',
  [ConstitutionCategory.RACIAL]: '种族特性',
};

/** 触发时机中文名 */
export const TRIGGER_TIMING_NAMES: Record<TriggerTiming, string> = {
  [TriggerTiming.TURN_START]: '回合开始',
  [TriggerTiming.TURN_END]: '回合结束',
  [TriggerTiming.ON_HIT]: '受到攻击时',
  [TriggerTiming.ON_ATTACK]: '攻击时',
  [TriggerTiming.ON_CRIT]: '暴击时',
  [TriggerTiming.ON_CRIT_RECEIVED]: '被暴击时',
  [TriggerTiming.ON_ORGASM]: '高潮时',
  [TriggerTiming.ON_ENEMY_ORGASM]: '对方高潮时',
  [TriggerTiming.ON_LUST_THRESHOLD]: '快感达到阈值',
  [TriggerTiming.ON_LOW_STAMINA]: '耐力低于阈值',
  [TriggerTiming.BATTLE_START]: '战斗开始',
  [TriggerTiming.BATTLE_END]: '战斗结束',
  [TriggerTiming.ON_SPECTATE]: '被观看时',
  [TriggerTiming.ON_SKILL_USE]: '技能使用时',
  [TriggerTiming.ON_DODGE]: '闪避成功时',
  [TriggerTiming.PASSIVE]: '永久生效',
};

/** 体质稀有度颜色 */
export const CONSTITUTION_RARITY_COLORS: Record<ConstitutionRarity, string> = {
  [ConstitutionRarity.COMMON]: '#9ca3af',
  [ConstitutionRarity.RARE]: '#60a5fa',
  [ConstitutionRarity.EPIC]: '#a78bfa',
  [ConstitutionRarity.LEGENDARY]: '#fbbf24',
  [ConstitutionRarity.MYTHIC]: '#f472b6',
  [ConstitutionRarity.EX]: '#67e8f9',
};

/** 身体部位列表 */
export const BODY_PARTS = [
  'lips', // 嘴唇
  'neck', // 脖子
  'ears', // 耳朵
  'nipples', // 乳头
  'breasts', // 胸部
  'belly', // 腹部
  'back', // 背部
  'waist', // 腰部
  'hips', // 臀部
  'anus', // 后庭
  'penis', // 阴茎
  'vagina', // 阴道
  'clitoris', // 阴蒂
  'prostate', // 前列腺
  'testicles', // 睾丸
  'feet', // 足部
  'hands', // 手部
  'inner_thigh', // 大腿内侧
] as const;

/** 身体部位中文名 */
export const BODY_PART_NAMES: Record<string, string> = {
  lips: '嘴唇',
  neck: '脖子',
  ears: '耳朵',
  nipples: '乳头',
  breasts: '胸部',
  belly: '腹部',
  back: '背部',
  waist: '腰部',
  hips: '臀部',
  anus: '后庭',
  penis: '阴茎',
  vagina: '阴道',
  clitoris: '阴蒂',
  prostate: '前列腺',
  testicles: '睾丸',
  feet: '足部',
  hands: '手部',
  inner_thigh: '大腿内侧',
};
