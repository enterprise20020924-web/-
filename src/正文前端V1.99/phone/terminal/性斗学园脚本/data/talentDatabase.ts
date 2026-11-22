// 天赋库 - 定义所有天赋及其效果
// 天赋没有等级，每个天赋有微弱的属性加成和独特的战斗效果
// 属性加成权重：性斗力/忍耐力成算=2，最大耐力/快感=0.2，其他=1
// 所有属性加成总和（按权重计算）不超过20

export interface TalentBonus {
  魅力加成?: number;
  幸运加成?: number;
  基础性斗力加成?: number;
  基础性斗力成算?: number;
  基础忍耐力加成?: number;
  基础忍耐力成算?: number;
  闪避率加成?: number;
  暴击率加成?: number;
}

export type TalentEffectType =
  | 'pleasure_control' // 快感控制类
  | 'stamina_control' // 耐力控制类
  | 'damage_boost' // 伤害增强类
  | 'defense_boost' // 防御增强类
  | 'first_strike' // 先手类
  | 'counter' // 反击类
  | 'recovery' // 恢复类
  | 'special' // 特殊类
  | 'daily' // 日常类（非战斗效果）
  | 'sin'; // 七宗罪类（特殊机制）

export interface TalentEffect {
  type: TalentEffectType;
  trigger: string; // 触发条件描述
  effect: string; // 效果描述
  // 效果参数（根据不同效果类型使用不同参数）
  params: {
    threshold?: number; // 阈值（百分比，如50表示50%）
    value?: number; // 效果值
    duration?: number; // 持续回合
    count?: number; // 次数限制
    chance?: number; // 触发概率（百分比）
    multiplier?: number; // 倍率
    maxValue?: number; // 最大值限制
  };
}

export interface TalentData {
  id: string;
  name: string;
  description: string; // 完整描述（包含属性和效果）
  rarity: 'C' | 'B' | 'A' | 'S' | 'SS' | 'SIN';
  bonus: TalentBonus; // 属性加成
  effects: TalentEffect[]; // 战斗效果列表
}

// 七宗罪天赋效果类型
export type SinTalentType = 'lust' | 'wrath' | 'envy' | 'sloth' | 'pride' | 'gluttony' | 'greed';

