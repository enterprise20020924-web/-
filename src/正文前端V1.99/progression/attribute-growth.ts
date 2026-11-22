import type { ExperienceData } from './experience';
import { PROGRESSION_PRUNED_KEY } from './retention-state';
import { getAmamiState, readAmamiState } from '../state/model';
import { inheritAmamiState } from '../state/persistence';

export const ATTRIBUTE_GROWTH_STATE_KEY = 'attributeGrowth';
export const ATTRIBUTE_GROWTH_VERSION = 'potential-12-3-v1';
export const ATTRIBUTE_GROWTH_MULTIPLIER = 0.8;

/** 单位是每个自由点购买的属性值；概率属性的单位为百分点。 */
export const ATTRIBUTE_POINT_RULES = {
  '核心状态.$最大耐力': { increment: 10, initial: 100 },
  '核心状态.$最大快感': { increment: 10, initial: 100 },
  '基础属性._魅力': { increment: 2, initial: 10 },
  '基础属性._幸运': { increment: 2, initial: 10 },
  '基础属性._闪避率': { increment: 1, initial: 0 },
  '基础属性._暴击率': { increment: 1, initial: 0 },
} as const;
export type AllocatableAttribute = keyof typeof ATTRIBUTE_POINT_RULES;
export const GROWTH_ATTRIBUTES = [
  '核心状态.$最大耐力',
  '核心状态.$最大快感',
  '基础属性._魅力',
  '基础属性._幸运',
] as const satisfies readonly AllocatableAttribute[];
export type GrowthAttribute = (typeof GROWTH_ATTRIBUTES)[number];

export interface AttributeGrowthState {
  version: typeof ATTRIBUTE_GROWTH_VERSION;
  /** 旧存档只保存接入基线，不伪造无法还原的历史加点。 */
  origin: 'new-character' | 'legacy-baseline' | 'restored-snapshot';
  baseline: Record<AllocatableAttribute, number>;
  spentPoints: Record<AllocatableAttribute, number>;
  appliedGrowth: Record<GrowthAttribute, number>;
  /** 仅记录本系统接入后发放的升级自由点，不与任务/道具或成长混算。 */
  awardedLevelPoints: number;
}

