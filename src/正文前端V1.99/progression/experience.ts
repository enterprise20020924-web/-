import {
  ATTRIBUTE_GROWTH_STATE_KEY,
  awardLevelAttributePoints,
  getLevelAttributePointReward,
  initializeAttributeGrowth,
  restoreAttributeGrowthCheckpoint,
  settleAttributeGrowth,
} from './attribute-growth';
import { PROGRESSION_PRUNED_KEY } from './retention-state';
import { getAmamiState, readAmamiState } from '../state/model';
import { creditMoney, settleMoney } from '../money/ledger';
import { inheritAmamiState } from '../state/persistence';

/** 成长规则唯一主源。阈值为到达该等级的累计经验，数组下标 = 等级 - 1。 */
export const EXPERIENCE_CURVE_VERSION = 'staged-50-70-90-v1';
export const MAX_LEVEL = 100;
export const MAX_LEVEL_EXPERIENCE = 39875;
export const EXPERIENCE_OVERFLOW_GOLD_RATE = 200;
export const EXPERIENCE_STATE_KEY = 'experience';
export const AI_EXPERIENCE_REWARD_CAP = 100;
export const EXPERIENCE_THRESHOLDS: readonly number[] = Object.freeze([
  0, 75, 150, 230, 310, 395, 480, 565, 655, 745, 840, 935, 1030, 1130, 1230, 1335, 1440, 1545, 1655, 1765, 1880, 1995,
  2110, 2230, 2350, 2475, 2600, 2725, 2855, 2985, 3120, 3255, 3390, 3530, 3670, 3815, 3960, 4105, 4255, 4405, 4560,
  4715, 4870, 5030, 5190, 5355, 5520, 5685, 5855, 6025, 6200, 6385, 6585, 6795, 7015, 7245, 7490, 7745, 8010, 8285,
  8575, 8875, 9185, 9505, 9840, 10185, 10540, 10905, 11285, 11675, 12075, 12505, 12965, 13455, 13975, 14525, 15105,
  15715, 16355, 17025, 17725, 18455, 19215, 20005, 20825, 21675, 22555, 23465, 24405, 25375, 26375, 27475, 28675, 29975,
  31375, 32875, 34475, 36175, 37975, 39875,
]);

export type ExperienceData = { stat_data: Record<string, any>; [key: string]: any };
export interface ExperienceState {
  version: string;
  /** 本地真实累计经验；stat_data 中的经验只是它的显示副本。 */
  settledExperience: number;
  rewardedLevel: number;
}
const number = (value: unknown, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const levelNumber = (value: unknown) => Math.max(1, Math.min(MAX_LEVEL, Math.floor(number(value, 1))));
const roundExperience = (value: number) => Math.round(value * 100) / 100;

export function getLevelThreshold(level: number): number {
  return EXPERIENCE_THRESHOLDS[levelNumber(level) - 1];
}

export function getLevelFromExperience(experience: number): number {
  const xp = Math.max(0, number(experience));
  let low = 0;
  let high = EXPERIENCE_THRESHOLDS.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (EXPERIENCE_THRESHOLDS[mid] <= xp) low = mid + 1;
    else high = mid;
  }
  return Math.max(1, low);
}

export function getLevelExperienceCost(level: number): number {
  const current = levelNumber(level);
  return current === MAX_LEVEL ? 0 : getLevelThreshold(current + 1) - getLevelThreshold(current);
}

export function getExperienceProgress(experience: number) {
  const total = Math.min(MAX_LEVEL_EXPERIENCE, Math.max(0, number(experience)));
  const level = getLevelFromExperience(total);
  const threshold = getLevelThreshold(level);
  const required = getLevelExperienceCost(level);
  const current = roundExperience(total - threshold);
  return {
    level,
    total,
    threshold,
    required,
    current,
    remaining: required === 0 ? 0 : roundExperience(required - current),
    nextThreshold: level === MAX_LEVEL ? null : getLevelThreshold(level + 1),
    percentage: required === 0 ? 100 : (current / required) * 100,
    isMaxLevel: level === MAX_LEVEL,
  };
}

/** 给任务/打工定价：按内容的设计等级取升级成本；不随玩家当前等级自动缩放。 */
export function getExperienceRewardBudget(contentLevel: number, fractionOfLevel: number): number {
  const cost = getLevelExperienceCost(Math.min(MAX_LEVEL - 1, levelNumber(contentLevel)));
  return Math.max(0, Math.round(cost * number(fractionOfLevel)));
}

export function getExperienceBetweenLevels(from: number, to: number): number {
  return Math.max(0, getLevelThreshold(to) - getLevelThreshold(from));
}

