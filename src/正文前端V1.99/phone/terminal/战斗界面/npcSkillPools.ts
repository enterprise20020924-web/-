import { BuffType, DamageSource, SkillType, type DamageComponent, type SkillData } from './types';

export const NPC_PROFESSIONAL_RARITY_WEIGHTS = { C: 4, B: 3, A: 2, S: 1 } as const;

export type SkillFamily = 'hand' | 'oral' | 'foot' | 'chest' | 'ride' | 'tool' | 'mental';

export const SKILL_FAMILY_NAMES: Record<SkillFamily, string> = {
  hand: '手技系',
  oral: '口技系',
  foot: '足技系',
  chest: '胸技系',
  ride: '骑乘系',
  tool: '道具系',
  mental: '精神系',
};

export const NPC_SKILL_FAMILY_ORDER: SkillFamily[] = ['hand', 'oral', 'foot', 'chest', 'ride', 'tool', 'mental'];

type NpcSkillSpec = {
  id: string;
  name: string;
  description: string;
  formula: DamageComponent[];
  accuracy: number;
  critModifier: number;
  hitCount: number;
  staminaCost: number;
  cooldown: number;
  rarity: 'C' | 'B' | 'A' | 'S';
  buffs?: SkillData['buffs'];
  type?: SkillType;
};

const damage = (source: DamageSource, coefficient: number): DamageComponent[] => [
  { source, coefficient, baseValue: 0 },
];
const mixedDamage = (...components: Array<[DamageSource, number]>): DamageComponent[] =>
  components.map(([source, coefficient]) => ({ source, coefficient, baseValue: 0 }));
const status = (type: BuffType, value: number, isPercent: boolean, duration: number): SkillData['buffs'][number] => ({
  type,
  value,
  isPercent,
  duration,
  stackable: false,
});
const sensitive = (value: number, duration: number) => status(BuffType.SENSITIVE, value, true, duration);
const bind = (duration: number) => status(BuffType.BIND, 0, false, duration);
const fatigue = (duration: number) => status(BuffType.FATIGUE, 20, true, duration);
const atkDown = (value: number, duration: number) => status(BuffType.ATK_DOWN, value, true, duration);
const defDown = (value: number, duration: number) => status(BuffType.DEF_DOWN, value, true, duration);
const dodgeDown = (value: number, duration: number) => status(BuffType.DODGE_DOWN, value, true, duration);
const critDown = (value: number, duration: number) => status(BuffType.CRIT_DOWN, value, true, duration);
const dotPleasure = (value: number, duration: number) => status(BuffType.DOT_LUST, value, false, duration);

function createNpcSkill(spec: NpcSkillSpec): SkillData {
  const sourceText = spec.formula
    .map(
      component =>
        `${component.source === DamageSource.SEX_POWER ? '性斗力' : component.source === DamageSource.CHARM ? '魅力' : '幸运'}${Math.round(component.coefficient * 100)}%`,
    )
    .join('+');
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    effectDescription: `${spec.hitCount > 1 ? `${spec.hitCount}段，` : ''}造成${sourceText}伤害`,
    icon: 'Sparkles',
    type:
      spec.type ??
      (spec.formula.every(component => component.source === DamageSource.CHARM) ? SkillType.CHARM : SkillType.PHYSICAL),
    rarity: spec.rarity,
    level: 1,
    staminaCost: spec.staminaCost,
    cooldown: spec.cooldown,
    castTime: 0,
    damageFormula: spec.formula,
    accuracy: spec.accuracy,
    critModifier: spec.critModifier,
    buffs: spec.buffs ?? [],
    canBeReflected: false,
    hitCount: spec.hitCount,
  };
}