const numeric = (value: unknown, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
// 系数一位小数乘0.8，内部保留百分位，不逐级舍入。
const round = (value: number) => Math.round(value * 100) / 100;
const attributes = Object.keys(ATTRIBUTE_POINT_RULES) as AllocatableAttribute[];

function readAttribute(data: ExperienceData, path: AllocatableAttribute): number {
  const [group, key] = path.split('.');
  return numeric(data.stat_data[group]?.[key], ATTRIBUTE_POINT_RULES[path].initial);
}

function addAttribute(data: ExperienceData, path: AllocatableAttribute, delta: number): void {
  const [group, key] = path.split('.');
  const current = readAttribute(data, path);
  data.stat_data[group] ??= {};
  data.stat_data[group][key] = round(current + delta);
}

export function getAttributeGrowthState(data?: ExperienceData): AttributeGrowthState | undefined {
  const state = readAmamiState(data)?.[ATTRIBUTE_GROWTH_STATE_KEY];
  return state?.version === ATTRIBUTE_GROWTH_VERSION ? state : undefined;
}

function createState(data: ExperienceData, origin: AttributeGrowthState['origin']): AttributeGrowthState {
  return {
    version: ATTRIBUTE_GROWTH_VERSION,
    origin,
    baseline: Object.fromEntries(
      attributes.map(path => [path, readAttribute(data, path)]),
    ) as AttributeGrowthState['baseline'],
    spentPoints: Object.fromEntries(attributes.map(path => [path, 0])) as AttributeGrowthState['spentPoints'],
    appliedGrowth: Object.fromEntries(
      GROWTH_ATTRIBUTES.map(path => [path, 0]),
    ) as AttributeGrowthState['appliedGrowth'],
    awardedLevelPoints: 0,
  };
}

/** P按0.1分档；整数十分位计算，2.85等中点按约定进为2.9。 */
export function getAttributeGrowthCoefficients(potential: number): Record<GrowthAttribute, number> {
  const tenths = Math.max(50, Math.min(100, Math.round(numeric(potential, 5) * 10)));
  const resource = Math.floor((12 * tenths + 5) / 10) / 10;
  const social = Math.floor((3 * tenths + 5) / 10) / 10;
  return {
    '核心状态.$最大耐力': resource,
    '核心状态.$最大快感': resource,
    '基础属性._魅力': social,
    '基础属性._幸运': social,
  };
}

export function getAttributeGrowthTargets(level: number, potential: number): Record<GrowthAttribute, number> {
  const upgrades = Math.max(0, Math.min(100, Math.floor(numeric(level, 1))) - 1);
  const coefficients = getAttributeGrowthCoefficients(potential);
  return Object.fromEntries(
    GROWTH_ATTRIBUTES.map(path => [path, round(upgrades * coefficients[path] * ATTRIBUTE_GROWTH_MULTIPLIER)]),
  ) as Record<GrowthAttribute, number>;
}

/** 多退少补只比较成长账目。总面板、未用自由点、已花自由点均不参与达标判断。 */
export function settleAttributeGrowth(data: ExperienceData, previous?: ExperienceData): boolean {
  if (!data.stat_data?.角色基础) return false;
  const restored = inheritAmamiState(data, previous);
  if (getAmamiState(data)[PROGRESSION_PRUNED_KEY] === 1 && !getAttributeGrowthState(data)) {
    restoreAttributeGrowthCheckpoint(data);
    return true;
  }
  let state = getAttributeGrowthState(data);
  let changed = restored;
  if (!state) {
    const inherited = getAttributeGrowthState(previous);
    state = inherited ? structuredClone(inherited) : createState(data, 'legacy-baseline');
    getAmamiState(data)[ATTRIBUTE_GROWTH_STATE_KEY] = state;
    changed = true;
  }
  const target = getAttributeGrowthTargets(data.stat_data.角色基础._等级, data.stat_data.核心状态?._潜力);
  for (const path of GROWTH_ATTRIBUTES) {
    const delta = round(target[path] - state.appliedGrowth[path]);
    if (!delta) continue;
    addAttribute(data, path, delta);
    state.appliedGrowth[path] = target[path];
    changed = true;
  }
  return changed;
}

/** MVU 恢复的是已结算的属性快照，不能再次补入全部成长；历史投入明细已清理，保留为基线。 */
export function restoreAttributeGrowthCheckpoint(data: ExperienceData): void {
  if (getAttributeGrowthState(data)) return;
  const state = createState(data, 'restored-snapshot');
  state.appliedGrowth = getAttributeGrowthTargets(data.stat_data.角色基础._等级, data.stat_data.核心状态?._潜力);
  for (const path of GROWTH_ATTRIBUTES) {
    state.baseline[path] = round(state.baseline[path] - state.appliedGrowth[path]);
  }
  getAmamiState(data)[ATTRIBUTE_GROWTH_STATE_KEY] = state;
}

/** 新开局提供的是未含新成长的基础字段；指定等级可直接获得相应成长，不补发历史自由点。 */
export function initializeAttributeGrowth(data: ExperienceData): void {
  getAmamiState(data)[ATTRIBUTE_GROWTH_STATE_KEY] = createState(data, 'new-character');
  settleAttributeGrowth(data);
}

/** 基础自由点减半，保留0.5；天赋额外1点完整保留。技能点由经验模块沿用旧规则。 */
export function getLevelAttributePointReward(potential: number, extraTalentPoint = false): number {
  return Math.floor(numeric(potential, 5) / 2) / 2 + (extraTalentPoint ? 1 : 0);
}

export function awardLevelAttributePoints(data: ExperienceData, amount: number): void {
  settleAttributeGrowth(data);
  const core = (data.stat_data.核心状态 ??= {});
  core.$属性点 = round(numeric(core.$属性点) + amount);
  const state = getAttributeGrowthState(data)!;
  state.awardedLevelPoints = round(state.awardedLevelPoints + amount);
}

/** 调用方在同一楼层事务中保存整个data，扣点、加属性和记账因此共享同一次写入。 */
export function allocateAttributePoints(data: ExperienceData, path: string, amount = 1): boolean {
  if (!Object.prototype.hasOwnProperty.call(ATTRIBUTE_POINT_RULES, path)) return false;
  const cost = Math.floor(numeric(amount));
  const core = data.stat_data.核心状态;
  if (cost < 1 || !core || numeric(core.$属性点) < cost) return false;
  settleAttributeGrowth(data);
  const attribute = path as AllocatableAttribute;
  const state = getAttributeGrowthState(data)!;
  addAttribute(data, attribute, cost * ATTRIBUTE_POINT_RULES[attribute].increment);
  core.$属性点 = round(numeric(core.$属性点) - cost);
  state.spentPoints[attribute] += cost;
  return true;
}
