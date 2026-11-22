/**
 * 技能数据转换器
 * 将开局UI的技能数据转换为MVU变量所需的结构
 */

import { BuffType, DamageSource, SkillData } from '../data/skill-types';

// MVU变量中技能效果的结构
export interface MvuSkillEffect {
  效果类型:
    | '性斗力'
    | '忍耐力'
    | '魅力'
    | '幸运'
    | '闪避率'
    | '暴击率'
    | '束缚'
    | '快感变化'
    | '持续快感'
    | '耐力变化'
    | '持续耐力'
    | '敏感'
    | '乏力'
    | '迷离'
    | '集中'
    | '反弹'
    | '吸取快感';
  效果值: number;
  是否为百分比: boolean;
  持续回合数: number;
  是否作用敌人: boolean; // true=作用于敌人, false=作用于自己
}

// MVU变量中主动技能的结构
export interface MvuActiveSkill {
  基本信息: {
    技能名称: string;
    技能描述: string;
    技能等级: number;
    稀有度: 'C' | 'B' | 'A' | 'S' | 'SS';
  };
  冷却与消耗: {
    耐力消耗: number;
    冷却回合数: number;
  };
  伤害与效果: {
    伤害来源: '性斗力' | '魅力' | '幸运' | '固定值' | '目标快感';
    系数: number;
    基础命中率: number;
    效果列表: Record<string, MvuSkillEffect>;
  };
  特殊机制: {
    是否忽视防御: boolean;
    是否可被闪避: boolean;
  };
}

// 伤害来源映射
const DAMAGE_SOURCE_MAP: Partial<Record<DamageSource, MvuActiveSkill['伤害与效果']['伤害来源']>> = {
  [DamageSource.SEX_POWER]: '性斗力',
  [DamageSource.CHARM]: '魅力',
  [DamageSource.LUCK]: '幸运',
  [DamageSource.FIXED]: '固定值',
  [DamageSource.TARGET_LUST]: '目标快感',
  [DamageSource.LEVEL]: '性斗力', // 等级按性斗力处理
  [DamageSource.POTENTIAL]: '性斗力', // 潜力按性斗力处理
  [DamageSource.TARGET_MISSING_STAMINA]: '性斗力', // 缺失耐力按性斗力处理
  [DamageSource.SELF_LUST]: '目标快感', // 自身快感按目标快感处理
};

// Buff类型到效果类型的映射
const BUFF_TYPE_MAP: Partial<Record<BuffType, MvuSkillEffect['效果类型']>> = {
  [BuffType.ATK_UP]: '性斗力',
  [BuffType.ATK_DOWN]: '性斗力',
  [BuffType.DEF_UP]: '忍耐力',
  [BuffType.DEF_DOWN]: '忍耐力',
  [BuffType.ENDURANCE_UP]: '忍耐力',
  [BuffType.ENDURANCE_DOWN]: '忍耐力',
  [BuffType.CRIT_UP]: '暴击率',
  [BuffType.CRIT_DOWN]: '暴击率',
  [BuffType.DODGE_UP]: '闪避率',
  [BuffType.DODGE_DOWN]: '闪避率',
  [BuffType.BIND]: '束缚',
  [BuffType.CHARM_DEBUFF]: '魅力',
  [BuffType.REGEN]: '持续耐力',
  [BuffType.REFLECT]: '反弹',
  [BuffType.LIFESTEAL]: '吸取快感',
  [BuffType.FOCUS]: '集中',
  [BuffType.DOT_LUST]: '持续快感',
  [BuffType.DAZED]: '迷离',
  [BuffType.FATIGUE]: '乏力',
  [BuffType.SENSITIVE]: '敏感',
};

// Debuff类型集合（作用于敌人）
const DEBUFF_TYPES = new Set<BuffType>([
  BuffType.ATK_DOWN,
  BuffType.DEF_DOWN,
  BuffType.ENDURANCE_DOWN,
  BuffType.CRIT_DOWN,
  BuffType.DODGE_DOWN,
  BuffType.BIND,
  BuffType.CHARM_DEBUFF,
  BuffType.DAZED,
  BuffType.FATIGUE,
  BuffType.SENSITIVE,
  BuffType.DOT_LUST,
  BuffType.EDGE,
  BuffType.EXHAUSTED,
  BuffType.MARKED,
]);