const NPC_SKILL_SPECS: Record<SkillFamily, NpcSkillSpec[]> = {
  hand: [
    {
      id: 'npc_hand_1',
      name: '指尖慢揉',
      description: '指尖轻打圈抚弄敏感部位',
      formula: damage(DamageSource.SEX_POWER, 0.6),
      accuracy: 95,
      critModifier: 5,
      hitCount: 1,
      staminaCost: 14,
      cooldown: 2,
      rarity: 'C',
    },
    {
      id: 'npc_hand_2',
      name: '精准套揉',
      description: '双指快速上下套弄敏感区域',
      formula: damage(DamageSource.SEX_POWER, 0.8),
      accuracy: 88,
      critModifier: 12,
      hitCount: 2,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'B',
    },
    {
      id: 'npc_hand_3',
      name: '深入揉压',
      description: '手抚敏感区并温柔揉压核心部位',
      formula: mixedDamage([DamageSource.SEX_POWER, 0.7], [DamageSource.CHARM, 3]),
      accuracy: 90,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'A',
    },
    {
      id: 'npc_hand_4',
      name: '核心摩挲',
      description: '精准抠抓最敏感的欲望带',
      formula: damage(DamageSource.SEX_POWER, 0.5),
      accuracy: 92,
      critModifier: 5,
      hitCount: 1,
      staminaCost: 16,
      cooldown: 3,
      rarity: 'A',
      buffs: [sensitive(15, 2)],
    },
    {
      id: 'npc_hand_5',
      name: '强压抚弄',
      description: '掌心包裹狠狠压迫套抚',
      formula: damage(DamageSource.SEX_POWER, 0.9),
      accuracy: 88,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 3,
      rarity: 'B',
    },
    {
      id: 'npc_hand_6',
      name: '疾速连打',
      description: '五指极速连打套弄抽送',
      formula: damage(DamageSource.SEX_POWER, 0.45),
      accuracy: 85,
      critModifier: 12,
      hitCount: 3,
      staminaCost: 22,
      cooldown: 4,
      rarity: 'A',
    },
    {
      id: 'npc_hand_7',
      name: '强力握勒',
      description: '狠劲握住敏感根部阻断防线',
      formula: damage(DamageSource.SEX_POWER, 1),
      accuracy: 85,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 22,
      cooldown: 4,
      rarity: 'S',
      buffs: [defDown(15, 2)],
    },
    {
      id: 'npc_hand_8',
      name: '幽谷慢抚',
      description: '柔手顺下体慢揉挑逗',
      formula: damage(DamageSource.CHARM, 5),
      accuracy: 90,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'B',
      buffs: [sensitive(10, 2)],
    },
  ],
  oral: [
    {
      id: 'npc_oral_1',
      name: '浅舔挑逗',
      description: '伸出湿润舌尖打圈舔舐敏感点',
      formula: damage(DamageSource.CHARM, 6),
      accuracy: 92,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 14,
      cooldown: 2,
      rarity: 'C',
    },
    {
      id: 'npc_oral_2',
      name: '深吸吞咽',
      description: '将敏感部位深深含入贪婪吸吮',
      formula: damage(DamageSource.SEX_POWER, 1.2),
      accuracy: 85,
      critModifier: 15,
      hitCount: 1,
      staminaCost: 24,
      cooldown: 4,
      rarity: 'A',
    },
    {
      id: 'npc_oral_3',
      name: '游舌卷舐',
      description: '舌头沿着缝隙极速卷动',
      formula: damage(DamageSource.SEX_POWER, 0.8),
      accuracy: 90,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'B',
      buffs: [dotPleasure(5, 3)],
    },
    {
      id: 'npc_oral_4',
      name: '紧贴吮吸',
      description: '嘴唇紧包裹敏感处用力吸吮',
      formula: damage(DamageSource.SEX_POWER, 0.9),
      accuracy: 88,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 3,
      rarity: 'A',
      buffs: [atkDown(10, 2)],
    },
    {
      id: 'npc_oral_5',
      name: '湿热喘息',
      description: '俯身在耳边吐出热气与呻吟',
      formula: damage(DamageSource.CHARM, 7),
      accuracy: 85,
      critModifier: 5,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 4,
      rarity: 'A',
      buffs: [dodgeDown(10, 2)],
    },
    {
      id: 'npc_oral_6',
      name: '啃咬标记',
      description: '贝齿轻轻咬住敏感顶端',
      formula: damage(DamageSource.SEX_POWER, 0.7),
      accuracy: 90,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 16,
      cooldown: 3,
      rarity: 'B',
      buffs: [sensitive(20, 2)],
    },
    {
      id: 'npc_oral_7',
      name: '旋风卷吸',
      description: '口腔形成漩涡卷吸挑逗',
      formula: damage(DamageSource.SEX_POWER, 0.6),
      accuracy: 88,
      critModifier: 12,
      hitCount: 2,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'B',
    },
    {
      id: 'npc_oral_8',
      name: '贪婪真空吸',
      description: '真空包裹窒息式极速榨取',
      formula: mixedDamage([DamageSource.SEX_POWER, 0.8], [DamageSource.CHARM, 4]),
      accuracy: 85,
      critModifier: 15,
      hitCount: 1,
      staminaCost: 25,
      cooldown: 5,
      rarity: 'S',
      buffs: [fatigue(1)],
    },
  ],
  foot: [
    {
      id: 'npc_foot_1',
      name: '趾缝夹磨',
      description: '柔嫩脚趾夹住敏感部位上下打磨',
      formula: damage(DamageSource.SEX_POWER, 0.55),
      accuracy: 90,
      critModifier: 5,
      hitCount: 1,
      staminaCost: 14,
      cooldown: 2,
      rarity: 'C',
    },
    {
      id: 'npc_foot_2',
      name: '足心碾揉',
      description: '双足踩住下体死死碾压摩擦',
      formula: damage(DamageSource.SEX_POWER, 0.75),
      accuracy: 90,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 16,
      cooldown: 2,
      rarity: 'B',
    },
    {
      id: 'npc_foot_3',
      name: '双腿绞杀',
      description: '双腿死死缠住腰腹并锁死下体',
      formula: damage(DamageSource.SEX_POWER, 0.6),
      accuracy: 85,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 4,
      rarity: 'B',
      buffs: [bind(1)],
    },
    {
      id: 'npc_foot_4',
      name: '黑丝蹂躏',
      description: '穿丝袜的足底狠狠踩踏敏感顶端',
      formula: damage(DamageSource.SEX_POWER, 0.8),
      accuracy: 88,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 3,
      rarity: 'A',
      buffs: [dodgeDown(15, 2)],
    },
    {
      id: 'npc_foot_5',
      name: '精准踩揉',
      description: '足弓巧妙施压揉踩要害',
      formula: damage(DamageSource.SEX_POWER, 0.85),
      accuracy: 90,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'B',
    },
    {
      id: 'npc_foot_6',
      name: '强力踏蹂',
      description: '脚跟用力踩压死死固定',
      formula: damage(DamageSource.SEX_POWER, 0.65),
      accuracy: 80,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 22,
      cooldown: 5,
      rarity: 'A',
      buffs: [bind(2)],
    },
    {
      id: 'npc_foot_7',
      name: '脚跟研磨',
      description: '硬质脚跟用力研磨敏感区',
      formula: damage(DamageSource.SEX_POWER, 1),
      accuracy: 85,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 22,
      cooldown: 4,
      rarity: 'A',
      buffs: [defDown(10, 2)],
    },
    {
      id: 'npc_foot_8',
      name: '绝望足枷',
      description: '双足交叉形成天罗地网锁定胯部',
      formula: damage(DamageSource.SEX_POWER, 0.5),
      accuracy: 80,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 25,
      cooldown: 5,
      rarity: 'S',
      buffs: [bind(2), dodgeDown(20, 2)],
    },
  ],
  chest: [
    {
      id: 'npc_chest_1',
      name: '双峰包夹',
      description: '巨乳死死夹住敏感部位滑动',
      formula: damage(DamageSource.SEX_POWER, 0.7),
      accuracy: 90,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 16,
      cooldown: 2,
      rarity: 'C',
    },
    {
      id: 'npc_chest_2',
      name: '乳沟套弄',
      description: '润滑乳沟形成肉隧道上下滑动',
      formula: damage(DamageSource.SEX_POWER, 0.8),
      accuracy: 88,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'B',
    },
    {
      id: 'npc_chest_3',
      name: '爆乳压面',
      description: '巨大双峰压住面部窒息魅惑',
      formula: damage(DamageSource.SEX_POWER, 0.9),
      accuracy: 85,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 3,
      rarity: 'B',
      buffs: [fatigue(1)],
    },
    {
      id: 'npc_chest_4',
      name: '娇乳弹击',
      description: '软肉连绵不绝地拍打抽击',
      formula: damage(DamageSource.SEX_POWER, 0.65),
      accuracy: 88,
      critModifier: 12,
      hitCount: 2,
      staminaCost: 20,
      cooldown: 3,
      rarity: 'A',
    },
    {
      id: 'npc_chest_5',
      name: '柔肌夹击',
      description: '丰满胸肉死死挤压削弱防线',
      formula: damage(DamageSource.SEX_POWER, 1.1),
      accuracy: 85,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 24,
      cooldown: 4,
      rarity: 'A',
      buffs: [defDown(15, 2)],
    },
    {
      id: 'npc_chest_6',
      name: '乳香拥抱',
      description: '搂入怀中用温热乳房包裹头部',
      formula: damage(DamageSource.CHARM, 6),
      accuracy: 90,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'B',
      buffs: [dodgeDown(10, 2)],
    },
    {
      id: 'npc_chest_7',
      name: '剧烈摇晃',
      description: '双峰高速对撞夹击极速摩擦',
      formula: damage(DamageSource.SEX_POWER, 0.7),
      accuracy: 88,
      critModifier: 25,
      hitCount: 2,
      staminaCost: 22,
      cooldown: 4,
      rarity: 'A',
    },
    {
      id: 'npc_chest_8',
      name: '极乐包裹',
      description: '全身软肉压垮对手死死交缠',
      formula: damage(DamageSource.SEX_POWER, 1.3),
      accuracy: 85,
      critModifier: 15,
      hitCount: 1,
      staminaCost: 25,
      cooldown: 5,
      rarity: 'S',
      buffs: [sensitive(20, 2)],
    },
  ],
  ride: [
    {
      id: 'npc_ride_1',
      name: '正面跨坐',
      description: '跨坐在对手身上起伏摇晃',
      formula: damage(DamageSource.SEX_POWER, 0.7),
      accuracy: 90,
      critModifier: 8,
      hitCount: 1,
      staminaCost: 16,
      cooldown: 2,
      rarity: 'C',
    },
    {
      id: 'npc_ride_2',
      name: '背面跨坐',
      description: '背对对手姿势深穿下压',
      formula: damage(DamageSource.SEX_POWER, 0.85),
      accuracy: 88,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'B',
    },
    {
      id: 'npc_ride_3',
      name: '狂乱摇臀',
      description: '胯部高速摆动扭打带起连击',
      formula: damage(DamageSource.SEX_POWER, 0.65),
      accuracy: 85,
      critModifier: 12,
      hitCount: 2,
      staminaCost: 20,
      cooldown: 3,
      rarity: 'B',
    },
    {
      id: 'npc_ride_4',
      name: '压塌深坐',
      description: '整个身体重量直压到底破防',
      formula: damage(DamageSource.SEX_POWER, 1),
      accuracy: 85,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 22,
      cooldown: 4,
      rarity: 'A',
      buffs: [defDown(15, 2)],
    },
    {
      id: 'npc_ride_5',
      name: '坐臀绞杀',
      description: '臀肉强力收缩夹紧对手腰身',
      formula: damage(DamageSource.SEX_POWER, 0.6),
      accuracy: 80,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 4,
      rarity: 'B',
      buffs: [bind(1)],
    },
    {
      id: 'npc_ride_6',
      name: 'M字大开',
      description: '展开M字腿展露姿态深下压',
      formula: damage(DamageSource.CHARM, 6.5),
      accuracy: 88,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 4,
      rarity: 'A',
      buffs: [sensitive(15, 2)],
    },
    {
      id: 'npc_ride_7',
      name: '水蛇盘绞',
      description: '腰胯如水蛇般旋扭碾压',
      formula: mixedDamage([DamageSource.SEX_POWER, 0.8], [DamageSource.CHARM, 3.5]),
      accuracy: 85,
      critModifier: 15,
      hitCount: 1,
      staminaCost: 24,
      cooldown: 4,
      rarity: 'A',
    },
    {
      id: 'npc_ride_8',
      name: '疯狂榨取',
      description: '癫狂下沉起伏压榨对手至极限',
      formula: damage(DamageSource.SEX_POWER, 1.35),
      accuracy: 82,
      critModifier: 15,
      hitCount: 1,
      staminaCost: 26,
      cooldown: 5,
      rarity: 'S',
      buffs: [fatigue(1)],
    },
  ],
  tool: [
    {
      id: 'npc_tool_1',
      name: '跳蛋强袭',
      description: '将强效震动跳蛋贴紧敏感点',
      formula: damage(DamageSource.SEX_POWER, 0.6),
      accuracy: 90,
      critModifier: 5,
      hitCount: 1,
      staminaCost: 16,
      cooldown: 3,
      rarity: 'C',
      buffs: [dotPleasure(8, 3)],
    },
    {
      id: 'npc_tool_2',
      name: '精油全身涂抹',
      description: '倾倒润滑精油破除防御',
      formula: damage(DamageSource.SEX_POWER, 0.8),
      accuracy: 100,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'B',
      buffs: [defDown(15, 3)],
    },
    {
      id: 'npc_tool_3',
      name: '龟甲紧缚',
      description: '紧绷麻绳施加紧缚手法',
      formula: damage(DamageSource.SEX_POWER, 0.4),
      accuracy: 80,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 22,
      cooldown: 5,
      rarity: 'B',
      buffs: [bind(2)],
    },
    {
      id: 'npc_tool_4',
      name: '冰火两重天',
      description: '冰块冷敷与热感油交替刺激',
      formula: damage(DamageSource.CHARM, 5),
      accuracy: 90,
      critModifier: 5,
      hitCount: 1,
      staminaCost: 18,
      cooldown: 3,
      rarity: 'A',
      buffs: [sensitive(25, 2)],
    },
    {
      id: 'npc_tool_5',
      name: '双头震动棒',
      description: '使用多段震动棒进行猛烈抽插',
      formula: damage(DamageSource.SEX_POWER, 0.9),
      accuracy: 85,
      critModifier: 10,
      hitCount: 2,
      staminaCost: 22,
      cooldown: 4,
      rarity: 'B',
    },
    {
      id: 'npc_tool_6',
      name: '剥夺视觉',
      description: '蒙上黑布眼罩使其无法避开攻击',
      formula: damage(DamageSource.CHARM, 4),
      accuracy: 90,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 4,
      rarity: 'A',
      buffs: [dodgeDown(25, 3)],
    },
    {
      id: 'npc_tool_7',
      name: '绝顶电击',
      description: '低压微电流直接刺激敏感点',
      formula: damage(DamageSource.SEX_POWER, 1.1),
      accuracy: 85,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 24,
      cooldown: 4,
      rarity: 'A',
      buffs: [bind(1)],
    },
    {
      id: 'npc_tool_8',
      name: '发情特效药',
      description: '强行灌入高浓度媚药产生剧烈高潮',
      formula: damage(DamageSource.CHARM, 3),
      accuracy: 100,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 25,
      cooldown: 5,
      rarity: 'S',
      buffs: [dotPleasure(12, 4), sensitive(15, 3)],
    },
  ],
  mental: [
    {
      id: 'npc_mental_1',
      name: '靡靡之音',
      description: '附耳吐出露骨荡语动摇意志',
      formula: damage(DamageSource.CHARM, 5.5),
      accuracy: 92,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 14,
      cooldown: 2,
      rarity: 'C',
      type: SkillType.MENTAL,
    },
    {
      id: 'npc_mental_2',
      name: '肆意嘲笑',
      description: '指着对手要害肆意冷笑讥讽',
      formula: damage(DamageSource.CHARM, 4),
      accuracy: 85,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 16,
      cooldown: 3,
      rarity: 'B',
      buffs: [atkDown(15, 2)],
      type: SkillType.MENTAL,
    },
    {
      id: 'npc_mental_3',
      name: '恶堕催眠',
      description: '眼神与怀表交织实施恶堕催眠',
      formula: damage(DamageSource.CHARM, 6.5),
      accuracy: 85,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 4,
      rarity: 'B',
      buffs: [dodgeDown(10, 2)],
      type: SkillType.MENTAL,
    },
    {
      id: 'npc_mental_4',
      name: '尊严踏践',
      description: '将对手自尊踩在脚下进行精神践踏',
      formula: damage(DamageSource.CHARM, 5),
      accuracy: 88,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 16,
      cooldown: 3,
      rarity: 'B',
      buffs: [critDown(10, 2)],
      type: SkillType.MENTAL,
    },
    {
      id: 'npc_mental_5',
      name: '恶劣挑衅',
      description: '用极度欠揍的表情和口吻疯狂挑衅',
      formula: damage(DamageSource.CHARM, 7),
      accuracy: 85,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 3,
      rarity: 'A',
      type: SkillType.MENTAL,
    },
    {
      id: 'npc_mental_6',
      name: '威压顺从',
      description: '释放女王般的气场迫使屈服',
      formula: damage(DamageSource.CHARM, 3.5),
      accuracy: 85,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 22,
      cooldown: 4,
      rarity: 'A',
      buffs: [atkDown(25, 2)],
      type: SkillType.MENTAL,
    },
    {
      id: 'npc_mental_7',
      name: '败北耳语',
      description: '在耳边用极度温柔的口吻诱导放弃',
      formula: damage(DamageSource.CHARM, 6),
      accuracy: 88,
      critModifier: 10,
      hitCount: 1,
      staminaCost: 20,
      cooldown: 3,
      rarity: 'A',
      buffs: [defDown(10, 2)],
      type: SkillType.MENTAL,
    },
    {
      id: 'npc_mental_8',
      name: '奴隶印记刻印',
      description: '从精神上彻底洗脑并烙下屈服烙印',
      formula: damage(DamageSource.CHARM, 4.5),
      accuracy: 85,
      critModifier: 0,
      hitCount: 1,
      staminaCost: 25,
      cooldown: 5,
      rarity: 'S',
      buffs: [bind(1), atkDown(20, 3)],
      type: SkillType.MENTAL,
    },
  ],
};

