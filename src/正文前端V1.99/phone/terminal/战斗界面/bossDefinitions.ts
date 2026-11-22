import { getBossPhase } from './bossMechanicEngine';
import type { BossMechanicDefinition, BossPhaseDefinition, DeclarativeBossDefinition } from './bossMechanicEngine';

export type CurrentBossId =
  | 'muxinlan'
  | 'christine'
  | 'eden'
  | 'elizabeth'
  | 'vespera'
  | 'heisaki'
  | 'agnes'
  | 'yamadaHanako'
  | 'zhuangFangyi';
export type LegacyBossConfigId = Exclude<CurrentBossId, 'elizabeth' | 'agnes' | 'yamadaHanako' | 'zhuangFangyi'>;
export type CurrentBossSinType = 'sloth' | 'lust' | 'greed' | 'pride' | 'gluttony';

export interface CurrentBossPhaseDefinition extends BossPhaseDefinition {
  level: number;
  avatarUrl?: string;
}

export interface CurrentBossLegacyMeta {
  specialItem?: string;
  sinType?: CurrentBossSinType;
  gameOverSkillId?: string;
  selfSacrificeSkillId?: string;
  sleepingAvatarUrl?: string;
}

export interface CurrentBossDefinition extends Omit<DeclarativeBossDefinition, 'id' | 'category' | 'phases'> {
  id: CurrentBossId;
  category: 'main' | 'event';
  phases: CurrentBossPhaseDefinition[];
  legacy?: CurrentBossLegacyMeta;
}

const MUXINLAN_MECHANICS: BossMechanicDefinition[] = [
  {
    id: 'muxinlan-phase1-to-phase2',
    kind: 'phaseTransition',
    label: '第一阶段满快感转阶段',
    description: '第一阶段快感达到上限时进入第二阶段；荣誉勋章跳阶段仍由旧流程写入 honorMedalUsed 标记处理。',
    triggers: [{ type: 'pleasurePercentAtOrAbove', phase: 1, threshold: 100, blockedByFlag: 'honorMedalUsed' }],
    actions: [{ type: 'setPhase', phase: 2 }],
    once: true,
    reusable: true,
  },
  {
    id: 'muxinlan-medal-skip-to-phase3',
    kind: 'phaseTransition',
    label: '荣誉勋章跳过第二阶段',
    description: '使用专属勋章后，第一阶段满快感直接进入真身阶段。',
    triggers: [{ type: 'pleasurePercentAtOrAbove', phase: 1, threshold: 100, requiresFlag: 'honorMedalUsed' }],
    actions: [{ type: 'setPhase', phase: 3 }],
    once: true,
    reusable: true,
  },
  {
    id: 'muxinlan-phase2-to-phase3',
    kind: 'phaseTransition',
    label: '第二阶段高潮阈值转真身',
    description: '第二阶段达到阶段高潮阈值前一档，且快感再次满值时进入真身阶段。',
    triggers: [
      { type: 'pleasurePercentAtOrAbove', phase: 2, threshold: 100 },
      { type: 'climaxCountAtLeast', phase: 2, climaxCounterKey: 'boss', threshold: 2 },
    ],
    actions: [{ type: 'setPhase', phase: 3 }],
    match: 'all',
    once: true,
    reusable: true,
  },
];

const CHRISTINE_MECHANICS: BossMechanicDefinition[] = [
  {
    id: 'christine-phase1-to-phase2',
    kind: 'phaseTransition',
    label: '里人格觉醒',
    description: '第一阶段快感达到上限时切换为里人格阶段，并沿用旧流程禁用物品与投降。',
    triggers: [{ type: 'pleasurePercentAtOrAbove', phase: 1, threshold: 100 }],
    actions: [{ type: 'setPhase', phase: 2 }],
    once: true,
    reusable: true,
  },
];

