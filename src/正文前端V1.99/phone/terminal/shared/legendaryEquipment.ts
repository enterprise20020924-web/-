import type { BonusStats } from './combatMath';

export type LegendaryEquipmentGrade = 'SSS' | 'EX';
export type LegendaryEquipmentSlot = '主装备' | '副装备' | '饰品' | '特殊装备';

export interface LegendaryEquipment {
  id: string;
  name: string;
  grade: LegendaryEquipmentGrade;
  slot: LegendaryEquipmentSlot;
  icon: string;
  source: 'grand_wheel' | 'exorcism' | 'seven_sins' | 'sponsor' | 'anniversary';
  attrFocus: string;
  description: string;
  bonuses: Partial<BonusStats>;
}

export interface EquipmentSkillDefinition {
  id: string;
  equipmentId: string;
  equipmentName: string;
  name: string;
  grade: LegendaryEquipmentGrade;
  description: string;
  usesPerBattle: number;
  cooldown: number;
  sharedCooldownGroup?: string;
  sharedCooldown?: number;
  usesItemAction?: boolean;
}

export interface EquippedEquipmentSkill extends EquipmentSkillDefinition {
  slotKey: string;
}

export type SevenSinKey = '傲慢' | '嫉妒' | '暴怒' | '怠惰' | '贪婪' | '暴食' | '色欲';

export interface SevenSinsBossProgress {
  傲慢: boolean;
  嫉妒: boolean;
  暴怒: boolean;
  怠惰: boolean;
  贪婪: boolean;
  暴食: boolean;
  色欲: boolean;
  七罪王冠已领取: boolean;
}

export const SEVEN_SINS_PROGRESS_VARIABLE_KEY = '性斗学园七罪Boss进度';
export const SEVEN_SIN_KEYS: SevenSinKey[] = ['傲慢', '嫉妒', '暴怒', '怠惰', '贪婪', '暴食', '色欲'];

export const SEVEN_SIN_BOSS_ALIASES: Record<SevenSinKey, string[]> = {
  傲慢: ['伊丽莎白', '伊丽莎白夜羽', 'elizabeth', '傲慢'],
  嫉妒: ['沐芯兰', 'muxinlan', '嫉妒'],
  暴怒: ['克莉丝汀', 'christine', '暴怒'],
  怠惰: ['伊甸芙宁', 'eden', '懒惰', '怠惰'],
  贪婪: ['黑崎晴雯', 'heizaki', '晴雯', '贪婪', '龙魔女'],
  暴食: ['艾格妮丝', 'agnes', '暴食', '蔷薇', '鼠族公主'],
  色欲: ['薇丝佩菈', 'vespera', '色欲'],
};

export const SEVEN_SIN_LEGACY_DROP_NAMES: Record<SevenSinKey, string> = {
  傲慢: '谦卑之冕',
  嫉妒: '仁爱之吊坠',
  暴怒: '忍耐之披风',
  怠惰: '勤勉之护腕',
  贪婪: '慷慨之指环',
  暴食: '节制之王冠',
  色欲: '贞洁之束带',
};

export function createDefaultSevenSinsBossProgress(): SevenSinsBossProgress {
  return {
    傲慢: false,
    嫉妒: false,
    暴怒: false,
    怠惰: false,
    贪婪: false,
    暴食: false,
    色欲: false,
    七罪王冠已领取: false,
  };
}

export function normalizeSevenSinsBossProgress(input: unknown): SevenSinsBossProgress {
  const base = createDefaultSevenSinsBossProgress();
  if (!input || typeof input !== 'object') {
    return base;
  }

  const source = input as Record<string, unknown>;
  SEVEN_SIN_KEYS.forEach(key => {
    base[key] = source[key] === true;
  });
  base.七罪王冠已领取 = source.七罪王冠已领取 === true;
  return base;
}

export function resolveSevenSinByEnemyName(enemyName: string): SevenSinKey | null {
  const normalized = String(enemyName || '')
    .toLowerCase()
    .replace(/_\d+$/g, '');
  if (!normalized) {
    return null;
  }

  for (const sin of SEVEN_SIN_KEYS) {
    if (SEVEN_SIN_BOSS_ALIASES[sin].some(alias => normalized.includes(alias.toLowerCase()))) {
      return sin;
    }
  }

  return null;
}

export function isSevenSinsBossProgressComplete(progress: SevenSinsBossProgress): boolean {
  return SEVEN_SIN_KEYS.every(key => progress[key]);
}