export const NPC_SKILLS: Record<string, SkillData> = Object.fromEntries(
  Object.values(NPC_SKILL_SPECS)
    .flat()
    .map(spec => [spec.id, createNpcSkill(spec)]),
);

const NPC_SKILL_ID_SET = new Set(Object.keys(NPC_SKILLS));

/** 仅允许非角色库 NPC 使用本模块定义的专业技能。 */
export function filterNpcSkillIds(skillIds: unknown, allSkills: Record<string, SkillData> = NPC_SKILLS): string[] {
  const availableIds = new Set(Object.keys(allSkills).filter(id => NPC_SKILL_ID_SET.has(id)));
  if (!Array.isArray(skillIds)) return [];
  return [...new Set(skillIds.filter((id): id is string => typeof id === 'string' && availableIds.has(id)))];
}

export const NPC_SKILL_POOLS: Record<SkillFamily, string[]> = Object.fromEntries(
  (Object.keys(NPC_SKILL_SPECS) as SkillFamily[]).map(family => [family, NPC_SKILL_SPECS[family].map(spec => spec.id)]),
) as Record<SkillFamily, string[]>;

/** 只保留属于指定技能系的 NPC 技能，避免旧档技能污染当前技能池。 */
export function filterNpcSkillIdsByFamilies(
  skillIds: unknown,
  families: readonly SkillFamily[],
  allSkills: Record<string, SkillData> = NPC_SKILLS,
): string[] {
  const allowedIds = new Set(families.flatMap(family => NPC_SKILL_POOLS[family] ?? []));
  return filterNpcSkillIds(skillIds, allSkills).filter(id => allowedIds.has(id));
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function weightedPick<T extends { rarity?: string }>(pool: T[], random: () => number): T | null {
  const eligible = pool.filter(
    item => item.rarity === 'C' || item.rarity === 'B' || item.rarity === 'A' || item.rarity === 'S',
  );
  if (eligible.length === 0) return null;
  const total = eligible.reduce(
    (sum, item) =>
      sum + (NPC_PROFESSIONAL_RARITY_WEIGHTS[item.rarity as keyof typeof NPC_PROFESSIONAL_RARITY_WEIGHTS] || 0),
    0,
  );
  let cursor = random() * total;
  for (const item of eligible) {
    cursor -= NPC_PROFESSIONAL_RARITY_WEIGHTS[item.rarity as keyof typeof NPC_PROFESSIONAL_RARITY_WEIGHTS] || 0;
    if (cursor <= 0) return item;
  }
  return eligible[eligible.length - 1];
}

export function assignSkillFamily(enemyId: string, allowedFamilies?: readonly SkillFamily[]): SkillFamily {
  const random = seededRandom(`family:${enemyId}`);
  const filteredFamilies = allowedFamilies?.filter(family => NPC_SKILL_POOLS[family]?.length);
  const families = filteredFamilies && filteredFamilies.length > 0 ? filteredFamilies : NPC_SKILL_FAMILY_ORDER;
  return families[Math.floor(random() * families.length)] ?? 'hand';
}

export function drawNpcProfessionalSkillIds(
  allSkills: Record<string, SkillData> = NPC_SKILLS,
  seedKey: string,
  family: SkillFamily = assignSkillFamily(seedKey),
): string[] {
  const pool = NPC_SKILL_POOLS[family]
    .map(id => allSkills[id] ?? NPC_SKILLS[id])
    .filter((skill): skill is SkillData => Boolean(skill));
  const random = seededRandom(seedKey);
  const selected: SkillData[] = [];
  for (let index = 0; index < 4; index += 1) {
    const candidates = pool.filter(skill => !selected.some(item => item.id === skill.id));
    const picked = weightedPick(candidates, random);
    if (picked) selected.push(picked);
  }
  return selected.map(skill => skill.id);
}

export function buildNpcSkillIds(
  allSkills: Record<string, SkillData>,
  seedKey: string,
  allowedFamilies?: readonly SkillFamily[],
): string[] {
  return drawNpcProfessionalSkillIds(allSkills, seedKey, assignSkillFamily(seedKey, allowedFamilies));
}