const EDEN_MECHANICS: BossMechanicDefinition[] = [
  {
    id: 'eden-countdown-force-game-over',
    kind: 'turnLimit',
    label: '沉睡倒计时终结技',
    description: '倒计时归零后强制使用 Game Over 技能；束缚额外扣减倒计时仍由旧流程保留。',
    triggers: [{ type: 'turnAtLeast', turn: 6 }],
    actions: [{ type: 'forceSkill', skillId: '伊甸芙宁_16' }],
    reusable: true,
    notes: '旧逻辑使用可变 countdown，不是单纯按总回合数触发；接入前需要由适配层把 countdown 写入 counter。',
  },
  {
    id: 'eden-awaken-on-pleasure-cap',
    kind: 'phaseTransition',
    label: '沉睡中满快感唤醒',
    description: '沉睡状态下快感达到上限时唤醒，并把高潮上限提升到旧逻辑中的 3。',
    triggers: [
      { type: 'flagSet', flag: 'edenSleeping' },
      { type: 'pleasurePercentAtOrAbove', threshold: 100 },
    ],
    actions: [
      { type: 'setFlag', flag: 'edenSleeping', value: false },
      { type: 'setCounter', counterKey: 'maxClimaxCount', value: 3 },
    ],
    match: 'all',
    once: true,
  },
];

const ELIZABETH_MECHANICS: BossMechanicDefinition[] = [
  {
    id: 'elizabeth-command-script',
    kind: 'judgementChallenge',
    label: '君王剧本指令',
    description: '按旧逻辑在特定回合发布跪拜或献礼指令，玩家行动后结算服从、违抗与暴击反制。',
    triggers: [{ type: 'turnStart' }],
    actions: [{ type: 'setFlag', flag: 'elizabethCommandPending', value: true }],
    reusable: true,
    notes: '旧实现存在奇数回合、随机指令与行动类型判定；当前只声明机制入口，不替换旧结算。',
  },
];

const VESPERA_MECHANICS: BossMechanicDefinition[] = [
  {
    id: 'vespera-bound-hunter',
    kind: 'skillTagModifier',
    label: '束缚猎物',
    description: '玩家被束缚时，薇丝佩菈攻击必定命中且必定暴击。',
    triggers: [{ type: 'flagSet', flag: 'playerBound' }],
    actions: [
      { type: 'setFlag', flag: 'enemyGuaranteedHit', value: true },
      { type: 'setFlag', flag: 'enemyGuaranteedCrit', value: true },
    ],
    reusable: true,
  },
  {
    id: 'vespera-self-sacrifice',
    kind: 'forcedUltimate',
    label: '自体献祭',
    description: '达到旧逻辑指定高潮次数后，按玩家性别触发一次自体献祭特殊技能。',
    triggers: [
      { type: 'climaxCountAtLeast', climaxCounterKey: 'boss', threshold: 2, blockedByFlag: 'vesperaSelfSacrificeUsed' },
    ],
    actions: [
      { type: 'forceSkill', skillId: '薇丝佩菈_自体献祭' },
      { type: 'setFlag', flag: 'vesperaSelfSacrificeUsed', value: true },
    ],
    once: true,
  },
];

const HEISAKI_MECHANICS: BossMechanicDefinition[] = [
  {
    id: 'heisaki-debt-contract',
    kind: 'lossCounter',
    label: '贪婪债务契约',
    description: '耐力不足时允许透支并记录债务，债务每回合按旧逻辑增长并结算。',
    triggers: [{ type: 'flagSet', flag: 'playerOverdraft' }],
    actions: [{ type: 'addCounter', counterKey: 'heisakiDebt', amount: 1 }],
    reusable: true,
    notes: '旧逻辑需要记录具体透支数值与技能倍率，当前保留在专用函数中。',
  },
  {
    id: 'heisaki-high-rarity-interest',
    kind: 'skillTagModifier',
    label: '高阶技能利息翻倍',
    description: '玩家使用 A/S/SS 级技能后，该技能下次耐力消耗按旧逻辑翻倍。',
    triggers: [{ type: 'skillTagUsed', skillTags: ['A', 'S', 'SS'] }],
    actions: [{ type: 'setFlag', flag: 'heisakiSkillInterestPending', value: true }],
    reusable: true,
  },
];