// 天赋库
export const TALENT_DATABASE: TalentData[] = [
  // ==================== 快感控制类 ====================
  {
    id: 'talent_pleasure_suppress',
    name: '快感压抑',
    description: '基础忍耐力成算+3。当自身快感超过50%最大快感时，每回合开始固定减少5点快感。',
    rarity: 'B',
    bonus: { 基础忍耐力成算: 3 },
    effects: [
      {
        type: 'pleasure_control',
        trigger: 'turn_start',
        effect: 'reduce_pleasure_when_high',
        params: { threshold: 50, value: 5 },
      },
    ],
  },
  {
    id: 'talent_pleasure_cap',
    name: '快感缓冲',
    description: '基础忍耐力+5。单次受到的快感伤害不超过自身最大快感的30%。',
    rarity: 'A',
    bonus: { 基础忍耐力加成: 5 },
    effects: [
      {
        type: 'pleasure_control',
        trigger: 'on_damage_receive',
        effect: 'cap_pleasure_damage',
        params: { threshold: 30 },
      },
    ],
  },
  {
    id: 'talent_pleasure_balance',
    name: '快感平衡',
    description: '基础忍耐力成算+2，基础性斗力成算+2。每回合开始时，快感向50%最大快感调整15点。',
    rarity: 'A',
    bonus: { 基础忍耐力成算: 2, 基础性斗力成算: 2 },
    effects: [
      {
        type: 'pleasure_control',
        trigger: 'turn_start',
        effect: 'balance_pleasure',
        params: { threshold: 50, value: 15 },
      },
    ],
  },
  {
    id: 'talent_pleasure_low_boost',
    name: '冷静之心',
    description: '基础忍耐力+3。当快感低于35%最大快感时，每回合开始固定减少10点快感。',
    rarity: 'A',
    bonus: { 基础忍耐力加成: 3 },
    effects: [
      {
        type: 'pleasure_control',
        trigger: 'turn_start',
        effect: 'reduce_pleasure_when_low',
        params: { threshold: 35, value: 10 },
      },
    ],
  },
  {
    id: 'talent_pleasure_immunity',
    name: '快感免疫',
    description: '基础忍耐力成算+5。每轮前2次受到的快感伤害减少50%。',
    rarity: 'B',
    bonus: { 基础忍耐力成算: 5 },
    effects: [
      {
        type: 'defense_boost',
        trigger: 'on_damage_receive',
        effect: 'reduce_first_n_damage',
        params: { count: 2, value: 50 },
      },
    ],
  },
  {
    id: 'talent_pleasure_immunity_variant_1',
    name: '快感免疫·缓释',
    description: '基础忍耐力成算+10。每轮前3次受到的快感伤害减少30%。',
    rarity: 'A',
    bonus: { 基础忍耐力成算: 10 },
    effects: [
      {
        type: 'defense_boost',
        trigger: 'on_damage_receive',
        effect: 'reduce_first_n_damage',
        params: { count: 3, value: 30 },
      },
    ],
  },
  {
    id: 'talent_pleasure_immunity_variant_2',
    name: '快感免疫·强抑',
    description: '基础忍耐力成算+10。每轮第1次受到的快感伤害减少90%。',
    rarity: 'B',
    bonus: { 基础忍耐力成算: 10 },
    effects: [
      {
        type: 'defense_boost',
        trigger: 'on_damage_receive',
        effect: 'reduce_first_n_damage',
        params: { count: 1, value: 90 },
      },
    ],
  },

  // ==================== 耐力控制类 ====================
  {
    id: 'talent_stamina_burst',
    name: '耐力爆发',
    description: '基础性斗力成算+3。当耐力低于30%时，造成的伤害提升20%。',
    rarity: 'B',
    bonus: { 基础性斗力成算: 3 },
    effects: [
      {
        type: 'damage_boost',
        trigger: 'passive',
        effect: 'damage_boost_when_low_stamina',
        params: { threshold: 30, value: 20 },
      },
    ],
  },
  {
    id: 'talent_stamina_burst_variant_1',
    name: '耐力爆发·持久',
    description: '基础性斗力成算+3。当耐力低于60%时，造成的伤害提升10%。',
    rarity: 'B',
    bonus: { 基础性斗力成算: 3 },
    effects: [
      {
        type: 'damage_boost',
        trigger: 'passive',
        effect: 'damage_boost_when_low_stamina',
        params: { threshold: 60, value: 10 },
      },
    ],
  },
  {
    id: 'talent_stamina_burst_variant_2',
    name: '耐力爆发·孤注',
    description: '基础性斗力成算+2。当耐力低于20%时，造成的伤害提升30%。',
    rarity: 'A',
    bonus: { 基础性斗力成算: 2 },
    effects: [
      {
        type: 'damage_boost',
        trigger: 'passive',
        effect: 'damage_boost_when_low_stamina',
        params: { threshold: 20, value: 30 },
      },
    ],
  },
  {
    id: 'talent_stamina_stable',
    name: '耐力稳定',
    description: '基础性斗力+5。耐力不会因单次效果变化超过30点。',
    rarity: 'A',
    bonus: { 基础性斗力加成: 5 },
    effects: [
      {
        type: 'stamina_control',
        trigger: 'on_stamina_change',
        effect: 'cap_stamina_change',
        params: { maxValue: 30 },
      },
    ],
  },

  // ==================== 先手类 ====================
  {
    id: 'talent_first_double',
    name: '先发制人',
    description: '暴击率+3。前2次攻击伤害翻倍。',
    rarity: 'S',
    bonus: { 暴击率加成: 3 },
    effects: [
      {
        type: 'first_strike',
        trigger: 'on_attack',
        effect: 'double_first_n_attacks',
        params: { count: 2, multiplier: 2 },
      },
    ],
  },
  {
    id: 'talent_first_double_variant_1',
    name: '先发制人·一击必杀',
    description: '暴击率+1。首次攻击伤害提升至3倍。',
    rarity: 'SS',
    bonus: { 暴击率加成: 1 },
    effects: [
      {
        type: 'first_strike',
        trigger: 'on_attack',
        effect: 'double_first_n_attacks',
        params: { count: 1, multiplier: 3 },
      },
    ],
  },
  {
    id: 'talent_first_hit',
    name: '精准打击',
    description: '暴击率+5，闪避率+3。前2次攻击必定命中。',
    rarity: 'S',
    bonus: { 暴击率加成: 5, 闪避率加成: 3 },
    effects: [
      {
        type: 'first_strike',
        trigger: 'on_attack',
        effect: 'guaranteed_hit_first_n',
        params: { count: 2 },
      },
    ],
  },
  {
    id: 'talent_first_hit_variant_1',
    name: '精准打击·稳健',
    description: '暴击率+1。前3次攻击必定命中。',
    rarity: 'SS',
    bonus: { 暴击率加成: 1 },
    effects: [
      {
        type: 'first_strike',
        trigger: 'on_attack',
        effect: 'guaranteed_hit_first_n',
        params: { count: 3 },
      },
    ],
  },
  {
    id: 'talent_first_bind',
    name: '束缚先手',
    description: '魅力+4，基础性斗力+2。前2次攻击如果没有束缚属性则附带1回合的束缚效果。',
    rarity: 'SS',
    bonus: { 魅力加成: 4, 基础性斗力加成: 2 },
    effects: [
      {
        type: 'first_strike',
        trigger: 'on_attack',
        effect: 'add_bind_first_n',
        params: { count: 2, duration: 1 },
      },
    ],
  },
  {
    id: 'talent_first_bind_variant_1',
    name: '束缚先手·强缚',
    description: '魅力+2，基础性斗力+2。前1次攻击如果没有束缚属性则附带2回合的束缚效果。',
    rarity: 'SS',
    bonus: { 魅力加成: 2, 基础性斗力加成: 2 },
    effects: [
      {
        type: 'first_strike',
        trigger: 'on_attack',
        effect: 'add_bind_first_n',
        params: { count: 1, duration: 2 },
      },
    ],
  },
  {
    id: 'talent_bind_immunity',
    name: '束缚免疫',
    description: '闪避率+5，基础忍耐力+3。免疫敌人的前2次束缚效果。',
    rarity: 'S',
    bonus: { 闪避率加成: 5, 基础忍耐力加成: 3 },
    effects: [
      {
        type: 'defense_boost',
        trigger: 'on_debuff_receive',
        effect: 'immune_first_n_binds',
        params: { count: 2 },
      },
    ],
  },
  {
    id: 'talent_bind_immunity_variant_1',
    name: '束缚免疫·耐受',
    description: '闪避率+8，基础忍耐力+5。免疫敌人的前1次束缚效果。',
    rarity: 'A',
    bonus: { 闪避率加成: 8, 基础忍耐力加成: 5 },
    effects: [
      {
        type: 'defense_boost',
        trigger: 'on_debuff_receive',
        effect: 'immune_first_n_binds',
        params: { count: 1 },
      },
    ],
  },

  // ==================== 战斗开始类 ====================
  {
    id: 'talent_battle_reset',
    name: '战斗重置',
    description: '基础性斗力成算+3，基础忍耐力成算+3。每次性斗开始时，回满自身耐力并清空自身快感。',
    rarity: 'S',
    bonus: { 基础性斗力成算: 3, 基础忍耐力成算: 3 },
    effects: [
      {
        type: 'special',
        trigger: 'battle_start',
        effect: 'reset_stats_on_battle_start',
        params: {},
      },
    ],
  },
  {
    id: 'talent_battle_shield',
    name: '战斗护盾',
    description: '基础忍耐力+5。战斗开始时获得护盾，前3回合受到的快感伤害减少15点。',
    rarity: 'A',
    bonus: { 基础忍耐力加成: 5 },
    effects: [
      {
        type: 'defense_boost',
        trigger: 'battle_start',
        effect: 'shield_first_n_turns',
        params: { duration: 3, value: 15 },
      },
    ],
  },
  {
    id: 'talent_battle_shield_variant_1',
    name: '战斗护盾·短效',
    description: '基础忍耐力+10。战斗开始时获得护盾，前2回合受到的快感伤害减少18点。',
    rarity: 'A',
    bonus: { 基础忍耐力加成: 10 },
    effects: [
      {
        type: 'defense_boost',
        trigger: 'battle_start',
        effect: 'shield_first_n_turns',
        params: { duration: 2, value: 18 },
      },
    ],
  },

  // ==================== 伤害增强类 ====================
  {
    id: 'talent_crit_master',
    name: '暴击大师',
    description: '暴击率+8。暴击伤害额外增加25%。',
    rarity: 'A',
    bonus: { 暴击率加成: 8 },
    effects: [
      {
        type: 'damage_boost',
        trigger: 'on_crit',
        effect: 'boost_crit_damage',
        params: { value: 25 },
      },
    ],
  },

  // ==================== 防御增强类 ====================

  // ==================== 恢复类 ====================
  {
    id: 'talent_regeneration',
    name: '自然恢复',
    description: '基础忍耐力+4。每回合结束时回复6点耐力。',
    rarity: 'C',
    bonus: { 基础忍耐力加成: 4 },
    effects: [
      {
        type: 'recovery',
        trigger: 'turn_end',
        effect: 'recover_stamina_per_turn',
        params: { value: 6 },
      },
    ],
  },
  {
    id: 'talent_regeneration_variant_1',
    name: '自然恢复·顽强',
    description: '基础忍耐力+12。每回合结束时回复3点耐力。',
    rarity: 'C',
    bonus: { 基础忍耐力加成: 12 },
    effects: [
      {
        type: 'recovery',
        trigger: 'turn_end',
        effect: 'recover_stamina_per_turn',
        params: { value: 3 },
      },
    ],
  },
  {
    id: 'talent_pleasure_heal',
    name: '快感净化',
    description: '基础忍耐力成算+3。每回合结束时减少3点快感。',
    rarity: 'B',
    bonus: { 基础忍耐力成算: 3 },
    effects: [
      {
        type: 'recovery',
        trigger: 'turn_end',
        effect: 'reduce_pleasure_per_turn',
        params: { value: 3 },
      },
    ],
  },

  // ==================== 特殊类 ====================
  {
    id: 'talent_lucky_star',
    name: '幸运之星',
    description: '幸运+10。战斗中所有概率判定额外增加5%成功率。',
    rarity: 'B',
    bonus: { 幸运加成: 10 },
    effects: [
      {
        type: 'special',
        trigger: 'passive',
        effect: 'boost_all_chances',
        params: { value: 5 },
      },
    ],
  },
  {
    id: 'talent_focus',
    name: '专注',
    description: '暴击率+5，基础性斗力+2。技能命中率提升10%。',
    rarity: 'C',
    bonus: { 暴击率加成: 5, 基础性斗力加成: 2 },
    effects: [
      {
        type: 'damage_boost',
        trigger: 'passive',
        effect: 'boost_accuracy',
        params: { value: 10 },
      },
    ],
  },
  {
    id: 'talent_persistence',
    name: '坚持',
    description: '基础忍耐力成算+5。高潮时有30%概率不计入高潮次数。',
    rarity: 'SS',
    bonus: { 基础忍耐力成算: 5 },
    effects: [
      {
        type: 'special',
        trigger: 'on_climax',
        effect: 'chance_ignore_climax_count',
        params: { chance: 30 },
      },
    ],
  },
  {
    id: 'talent_pressure',
    name: '压迫感',
    description: '魅力+6，基础性斗力+2。敌人的闪避率降低15%。',
    rarity: 'B',
    bonus: { 魅力加成: 6, 基础性斗力加成: 2 },
    effects: [
      {
        type: 'damage_boost',
        trigger: 'passive',
        effect: 'reduce_enemy_dodge',
        params: { value: 15 },
      },
    ],
  },
  {
    id: 'talent_resilience',
    name: '坚忍',
    description: '基础忍耐力+4，基础忍耐力成算+2。每回合第一次受到的快感伤害减少15点。',
    rarity: 'SS',
    bonus: { 基础忍耐力加成: 4, 基础忍耐力成算: 2 },
    effects: [
      {
        type: 'defense_boost',
        trigger: 'on_damage_receive',
        effect: 'reduce_first_damage_per_turn',
        params: { value: 15 },
      },
    ],
  },
  {
    id: 'talent_resilience_variant_1',
    name: '坚忍·守势',
    description: '基础忍耐力+8，基础忍耐力成算+5。每回合第一次受到的快感伤害减少8点。',
    rarity: 'S',
    bonus: { 基础忍耐力加成: 8, 基础忍耐力成算: 5 },
    effects: [
      {
        type: 'defense_boost',
        trigger: 'on_damage_receive',
        effect: 'reduce_first_damage_per_turn',
        params: { value: 8 },
      },
    ],
  },

  // ==================== 日常类（非战斗效果） ====================
  {
    id: 'talent_daily_shop_discount',
    name: '商业头脑',
    description: '商店所有商品价格降低5%。',
    rarity: 'C',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'passive',
        effect: 'shop_discount_all',
        params: { value: 5 },
      },
    ],
  },
  {
    id: 'talent_daily_shop_recovery_discount',
    name: '草药达人',
    description: '商店回复类用品价格降低20%。',
    rarity: 'B',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'passive',
        effect: 'shop_discount_recovery',
        params: { value: 20 },
      },
    ],
  },
  {
    id: 'talent_daily_shop_equipment_discount',
    name: '装备鉴赏家',
    description: '商店装备价格降低10%。',
    rarity: 'B',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'passive',
        effect: 'shop_discount_equipment',
        params: { value: 10 },
      },
    ],
  },
  {
    id: 'talent_daily_shop_permanent_discount',
    name: '潜力挖掘者',
    description: '商店永久提升用品价格降低10%。',
    rarity: 'B',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'passive',
        effect: 'shop_discount_permanent',
        params: { value: 10 },
      },
    ],
  },
  {
    id: 'talent_daily_gacha_discount',
    name: '抽卡达人',
    description: '技能十连抽价格降低2技能点（18→16）。',
    rarity: 'A',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'passive',
        effect: 'gacha_discount',
        params: { value: 2 },
      },
    ],
  },
  {
    id: 'talent_daily_levelup_skill_point',
    name: '快速学习',
    description: '升级时额外获得+1技能点。',
    rarity: 'A',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'on_levelup',
        effect: 'extra_skill_point',
        params: { value: 1 },
      },
    ],
  },
  {
    id: 'talent_daily_levelup_stat_point',
    name: '天赋异秉',
    description: '升级时额外获得+1属性点。',
    rarity: 'A',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'on_levelup',
        effect: 'extra_stat_point',
        params: { value: 1 },
      },
    ],
  },
  {
    id: 'talent_daily_exp_reduce',
    name: '经验丰富',
    description: '获得的经验增加25%，由脚本自动结算；各等级累计经验门槛不变。',
    rarity: 'S',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'passive',
        effect: 'exp_gain',
        params: { value: 25 },
      },
    ],
  },
  {
    id: 'talent_daily_dialogue_stamina_double',
    name: '休息达人',
    description: '每次对话回复的体力翻倍。',
    rarity: 'C',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'on_dialogue',
        effect: 'stamina_recovery_double',
        params: { multiplier: 2 },
      },
    ],
  },
  {
    id: 'talent_daily_dialogue_pleasure_double',
    name: '心理调适',
    description: '每次对话降低的快感翻倍。',
    rarity: 'C',
    bonus: {},
    effects: [
      {
        type: 'daily',
        trigger: 'on_dialogue',
        effect: 'pleasure_reduce_double',
        params: { multiplier: 2 },
      },
    ],
  },

  // ==================== 七宗罪天赋 ====================
  {
    id: 'talent_sin_lust',
    name: '色欲',
    description:
      '【七宗罪·色欲】魅力+125。每回合攻击被动附带魅惑属性（概率=35%+(自身魅力-对方魅力)/10），魅惑成功则束缚敌人1回合。但魅惑成功会降低自身12%忍耐力成算（可叠加），连续魅惑失败两次则对方下次攻击必定命中且暴击。',
    rarity: 'SIN',
    bonus: { 魅力加成: 125 },
    effects: [
      {
        type: 'sin',
        trigger: 'sin_lust',
        effect: 'sin_lust_charm',
        params: { value: 10 },
      },
    ],
  },
  {
    id: 'talent_sin_wrath',
    name: '暴怒',
    description:
      '【七宗罪·暴怒】所有攻击连击+1，暴击率+999%。但闪避率-999%，基础忍耐力成算-50%，无法使用道具和投降，若本回合没有造成伤害则自身快感+20%最大快感。',
    rarity: 'SIN',
    bonus: { 暴击率加成: 999, 闪避率加成: -999, 基础忍耐力成算: -50 },
    effects: [
      {
        type: 'sin',
        trigger: 'sin_wrath',
        effect: 'sin_wrath_rage',
        params: { value: 20 },
      },
    ],
  },
  {
    id: 'talent_sin_envy',
    name: '嫉妒',
    description:
      '【七宗罪·嫉妒】战斗开始时从对手属性中随机选取3项进行比较：若对手属性高于自身，则自身该属性+80%对手值；若对手属性低于或等于自身，则自身该属性-130%对手值。',
    rarity: 'SIN',
    bonus: {},
    effects: [
      {
        type: 'sin',
        trigger: 'sin_envy',
        effect: 'sin_envy_compare',
        params: { value: 80, count: 3 },
      },
    ],
  },
  {
    id: 'talent_sin_sloth',
    name: '懒惰',
    description:
      '【七宗罪·懒惰】每跳过回合获得1层"怠惰积蓄"（最多3层），每层提供性斗力/忍耐力成算+10%、闪避率+5%。使用技能时消耗所有积蓄：1层必定暴击，2层必定命中，3层连击+2。但前3回合无法攻击，使用技能后2回合性斗力成算-20%、闪避率-15%，被暴击时若有3层积蓄则全部清空并被束缚1回合。',
    rarity: 'SIN',
    bonus: {},
    effects: [
      {
        type: 'sin',
        trigger: 'sin_sloth',
        effect: 'sin_sloth_accumulate',
        params: { maxValue: 3, duration: 3 },
      },
    ],
  },
  {
    id: 'talent_sin_pride',
    name: '傲慢',
    description:
      '【七宗罪·傲慢】性斗力/忍耐力成算+20%。当自身属性高于对手时额外+20%效果，连续2回合暴击后下回合攻击必中且连击+2。但无法使用消耗品与投降，当对手属性高于自身时该属性-20%，被暴击时进入"动摇"状态（2回合暴击率/闪避率-30%）。',
    rarity: 'SIN',
    bonus: { 基础性斗力成算: 20, 基础忍耐力成算: 20 },
    effects: [
      {
        type: 'sin',
        trigger: 'sin_pride',
        effect: 'sin_pride_arrogance',
        params: { value: 20, duration: 2 },
      },
    ],
  },
  {
    id: 'talent_sin_gluttony',
    name: '暴食',
    description:
      '【七宗罪·暴食】每次造成伤害时减少自身20%最大快感的快感。每次受到伤害获得1层「饕饉」（最多5层），每层提供性斗力/忍耐力成算+10、暴击率+5%。但每回合未造成伤害（包括被闪避）则快感+20%最大快感，5层饕饉时下回合束缚且清空层数，战斗中无法使用背包。',
    rarity: 'SIN',
    bonus: {},
    effects: [
      {
        type: 'sin',
        trigger: 'sin_gluttony',
        effect: 'sin_gluttony_devour',
        params: { value: 10, maxValue: 5 },
      },
    ],
  },
  {
    id: 'talent_sin_greed',
    name: '贪婪',
    description:
      '【七宗罪·贪婪】每回合开始消耗10%当前耐力获得1层「贪婪」（最多5层），每层提供暴击率+10%、魅力+30、幸运+30、性斗力成算+15%。3层以上时暴击伤害从150%提升至300%。但每层闪避率-10%，被束缚时持续时间+2回合，跳过回合失去2层并增加层数×5%最大快感的快感，战斗中无法使用背包和投降。',
    rarity: 'SIN',
    bonus: {},
    effects: [
      {
        type: 'sin',
        trigger: 'sin_greed',
        effect: 'sin_greed_accumulate',
        params: { value: 10, maxValue: 5 },
      },
    ],
  },
];