function firstTalent(data: ExperienceData): string | undefined {
  return Object.keys(data.stat_data.技能系统?.$天赋 ?? {})[0];
}

export function getExperienceGainMultiplier(data: ExperienceData): number {
  return firstTalent(data) === 'talent_daily_exp_reduce' ? 1.25 : 1;
}

/** 新开局/人物预设的初始等级只在这里换算为累计经验，不发放追溯升级奖励。 */
export function initializeExperience(data: ExperienceData, level = 1): void {
  delete getAmamiState(data)[PROGRESSION_PRUNED_KEY];
  const initialLevel = levelNumber(level);
  data.stat_data.角色基础 ??= {};
  data.stat_data.角色基础._等级 = initialLevel;
  data.stat_data.角色基础.经验值 = getLevelThreshold(initialLevel);
  getAmamiState(data)[EXPERIENCE_STATE_KEY] = {
    version: EXPERIENCE_CURVE_VERSION,
    settledExperience: getLevelThreshold(initialLevel),
    rewardedLevel: initialLevel,
  } satisfies ExperienceState;
  initializeAttributeGrowth(data);
}

/** 仅用于一次性读取旧存档的级内经验。新规则的阈值和收入均不再受难度影响。 */
function convertLegacyExperience(data: ExperienceData): ExperienceState {
  const base = data.stat_data.角色基础;
  const oldLevel = levelNumber(base._等级);
  const oldExp = Math.max(0, number(base.经验值));
  const difficultyCost: Record<string, number> = { 简单: 100, 普通: 125, 困难: 150, 抖M: 200, 作弊: 100 };
  const oldCost = Math.max(50, Math.floor((difficultyCost[base.难度] ?? 125) / getExperienceGainMultiplier(data)));
  const gained = Math.min(MAX_LEVEL - oldLevel, Math.floor(oldExp / oldCost));
  const level = oldLevel + gained;
  const remainder = oldExp - gained * oldCost;
  const converted =
    level === MAX_LEVEL
      ? MAX_LEVEL_EXPERIENCE + remainder
      : getLevelThreshold(level) + Math.floor((remainder / oldCost) * getLevelExperienceCost(level));
  base.经验值 = converted;
  return { version: EXPERIENCE_CURVE_VERSION, settledExperience: converted, rewardedLevel: oldLevel };
}

function readState(data?: ExperienceData): ExperienceState | undefined {
  const state = readAmamiState(data)?.[EXPERIENCE_STATE_KEY];
  return state?.version === EXPERIENCE_CURVE_VERSION ? state : undefined;
}

export function getSettledExperience(data?: ExperienceData): number | undefined {
  return readState(data)?.settledExperience;
}

/** 只供明确的旧档导入调用；正常结算绝不能因账本缺失而猜测经验格式。 */
export function migrateLegacyExperience(data: ExperienceData) {
  if (readState(data)) return settleExperience(data);
  getAmamiState(data)[EXPERIENCE_STATE_KEY] = convertLegacyExperience(data);
  return { ...settleExperience(data), migrated: true };
}

/**
 * 把本地真实经验投影到 MVU，并计算等级和升级奖励。绝不从 stat_data 反推收入。
 * 结算游标随楼层数据保存；重复刷新不重复发奖，回滚/重选回复沿各自楼层重算。
 */