export const LEGENDARY_EQUIPMENTS = {
  fallenNunHolyWater: {
    id: 'fallen_nun_holy_water',
    name: '堕落修女的圣水瓶',
    grade: 'SSS',
    slot: '主装备',
    icon: 'fas fa-flask',
    source: 'anniversary',
    attrFocus: '性斗力',
    description:
      '瓶身的圣徽仍旧洁白，瓶中的液体却散发着甜腻香气。装备技【亵渎圣水】：使目标敏感+20%，持续2回合；每场战斗可使用1次，占用本回合道具次数，不结束回合。',
    bonuses: { 基础性斗力加成: 45, 基础忍耐力加成: 35, 魅力加成: 25, 基础性斗力成算: 8 },
  },
  immobilizingDisc: {
    id: 'immobilizing_disc',
    name: '定身盘',
    grade: 'SSS',
    slot: '饰品',
    icon: 'fas fa-compact-disc',
    source: 'grand_wheel',
    attrFocus: '特殊',
    description:
      '大转盘极低概率产出的SSS饰品。装备技【定身】：目标闪避率-45并获得敏感+25%，若目标当前闪避率高于60%，定身额外延长1回合。',
    bonuses: { 幸运加成: 105, 闪避率加成: 42, 暴击率加成: 28, 魅力加成: 35 },
  },
  godBindingChain: {
    id: 'god_binding_chain',
    name: '缚神链',
    grade: 'SSS',
    slot: '特殊装备',
    icon: 'fas fa-link',
    source: 'grand_wheel',
    attrFocus: '特殊',
    description:
      '大转盘极低概率产出的SSS特殊装备。装备技【破界】：目标基础忍耐力成算-35并束缚1回合；若目标基础忍耐力高于玩家基础性斗力，额外获得敏感+30%。',
    bonuses: { 基础性斗力加成: 95, 基础忍耐力加成: 75, 基础性斗力成算: 22, 暴击率加成: 30 },
  },
  whiteRoseOfAtonement: {
    id: 'white_rose_of_atonement',
    name: '净罪白蔷薇',
    grade: 'SSS',
    slot: '特殊装备',
    icon: 'fas fa-spa',
    source: 'exorcism',
    attrFocus: '忍耐力',
    description: '完成驱魔迷宫最终净化后获得的SSS特殊装备。装备技【净心】：清除自身所有debuff，并降低自身20%最大快感。',
    bonuses: { 基础忍耐力加成: 105, 基础忍耐力成算: 24, 魅力加成: 55, 闪避率加成: 28 },
  },
  smilingBlade: {
    id: 'smiling_blade',
    name: '笑里藏·刀',
    grade: 'SSS',
    slot: '主装备',
    icon: 'fas fa-khanda',
    source: 'sponsor',
    attrFocus: '性斗力',
    description:
      '赞助者专属的SSS主装备。被动【藏锋】：第4回合起每回合叠加一层，性斗力成算+8%、忍耐力成算-5%、暴击率+5%，最多5层。装备技【笑里藏刀】：消耗全部当前耐力造成高额性斗力伤害，增加自身10%最大快感，命中后束缚目标1回合。',
    bonuses: { 基础性斗力加成: 60, 基础性斗力成算: 18, 暴击率加成: 15 },
  },
  undyingStar: {
    id: 'undying_star',
    name: '不陨之星',
    grade: 'SSS',
    slot: '主装备',
    icon: 'fas fa-star',
    source: 'sponsor',
    attrFocus: '魅力',
    description:
      '献给赞助者的SSS主装备。被动【星辉汲取】：造成快感伤害时，按实际伤害的15%降低自身快感。装备技【星火不灭】：造成300%魅力伤害（最多目标最大快感的5%），降低自身18%最大快感并恢复20%最大耐力。',
    bonuses: { 魅力加成: 120, 基础性斗力加成: 45, 基础忍耐力加成: 40 },
  },
  crownOfSevenSins: {
    id: 'crown_of_seven_sins',
    name: '七罪王冠',
    grade: 'EX',
    slot: '特殊装备',
    icon: 'fas fa-crown',
    source: 'seven_sins',
    attrFocus: '特殊',
    description:
      '击败七宗罪Boss后凝成的EX特殊装备。装备技为七选一裁定：每项裁定每场战斗可用1次，不占行动，但七罪之间共享1回合冷却；获得力量时必须支付对应代价。',
    bonuses: {
      基础性斗力加成: 120,
      基础忍耐力加成: 120,
      魅力加成: 90,
      幸运加成: 90,
      基础性斗力成算: 26,
      基础忍耐力成算: 26,
      暴击率加成: 35,
      闪避率加成: 35,
    },
  },
} as const satisfies Record<string, LegendaryEquipment>;