// 基础抽取概率（不含SIN）
export const TALENT_GACHA_RATES: Record<TalentData['rarity'], number> = {
  C: 30,
  B: 35,
  A: 25,
  S: 7.5,
  SS: 2.5,
  SIN: 0, // SIN概率动态计算，基础为0
};

/**
 * 计算七宗罪天赋的抽取概率
 * 概率 = 20% * (堕落度/100)^2
 * @param corruptionLevel 堕落度 (0-100)
 */
export function calculateSinProbability(corruptionLevel: number): number {
  const normalizedCorruption = Math.max(0, Math.min(100, corruptionLevel)) / 100;
  return 20 * Math.pow(normalizedCorruption, 2);
}

/**
 * 根据堕落度获取调整后的抽取概率
 * SIN概率会平均占用C/B/A的概率
 * @param corruptionLevel 堕落度 (0-100)
 */
export function getAdjustedGachaRates(corruptionLevel: number): Record<TalentData['rarity'], number> {
  const sinProb = calculateSinProbability(corruptionLevel);
  const deductPerRarity = sinProb / 3; // 从C/B/A各扣除1/3

  return {
    C: Math.max(0, TALENT_GACHA_RATES.C - deductPerRarity),
    B: Math.max(0, TALENT_GACHA_RATES.B - deductPerRarity),
    A: Math.max(0, TALENT_GACHA_RATES.A - deductPerRarity),
    S: TALENT_GACHA_RATES.S,
    SS: TALENT_GACHA_RATES.SS,
    SIN: sinProb,
  };
}