const AGNES_MECHANICS: BossMechanicDefinition[] = [
  {
    id: 'agnes-calorie-meter',
    kind: 'assimilationProgress',
    label: '卡路里堆叠',
    description: '快感伤害按旧逻辑转化为卡路里，并为艾格妮丝提供成长加成。',
    triggers: [{ type: 'skillTagHit', skillTags: ['pleasureDamage'] }],
    actions: [{ type: 'addProgress', stateKey: 'agnesCalories', amount: 1 }],
    reusable: true,
    notes: '实际数值为快感伤害百分比换算，仍由旧专用函数计算。',
  },
  {
    id: 'agnes-gender-skill-pool',
    kind: 'genderVariant',
    label: '性别特化技能池',
    description: '根据玩家性别选择艾格妮丝默认或男性特化技能池。',
    triggers: [{ type: 'playerGenderIs', gender: '男' }],
    actions: [{ type: 'setSkillPool', skillPoolKey: '艾格妮丝_男' }],
  },
];

const YAMADA_HANAKO_MECHANICS: BossMechanicDefinition[] = [
  {
    id: 'yamada-hanako-pre-midterm-escape',
    kind: 'specialRule',
    label: '伪装败北后逃跑',
    description: '期中考试前的首次挑战使用低属性伪装形态；被战胜后山田花子逃跑，战斗按平局结算并记录挑战。',
    triggers: [{ type: 'battleStart', phase: 1 }],
    actions: [{ type: 'setFlag', flag: 'yamadaHanakoEscapeOnDefeat', value: true }],
    reusable: true,
  },
];

const ZHUANG_FANGYI_MECHANICS: BossMechanicDefinition[] = [
  {
    id: 'zhuang-fangyi-abyss-tide',
    kind: 'environmentAura',
    label: '深渊潮位',
    description: '每个敌方回合潮位上升；第三层触发龙渊倒灌，潮水回落。',
    triggers: [{ type: 'turnStart' }],
    actions: [{ type: 'addProgress', stateKey: 'abyssTide', amount: 1 }],
    reusable: true,
  },
  {
    id: 'zhuang-fangyi-throne-to-personal',
    kind: 'phaseTransition',
    label: '离座亲征',
    description: '玉座试探被突破后，庄方宜起身亲自迎战。',
    triggers: [{ type: 'climaxCountAtLeast', phase: 1, climaxCounterKey: 'boss', threshold: 1 }],
    actions: [{ type: 'setPhase', phase: 2 }],
    once: true,
    reusable: true,
  },
  {
    id: 'zhuang-fangyi-reverse-scale-release',
    kind: 'phaseTransition',
    label: '逆鳞解放',
    description: '亲征形态再被逼入绝境后，龙君解放完整龙威；逆鳞同时成为可被抓住的破局点。',
    triggers: [{ type: 'climaxCountAtLeast', phase: 2, climaxCounterKey: 'boss', threshold: 2 }],
    actions: [{ type: 'setPhase', phase: 3 }],
    once: true,
    reusable: true,
  },
];