export const LEGENDARY_EQUIPMENT_LIST: LegendaryEquipment[] = Object.values(LEGENDARY_EQUIPMENTS);
export const GRAND_WHEEL_SSS_EQUIPMENT_ITEMS: LegendaryEquipment[] = [
  LEGENDARY_EQUIPMENTS.immobilizingDisc,
  LEGENDARY_EQUIPMENTS.godBindingChain,
];
export const EXORCISM_FINAL_REWARD_EQUIPMENT = LEGENDARY_EQUIPMENTS.whiteRoseOfAtonement;
export const SEVEN_SINS_REWARD_EQUIPMENT = LEGENDARY_EQUIPMENTS.crownOfSevenSins;

export const EQUIPMENT_SKILLS: EquipmentSkillDefinition[] = [
  {
    id: 'equipment_fallen_nun_holy_water',
    equipmentId: LEGENDARY_EQUIPMENTS.fallenNunHolyWater.id,
    equipmentName: LEGENDARY_EQUIPMENTS.fallenNunHolyWater.name,
    name: '亵渎圣水',
    grade: 'SSS',
    description: '目标敏感+20%，持续2回合。占用本回合道具次数，不结束回合。',
    usesPerBattle: 1,
    cooldown: 0,
    usesItemAction: true,
  },
  {
    id: 'equipment_immobilizing_disc_bind',
    equipmentId: LEGENDARY_EQUIPMENTS.immobilizingDisc.id,
    equipmentName: LEGENDARY_EQUIPMENTS.immobilizingDisc.name,
    name: '定身',
    grade: 'SSS',
    description: '目标闪避率-45并获得敏感+25%，持续2回合；若目标当前闪避率高于60%，额外延长1回合。',
    usesPerBattle: 2,
    cooldown: 3,
  },
  {
    id: 'equipment_god_binding_chain_break',
    equipmentId: LEGENDARY_EQUIPMENTS.godBindingChain.id,
    equipmentName: LEGENDARY_EQUIPMENTS.godBindingChain.name,
    name: '破界',
    grade: 'SSS',
    description:
      '目标基础忍耐力成算-35，持续2回合，并束缚目标1回合；若目标基础忍耐力高于玩家基础性斗力，额外敏感+30%。',
    usesPerBattle: 1,
    cooldown: 0,
  },
  {
    id: 'equipment_white_rose_purify',
    equipmentId: LEGENDARY_EQUIPMENTS.whiteRoseOfAtonement.id,
    equipmentName: LEGENDARY_EQUIPMENTS.whiteRoseOfAtonement.name,
    name: '净心',
    grade: 'SSS',
    description: '清除自身所有debuff，并降低自身20%最大快感。',
    usesPerBattle: 2,
    cooldown: 4,
  },
  {
    id: 'equipment_smiling_blade_strike',
    equipmentId: LEGENDARY_EQUIPMENTS.smilingBlade.id,
    equipmentName: LEGENDARY_EQUIPMENTS.smilingBlade.name,
    name: '笑里藏刀',
    grade: 'SSS',
    description: '消耗全部当前耐力，造成高额性斗力伤害；自身快感增加10%最大快感，命中后束缚目标1回合。',
    usesPerBattle: 1,
    cooldown: 0,
  },
  {
    id: 'equipment_undying_star_flare',
    equipmentId: LEGENDARY_EQUIPMENTS.undyingStar.id,
    equipmentName: LEGENDARY_EQUIPMENTS.undyingStar.name,
    name: '星火不灭',
    grade: 'SSS',
    description: '造成300%魅力伤害，伤害最多为目标最大快感的5%；自身快感-18%最大快感，耐力+20%最大耐力。',
    usesPerBattle: 2,
    cooldown: 5,
  },
  {
    id: 'equipment_crown_pride',
    equipmentId: LEGENDARY_EQUIPMENTS.crownOfSevenSins.id,
    equipmentName: LEGENDARY_EQUIPMENTS.crownOfSevenSins.name,
    name: '傲慢裁定',
    grade: 'EX',
    description: '清除目标最多3个正面Buff；每清除1个，使目标基础忍耐力成算-8。代价：自身闪避率-15，持续3回合。',
    usesPerBattle: 1,
    cooldown: 0,
    sharedCooldownGroup: 'seven_sins_crown',
    sharedCooldown: 1,
  },
  {
    id: 'equipment_crown_envy',
    equipmentId: LEGENDARY_EQUIPMENTS.crownOfSevenSins.id,
    equipmentName: LEGENDARY_EQUIPMENTS.crownOfSevenSins.name,
    name: '嫉妒裁定',
    grade: 'EX',
    description: '复制目标高于自身的优势：性斗力/忍耐力+50，魅力/幸运+40，持续2回合。代价：自身迷离+50%，持续1回合。',
    usesPerBattle: 1,
    cooldown: 0,
    sharedCooldownGroup: 'seven_sins_crown',
    sharedCooldown: 1,
  },
  {
    id: 'equipment_crown_wrath',
    equipmentId: LEGENDARY_EQUIPMENTS.crownOfSevenSins.id,
    equipmentName: LEGENDARY_EQUIPMENTS.crownOfSevenSins.name,
    name: '暴怒裁定',
    grade: 'EX',
    description: '目标基础性斗力成算-30，持续1回合，暴击率-25，持续2回合。代价：自身快感增加20%最大快感。',
    usesPerBattle: 1,
    cooldown: 0,
    sharedCooldownGroup: 'seven_sins_crown',
    sharedCooldown: 1,
  },
  {
    id: 'equipment_crown_sloth',
    equipmentId: LEGENDARY_EQUIPMENTS.crownOfSevenSins.id,
    equipmentName: LEGENDARY_EQUIPMENTS.crownOfSevenSins.name,
    name: '怠惰裁定',
    grade: 'EX',
    description: '束缚目标1回合，并使目标闪避率-35，持续2回合。代价：自身基础性斗力成算-10，持续3回合。',
    usesPerBattle: 1,
    cooldown: 0,
    sharedCooldownGroup: 'seven_sins_crown',
    sharedCooldown: 1,
  },
  {
    id: 'equipment_crown_greed',
    equipmentId: LEGENDARY_EQUIPMENTS.crownOfSevenSins.id,
    equipmentName: LEGENDARY_EQUIPMENTS.crownOfSevenSins.name,
    name: '贪婪裁定',
    grade: 'EX',
    description: '延长自身所有正面Buff 1回合。代价：延长对方所有正面Buff 1回合。',
    usesPerBattle: 1,
    cooldown: 0,
    sharedCooldownGroup: 'seven_sins_crown',
    sharedCooldown: 1,
  },
  {
    id: 'equipment_crown_gluttony',
    equipmentId: LEGENDARY_EQUIPMENTS.crownOfSevenSins.id,
    equipmentName: LEGENDARY_EQUIPMENTS.crownOfSevenSins.name,
    name: '暴食裁定',
    grade: 'EX',
    description: '恢复自身25%最大耐力，并降低自身15%最大快感。代价：自身闪避率-25，持续2回合。',
    usesPerBattle: 1,
    cooldown: 0,
    sharedCooldownGroup: 'seven_sins_crown',
    sharedCooldown: 1,
  },
  {
    id: 'equipment_crown_lust',
    equipmentId: LEGENDARY_EQUIPMENTS.crownOfSevenSins.id,
    equipmentName: LEGENDARY_EQUIPMENTS.crownOfSevenSins.name,
    name: '色欲裁定',
    grade: 'EX',
    description: '目标敏感+40%，基础忍耐力成算-20，持续2回合。代价：自身也获得敏感+40%，持续2回合。',
    usesPerBattle: 1,
    cooldown: 0,
    sharedCooldownGroup: 'seven_sins_crown',
    sharedCooldown: 1,
  },
];

export function createLegendaryEquipmentMvuData(equipment: LegendaryEquipment) {
  return {
    类型: '装备',
    等级: equipment.grade,
    描述: equipment.description,
    加成属性: equipment.bonuses || {},
    部位: equipment.slot,
    数量: 1,
  };
}

export function getEquipmentSkillsByEquipmentName(equipmentName: string): EquipmentSkillDefinition[] {
  return EQUIPMENT_SKILLS.filter(skill => skill.equipmentName === equipmentName);
}

export function getEquipmentSkillsFromEquippedSlots(statData: Record<string, any> | null | undefined) {
  const slots = statData?.物品系统?._装备栏;
  if (!slots || typeof slots !== 'object') {
    return [] as EquippedEquipmentSkill[];
  }

  return Object.entries(slots).flatMap(([slotKey, slotData]) => {
    const equipmentName = String((slotData as { 名称?: unknown } | null)?.名称 || '');
    if (!equipmentName) {
      return [] as EquippedEquipmentSkill[];
    }

    return getEquipmentSkillsByEquipmentName(equipmentName).map(skill => ({ ...skill, slotKey }));
  });
}