/**
 * 根据堕落度抽取天赋稀有度
 * @param corruptionLevel 堕落度 (0-100)
 */
function rollTalentRarity(corruptionLevel: number = 0): TalentData['rarity'] {
  const rates = getAdjustedGachaRates(corruptionLevel);
  const roll = Math.random() * 100;
  let cumulative = 0;

  // 按照 SIN -> SS -> S -> A -> B -> C 的顺序判定（优先判定稀有度高的）
  const order: TalentData['rarity'][] = ['SIN', 'SS', 'S', 'A', 'B', 'C'];
  for (const rarity of order) {
    cumulative += rates[rarity];
    if (roll < cumulative) {
      return rarity;
    }
  }

  return 'C';
}

/**
 * 执行天赋抽取
 * @param corruptionLevel 堕落度 (0-100)，影响七宗罪天赋的抽取概率
 */
export function performTalentGacha(corruptionLevel: number = 0): TalentData {
  const rarity = rollTalentRarity(corruptionLevel);
  const pool = TALENT_DATABASE.filter(t => t.rarity === rarity);
  const finalPool = pool.length > 0 ? pool : TALENT_DATABASE.filter(t => t.rarity !== 'SIN');
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

// 根据ID获取天赋数据
export function getTalentById(id: string): TalentData | undefined {
  return TALENT_DATABASE.find(t => t.id === id);
}

// 根据名称获取天赋数据
export function getTalentByName(name: string): TalentData | undefined {
  return TALENT_DATABASE.find(t => t.name === name);
}

// 获取日常天赋效果值
export function getDailyTalentEffect(talentId: string | undefined, effectName: string): number {
  if (!talentId) return 0;
  const talent = getTalentById(talentId);
  if (!talent) return 0;

  for (const effect of talent.effects) {
    if (effect.type === 'daily' && effect.effect === effectName) {
      return effect.params.value || effect.params.multiplier || 0;
    }
  }
  return 0;
}

// 检查是否有指定的日常天赋效果
export function hasDailyTalentEffect(talentId: string | undefined, effectName: string): boolean {
  return getDailyTalentEffect(talentId, effectName) > 0;
}