export const CURRENT_BOSS_DEFINITIONS: CurrentBossDefinition[] = [
  {
    id: 'muxinlan',
    sourceEntry: '旧 Boss：沐芯兰',
    displayName: '沐芯兰',
    aliases: ['沐芯兰', '茉莉', 'muxinlan'],
    category: 'main',
    status: 'ready',
    phases: [
      {
        phase: 1,
        displayName: '茉莉(?)',
        dataKey: '沐芯兰_1',
        skillPoolKey: '沐芯兰_1',
        level: 50,
        climaxLimit: 1,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/沐芯兰_1.png',
      },
      {
        phase: 2,
        displayName: '꧁༺茉莉༻꧂',
        dataKey: '沐芯兰_2',
        skillPoolKey: '沐芯兰_2',
        level: 88,
        climaxLimit: 3,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/沐芯兰_2.png',
      },
      {
        phase: 3,
        displayName: '沐芯兰（真身）',
        dataKey: '沐芯兰_3',
        skillPoolKey: '沐芯兰_3',
        level: 11,
        climaxLimit: 1,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/沐芯兰_3.png',
      },
    ],
    mechanics: MUXINLAN_MECHANICS,
    legacy: {
      specialItem: '刻有沐芯兰名字的三好学生荣誉勋章',
    },
  },
  {
    id: 'christine',
    sourceEntry: '旧 Boss：克莉丝汀',
    displayName: '克莉丝汀',
    aliases: ['克莉丝汀', '书记', 'christine'],
    category: 'main',
    status: 'ready',
    phases: [
      {
        phase: 1,
        displayName: '克莉丝汀(?)',
        dataKey: '克莉丝汀_1',
        skillPoolKey: '克莉丝汀_1',
        level: 55,
        climaxLimit: 1,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/克莉丝汀_1.png',
      },
      {
        phase: 2,
        displayName: '꧁༺克莉丝汀༻꧂',
        dataKey: '克莉丝汀_2',
        skillPoolKey: '克莉丝汀_2',
        level: 88,
        climaxLimit: 3,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/克莉丝汀_2.png',
      },
    ],
    mechanics: CHRISTINE_MECHANICS,
  },
  {
    id: 'eden',
    sourceEntry: '旧 Boss：伊甸芙宁',
    displayName: '伊甸芙宁',
    aliases: ['伊甸芙宁', '芙宁', 'eden', 'funin'],
    category: 'main',
    status: 'ready',
    phases: [
      {
        phase: 1,
        displayName: '伊甸芙宁',
        dataKey: '伊甸芙宁',
        skillPoolKey: '伊甸芙宁',
        level: 99,
        climaxLimit: 1,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/伊甸芙宁_2.png',
      },
    ],
    mechanics: EDEN_MECHANICS,
    legacy: {
      sinType: 'sloth',
      gameOverSkillId: '伊甸芙宁_16',
      sleepingAvatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/伊甸芙宁_1.png',
    },
  },
  {
    id: 'elizabeth',
    sourceEntry: '旧 Boss：伊丽莎白夜羽',
    displayName: '伊丽莎白夜羽',
    aliases: ['伊丽莎白夜羽', '伊丽莎白', '夜羽', 'elizabeth'],
    category: 'main',
    status: 'ready',
    phases: [
      {
        phase: 1,
        displayName: '伊丽莎白夜羽',
        dataKey: '伊丽莎白夜羽',
        skillPoolKey: '伊丽莎白夜羽',
        level: 80,
        climaxLimit: 3,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/伊丽莎白夜羽.png',
      },
    ],
    mechanics: ELIZABETH_MECHANICS,
    legacy: {
      sinType: 'pride',
    },
  },
  {
    id: 'vespera',
    sourceEntry: '旧 Boss：薇丝佩菈',
    displayName: '薇丝佩菈',
    aliases: ['薇丝佩菈', 'vespera', '色欲'],
    category: 'main',
    status: 'ready',
    phases: [
      {
        phase: 1,
        displayName: '薇丝佩菈',
        dataKey: '薇丝佩菈',
        skillPoolKey: '薇丝佩菈',
        level: 40,
        climaxLimit: 3,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/薇丝佩菈.png',
      },
    ],
    mechanics: VESPERA_MECHANICS,
    legacy: {
      sinType: 'lust',
      selfSacrificeSkillId: '薇丝佩菈_自体献祭',
    },
  },
  {
    id: 'heisaki',
    sourceEntry: '旧 Boss：黑崎晴雯',
    displayName: '黑崎晴雯',
    aliases: ['黑崎晴雯', '晴雯', '黑崎', 'heisaki', '贪婪'],
    category: 'main',
    status: 'ready',
    phases: [
      {
        phase: 1,
        displayName: '黑崎晴雯',
        dataKey: '黑崎晴雯',
        skillPoolKey: '黑崎晴雯',
        level: 60,
        climaxLimit: 3,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/黑崎晴雯.png',
      },
    ],
    mechanics: HEISAKI_MECHANICS,
    legacy: {
      sinType: 'greed',
    },
  },
  {
    id: 'agnes',
    sourceEntry: '旧 Boss：艾格妮丝',
    displayName: '艾格妮丝',
    aliases: ['艾格妮丝', 'agnes', '鼠族公主', '蔷薇', '暴食'],
    category: 'main',
    status: 'ready',
    phases: [
      {
        phase: 1,
        displayName: '艾格妮丝',
        dataKey: '艾格妮丝',
        skillPoolKey: '艾格妮丝',
        level: 42,
        climaxLimit: 5,
      },
    ],
    mechanics: AGNES_MECHANICS,
    legacy: {
      sinType: 'gluttony',
    },
  },
  {
    id: 'yamadaHanako',
    sourceEntry: '山田花子',
    displayName: '山田花子',
    aliases: ['山田花子', '山田', '花子', '西园寺辉夜', '辉夜', 'yamada', 'hanako'],
    category: 'event',
    status: 'ready',
    phases: [
      {
        phase: 1,
        displayName: '山田花子',
        dataKey: '山田花子_伪装',
        skillPoolKey: '山田花子_伪装',
        level: 15,
        climaxLimit: 1,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/山田花子.png',
      },
      {
        phase: 2,
        displayName: '西园寺辉夜',
        dataKey: '山田花子',
        skillPoolKey: '西园寺辉夜',
        level: 75,
        climaxLimit: 1,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/山田花子.png',
      },
      {
        phase: 3,
        displayName: '西园寺辉夜（解放形态）',
        dataKey: '山田花子_解放',
        skillPoolKey: '西园寺辉夜_解放',
        level: 75,
        climaxLimit: 2,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/山田花子.png',
      },
    ],
    mechanics: YAMADA_HANAKO_MECHANICS,
  },
  {
    id: 'zhuangFangyi',
    sourceEntry: '庄方宜',
    displayName: '庄方宜',
    aliases: ['庄方宜', '渊主', '龙君', '龙宫之主', '海渊殿'],
    category: 'event',
    status: 'ready',
    phases: [
      {
        phase: 1,
        displayName: '庄方宜·玉座试探',
        dataKey: '庄方宜_玉座',
        skillPoolKey: '庄方宜_玉座',
        level: 80,
        climaxLimit: 3,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/庄方宜.png',
      },
      {
        phase: 2,
        displayName: '庄方宜·深渊亲征',
        dataKey: '庄方宜_亲征',
        skillPoolKey: '庄方宜_亲征',
        level: 80,
        climaxLimit: 3,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/庄方宜.png',
      },
      {
        phase: 3,
        displayName: '庄方宜·龙威解放',
        dataKey: '庄方宜_解放',
        skillPoolKey: '庄方宜_解放',
        level: 80,
        climaxLimit: 3,
        avatarUrl: 'https://img.vinsimage.org/性斗学园/立绘/庄方宜.png',
      },
    ],
    mechanics: ZHUANG_FANGYI_MECHANICS,
  },
];