// 稀有度映射
const RARITY_MAP: Record<string, 'C' | 'B' | 'A' | 'S' | 'SS'> = {
  C: 'C',
  B: 'B',
  A: 'A',
  S: 'S',
  SS: 'SS',
};

/**
 * 将开局UI的技能数据转换为MVU变量结构
 */
export function convertSkillToMvu(skill: SkillData, level: number = 1): MvuActiveSkill {
  // 确定主要伤害来源和系数
  let mainDamageSource: MvuActiveSkill['伤害与效果']['伤害来源'] = '性斗力';
  let mainCoefficient = 100; // 默认100%

  if (skill.damageFormula && skill.damageFormula.length > 0) {
    // 取第一个伤害公式作为主要伤害来源
    const mainFormula = skill.damageFormula[0];
    mainDamageSource = DAMAGE_SOURCE_MAP[mainFormula.source] || '性斗力';
    // 将系数转换为百分比（原始值是小数）
    mainCoefficient = Math.round(mainFormula.coefficient * 100);
  }

  // 根据等级计算升级加成
  let damageBonus = 0;
  let costReduction = 0;
  let cooldownReduction = 0;

  if (skill.upgrades && level > 1) {
    for (let i = 0; i < Math.min(level - 1, skill.upgrades.length); i++) {
      damageBonus += skill.upgrades[i].damageIncrease || 0;
      costReduction += skill.upgrades[i].costReduction || 0;
      cooldownReduction += skill.upgrades[i].cooldownReduction || 0;
    }
  }

  // 构建效果列表
  const effectList: Record<string, MvuSkillEffect> = {};

  if (skill.buffs && skill.buffs.length > 0) {
    skill.buffs.forEach((buff, index) => {
      const effectType = BUFF_TYPE_MAP[buff.type];
      if (effectType) {
        const effectName = `效果${index + 1}`;
        effectList[effectName] = {
          效果类型: effectType,
          效果值: buff.value,
          是否为百分比: buff.isPercent,
          持续回合数: buff.duration,
          是否作用敌人: DEBUFF_TYPES.has(buff.type), // debuff作用于敌人，buff作用于自己
        };
      }
    });
  }

  return {
    基本信息: {
      技能名称: skill.name,
      技能描述: skill.effectDescription || skill.description,
      技能等级: level,
      稀有度: RARITY_MAP[skill.rarity] || 'C',
    },
    冷却与消耗: {
      耐力消耗: Math.max(0, skill.staminaCost - costReduction),
      冷却回合数: Math.max(0, skill.cooldown - cooldownReduction),
    },
    伤害与效果: {
      伤害来源: mainDamageSource,
      系数: mainCoefficient + damageBonus,
      基础命中率: skill.accuracy,
      效果列表: effectList,
    },
    特殊机制: {
      是否忽视防御: skill.ignoreDefense,
      是否可被闪避: skill.canBeDodged,
    },
  };
}

/**
 * 批量转换技能
 */
export function convertSkillsToMvu(skills: SkillData[], selectedIds: string[]): Record<string, MvuActiveSkill> {
  const result: Record<string, MvuActiveSkill> = {};

  for (const skillId of selectedIds) {
    const skill = skills.find(s => s.id === skillId);
    if (skill) {
      // 使用技能ID作为键
      result[skill.id] = convertSkillToMvu(skill, 1);
    }
  }

  return result;
}

/**
 * 计算技能升级所需的技能点
 */
export function getSkillUpgradeCost(skill: SkillData, currentLevel: number): number {
  if (!skill.upgrades || currentLevel >= 5 || currentLevel < 1) {
    return 0;
  }
  return skill.upgrades[currentLevel - 1]?.cost || 0;
}

/**
 * 获取技能等级提升后的属性变化预览
 */
export function getSkillUpgradePreview(
  skill: SkillData,
  currentLevel: number,
): {
  damageIncrease: number;
  costReduction: number;
  cooldownReduction: number;
  specialEffect?: string;
} | null {
  if (!skill.upgrades || currentLevel >= 5 || currentLevel < 1) {
    return null;
  }

  const upgrade = skill.upgrades[currentLevel - 1];
  if (!upgrade) return null;

  return {
    damageIncrease: upgrade.damageIncrease,
    costReduction: upgrade.costReduction,
    cooldownReduction: upgrade.cooldownReduction,
    specialEffect: upgrade.specialEffect,
  };
}
