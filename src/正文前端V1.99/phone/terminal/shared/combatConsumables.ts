export type CombatConsumableEffect = {
  效果类型: string;
  效果值: number;
  是否为百分比: boolean;
  持续回合数: number;
  是否作用敌人: boolean;
};

export type CombatConsumableEffectList = Record<string, CombatConsumableEffect>;

interface CombatConsumableDefinition {
  name: string;
  effects: CombatConsumableEffectList;
}

export const COMBAT_CONSUMABLE_EFFECTS_BY_ID: Record<string, CombatConsumableDefinition> = {
  con_d_1: {
    name: '强力春药',
    effects: {
      效果1_敏感: { 效果类型: '敏感', 效果值: 35, 是否为百分比: true, 持续回合数: 3, 是否作用敌人: true },
      效果2_持续快感: {
        效果类型: '持续快感',
        效果值: 12,
        是否为百分比: false,
        持续回合数: 3,
        是否作用敌人: true,
      },
    },
  },
  con_d_2: {
    name: '虚弱药剂',
    effects: {
      效果1_性斗力: {
        效果类型: '性斗力',
        效果值: -20,
        是否为百分比: true,
        持续回合数: 2,
        是否作用敌人: true,
      },
    },
  },
  con_d_3: {
    name: '强力虚弱药剂',
    effects: {
      效果1_性斗力: {
        效果类型: '性斗力',
        效果值: -35,
        是否为百分比: true,
        持续回合数: 3,
        是否作用敌人: true,
      },
      效果2_暴击率: {
        效果类型: '暴击率',
        效果值: -15,
        是否为百分比: false,
        持续回合数: 3,
        是否作用敌人: true,
      },
    },
  },
  con_d_4: {
    name: '虚脱浓缩液',
    effects: {
      效果1_耐力变化: {
        效果类型: '耐力变化',
        效果值: -20,
        是否为百分比: false,
        持续回合数: 0,
        是否作用敌人: true,
      },
      效果2_忍耐力: {
        效果类型: '忍耐力',
        效果值: -30,
        是否为百分比: true,
        持续回合数: 3,
        是否作用敌人: true,
      },
    },
  },
  con_d_5: {
    name: '麻痹药水',
    effects: {
      效果1_束缚: { 效果类型: '束缚', 效果值: 0, 是否为百分比: false, 持续回合数: 1, 是否作用敌人: true },
      效果2_闪避率: {
        效果类型: '闪避率',
        效果值: -20,
        是否为百分比: false,
        持续回合数: 2,
        是否作用敌人: true,
      },
    },
  },
  con_d_6: {
    name: '出糗粉末',
    effects: {
      效果1_乏力: { 效果类型: '乏力', 效果值: 35, 是否为百分比: true, 持续回合数: 2, 是否作用敌人: true },
      效果2_幸运: {
        效果类型: '幸运',
        效果值: -15,
        是否为百分比: false,
        持续回合数: 2,
        是否作用敌人: true,
      },
    },
  },
  con_d_7: {
    name: '迟钝迷雾',
    effects: {
      效果1_迷离: { 效果类型: '迷离', 效果值: 35, 是否为百分比: true, 持续回合数: 2, 是否作用敌人: true },
      效果2_闪避率: {
        效果类型: '闪避率',
        效果值: -15,
        是否为百分比: false,
        持续回合数: 2,
        是否作用敌人: true,
      },
    },
  },
  con_d_8: {
    name: '狂乱春药',
    effects: {
      效果1_敏感: { 效果类型: '敏感', 效果值: 50, 是否为百分比: true, 持续回合数: 2, 是否作用敌人: true },
      效果2_迷离: { 效果类型: '迷离', 效果值: 25, 是否为百分比: true, 持续回合数: 2, 是否作用敌人: true },
    },
  },
  con_d_9: {
    name: '狼狈香水',
    effects: {
      效果1_魅力: {
        效果类型: '魅力',
        效果值: -30,
        是否为百分比: false,
        持续回合数: 2,
        是否作用敌人: true,
      },
      效果2_幸运: {
        效果类型: '幸运',
        效果值: -20,
        是否为百分比: false,
        持续回合数: 2,
        是否作用敌人: true,
      },
      效果3_敏感: { 效果类型: '敏感', 效果值: 20, 是否为百分比: true, 持续回合数: 2, 是否作用敌人: true },
    },
  },
  con_d_10: {
    name: '恍惚药丸',
    effects: {
      效果1_乏力: { 效果类型: '乏力', 效果值: 45, 是否为百分比: true, 持续回合数: 1, 是否作用敌人: true },
      效果2_暴击率: {
        效果类型: '暴击率',
        效果值: -25,
        是否为百分比: false,
        持续回合数: 2,
        是否作用敌人: true,
      },
    },
  },
  con_d_11: {
    name: '束缚胶囊',
    effects: {
      效果1_束缚: { 效果类型: '束缚', 效果值: 0, 是否为百分比: false, 持续回合数: 2, 是否作用敌人: true },
    },
  },
  con_d_12: {
    name: '破防滴剂',
    effects: {
      效果1_忍耐力: {
        效果类型: '忍耐力',
        效果值: -25,
        是否为百分比: true,
        持续回合数: 2,
        是否作用敌人: true,
      },
    },
  },
  con_d_13: {
    name: '失衡喷雾',
    effects: {
      效果1_闪避率: {
        效果类型: '闪避率',
        效果值: -35,
        是否为百分比: false,
        持续回合数: 2,
        是否作用敌人: true,
      },
    },
  },
  con_d_14: {
    name: '漏电贴片',
    effects: {
      效果1_持续快感: {
        效果类型: '持续快感',
        效果值: 8,
        是否为百分比: false,
        持续回合数: 4,
        是否作用敌人: true,
      },
      效果2_暴击率: {
        效果类型: '暴击率',
        效果值: -10,
        是否为百分比: false,
        持续回合数: 3,
        是否作用敌人: true,
      },
    },
  },
  con_d_15: {
    name: '反应迟缓剂',
    effects: {
      效果1_乏力: { 效果类型: '乏力', 效果值: 20, 是否为百分比: true, 持续回合数: 3, 是否作用敌人: true },
      效果2_迷离: { 效果类型: '迷离', 效果值: 20, 是否为百分比: true, 持续回合数: 3, 是否作用敌人: true },
    },
  },
};

const COMBAT_CONSUMABLE_EFFECTS_BY_NAME = Object.fromEntries(
  Object.values(COMBAT_CONSUMABLE_EFFECTS_BY_ID).map(definition => [definition.name, definition.effects]),
) as Record<string, CombatConsumableEffectList>;

export function getCombatConsumableEffects(itemIdOrName: string): CombatConsumableEffectList | undefined {
  return COMBAT_CONSUMABLE_EFFECTS_BY_ID[itemIdOrName]?.effects ?? COMBAT_CONSUMABLE_EFFECTS_BY_NAME[itemIdOrName];
}