export const CURRENT_BOSS_DEFINITION_BY_ID = Object.fromEntries(
  CURRENT_BOSS_DEFINITIONS.map(definition => [definition.id, definition]),
) as Record<CurrentBossId, CurrentBossDefinition>;

export function getCurrentBossDefinition(bossId: CurrentBossId): CurrentBossDefinition {
  return CURRENT_BOSS_DEFINITION_BY_ID[bossId];
}

export function getCurrentBossPhase(bossId: CurrentBossId, phase: number): CurrentBossPhaseDefinition | undefined {
  return getBossPhase(getCurrentBossDefinition(bossId), phase) as CurrentBossPhaseDefinition | undefined;
}

export function getCurrentBossPhaseDataKey(bossId: CurrentBossId, phase: number): string | undefined {
  return getCurrentBossPhase(bossId, phase)?.dataKey;
}

export function getCurrentBossPhaseSkillPoolKey(bossId: CurrentBossId, phase: number): string | undefined {
  return getCurrentBossPhase(bossId, phase)?.skillPoolKey;
}

export function getCurrentBossPhaseDisplayName(bossId: CurrentBossId, phase: number): string | undefined {
  return getCurrentBossPhase(bossId, phase)?.displayName;
}

export function getCurrentBossPhaseAvatarUrl(bossId: CurrentBossId, phase: number): string | undefined {
  return getCurrentBossPhase(bossId, phase)?.avatarUrl;
}

export function getCurrentBossPhaseClimaxLimit(bossId: CurrentBossId, phase: number): number | undefined {
  return getCurrentBossPhase(bossId, phase)?.climaxLimit;
}

export function getCurrentBossPhaseLevel(bossId: CurrentBossId, phase: number): number | undefined {
  return getCurrentBossPhase(bossId, phase)?.level;
}