export function settleExperience(data: ExperienceData, previous?: ExperienceData) {
  const restored = inheritAmamiState(data, previous);
  const moneyChanged = settleMoney(data, previous) || restored;
  const base = data?.stat_data?.角色基础;
  if (!base) return { changed: moneyChanged, levelsGained: 0, goldEarned: 0, migrated: false };
  const state = readState(data) ?? (readAmamiState(data)?.progressionPruned ? undefined : readState(previous));
  if (!state) {
    // stat_data 可接受 AI 的候选更新，不能反过来证明“此前已结算到几级”。
    // 找不到本分支的有效账本时，仅等待开局初始化或显式旧档导入。
    return { changed: moneyChanged, levelsGained: 0, goldEarned: 0, migrated: false, requiresInitialization: true };
  }
  const before = JSON.stringify([
    base._等级,
    base.经验值,
    getAmamiState(data)[EXPERIENCE_STATE_KEY],
    getAmamiState(data)[ATTRIBUTE_GROWTH_STATE_KEY],
    getAmamiState(data)[PROGRESSION_PRUNED_KEY],
    data.stat_data.基础属性,
    data.stat_data.核心状态,
    data.stat_data.物品系统?._天海信用点,
  ]);
  if (getAmamiState(data)[PROGRESSION_PRUNED_KEY] === 1) {
    // 仅在经验账本确实存在时恢复旧清理标记；不能用人物变量伪造结算记录。
    restoreAttributeGrowthCheckpoint(data);
    delete getAmamiState(data)[PROGRESSION_PRUNED_KEY];
  }
  const total = roundExperience(Math.max(0, number(state.settledExperience)));
  const level = getLevelFromExperience(total);
  const levelsGained = Math.max(0, level - state.rewardedLevel);
  if (levelsGained) {
    const core = (data.stat_data.核心状态 ??= {});
    const potential = number(core._潜力, 5);
    const talent = firstTalent(data);
    core.$技能点 =
      number(core.$技能点) +
      levelsGained * (Math.floor(potential) + (talent === 'talent_daily_levelup_skill_point' ? 1 : 0));
  }
  const goldEarned = roundExperience(Math.max(0, total - MAX_LEVEL_EXPERIENCE) * EXPERIENCE_OVERFLOW_GOLD_RATE);
  if (goldEarned) {
    creditMoney(data, goldEarned, 'experience');
  }
  base.经验值 = Math.min(MAX_LEVEL_EXPERIENCE, total);
  base._等级 = level;
  getAmamiState(data)[EXPERIENCE_STATE_KEY] = {
    version: EXPERIENCE_CURVE_VERSION,
    settledExperience: base.经验值,
    rewardedLevel: Math.max(state.rewardedLevel, level),
  } satisfies ExperienceState;
  settleAttributeGrowth(data, previous);
  if (levelsGained) {
    awardLevelAttributePoints(
      data,
      levelsGained *
        getLevelAttributePointReward(
          number(data.stat_data.核心状态?._潜力, 5),
          firstTalent(data) === 'talent_daily_levelup_stat_point',
        ),
    );
  }
  const after = JSON.stringify([
    base._等级,
    base.经验值,
    getAmamiState(data)[EXPERIENCE_STATE_KEY],
    getAmamiState(data)[ATTRIBUTE_GROWTH_STATE_KEY],
    getAmamiState(data)[PROGRESSION_PRUNED_KEY],
    data.stat_data.基础属性,
    data.stat_data.核心状态,
    data.stat_data.物品系统?._天海信用点,
  ]);
  return { changed: moneyChanged || before !== after, levelsGained, goldEarned, migrated: false };
}

/** 所有脚本奖励的统一入口。amount 为基础经验，天赋倍率只在结算时应用一次。 */
export function grantExperience(data: ExperienceData, amount: number) {
  const prepared = settleExperience(data);
  const state = readState(data);
  if (!state) return prepared;
  state.settledExperience = roundExperience(
    state.settledExperience + Math.max(0, number(amount)) * getExperienceGainMultiplier(data),
  );
  return settleExperience(data);
}

export function deductExperience(data: ExperienceData, amount: number) {
  const prepared = settleExperience(data);
  const state = readState(data);
  if (!state) return prepared;
  const floor = getLevelThreshold(getLevelFromExperience(state.settledExperience));
  state.settledExperience = roundExperience(Math.max(floor, state.settledExperience - Math.max(0, number(amount))));
  return settleExperience(data);
}

/** 一条 AI 回复的经验操作合并后只调用一次；含天赋加成的最终收入上限为100。 */
export function applyAiExperienceDelta(data: ExperienceData, delta: number) {
  if (delta < 0) return deductExperience(data, -delta);
  return grantExperience(
    data,
    Math.min(Math.max(0, number(delta)), AI_EXPERIENCE_REWARD_CAP / getExperienceGainMultiplier(data)),
  );
}

/** 校对 AI 的原始经验更新时，只补未结算的差额，不覆盖天赋加成或后续前端奖励。 */
export function reconcileExperienceUpdate(data: ExperienceData, previous: ExperienceData, rawTotal: number): boolean {
  const migrated = settleExperience(data, previous).changed;
  if (!readState(data) || !readState(previous)) return migrated;
  const expected = structuredClone(previous);
  const previousRaw = readState(expected)!.settledExperience;
  settleExperience(expected);
  expected.stat_data.技能系统 = structuredClone(data.stat_data.技能系统 ?? {});
  const delta = rawTotal - previousRaw;
  applyAiExperienceDelta(expected, delta);
  const missing = expected.stat_data.角色基础.经验值 - data.stat_data.角色基础.经验值;
  if (missing > 0) {
    grantExperience(data, missing / getExperienceGainMultiplier(data));
    return true;
  }
  return migrated;
}
