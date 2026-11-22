import { createEmptyBonusStats, type BonusStats } from './combatMath';
import { addPermanentNumericBonuses, migrateLegacyPermanentNumericBonuses } from './permanentNumericBonuses';

export type PermanentBaseAttribute = '魅力' | '幸运' | '闪避率' | '暴击率';
export type PermanentBonusKey = keyof BonusStats;

export interface PermanentConsumableEffect {
  永久属性?: Partial<Record<PermanentBaseAttribute, number>>;
  永久加成?: Partial<Record<PermanentBonusKey, number>>;
  潜力提升?: number;
}

export const MOONCAKE_PERMANENT_EFFECTS: Readonly<Record<string, PermanentConsumableEffect>> = {
  五仁月饼: { 永久加成: { 基础性斗力成算: 1 } },
  红豆沙月饼: { 永久加成: { 基础忍耐力成算: 1 } },
  蛋黄莲蓉月饼: { 永久属性: { 魅力: 2 } },
  纯莲蓉月饼: { 永久属性: { 幸运: 2 } },
  奶黄流心月饼: { 永久加成: { 基础性斗力加成: 3 } },
  栗蓉月饼: { 永久加成: { 基础忍耐力加成: 3 } },
  黑芝麻月饼: {
    永久属性: { 暴击率: 1 },
    永久加成: { 基础性斗力成算: 1 },
  },
  紫薯月饼: { 永久属性: { 闪避率: 1, 幸运: 1 } },
  椰蓉月饼: {
    永久属性: { 魅力: 1 },
    永久加成: { 基础忍耐力成算: 1 },
  },
  桂花酒酿月饼: { 潜力提升: 0.1 },
  云腿月饼: { 永久加成: { 基础性斗力加成: 2, 基础忍耐力加成: 2 } },
  玫瑰鲜花月饼: { 永久属性: { 魅力: 1, 幸运: 1 } },
  冰皮月饼: {
    永久属性: { 魅力: 2, 幸运: 2, 闪避率: 2 },
  },
  冰淇淋月饼: {
    永久属性: { 魅力: 3, 暴击率: 2 },
    永久加成: { 基础性斗力成算: 2 },
  },
};

const BASE_ATTRIBUTE_ALIASES: Record<PermanentBaseAttribute, string[]> = {
  魅力: ['魅力', '基础魅力', '_魅力'],
  幸运: ['幸运', '基础幸运', '_幸运'],
  闪避率: ['闪避率', '基础闪避率', '_闪避率'],
  暴击率: ['暴击率', '基础暴击率', '_暴击率'],
};

const BONUS_KEYS = Object.keys(createEmptyBonusStats()) as PermanentBonusKey[];

function normalizeItemName(value: unknown): string {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\s「」『』（）()·・]/g, '');
}

function finiteNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasEffect(effect: PermanentConsumableEffect): boolean {
  return (
    Object.values(effect.永久属性 || {}).some(value => Number(value) !== 0) ||
    Object.values(effect.永久加成 || {}).some(value => Number(value) !== 0) ||
    Number(effect.潜力提升 || 0) !== 0
  );
}

function normalizeExplicitEffect(itemData: any): PermanentConsumableEffect {
  const effect: PermanentConsumableEffect = {
    永久属性: {},
    永久加成: {},
  };
  const baseSource = itemData?.永久属性 ?? itemData?.permanent;
  if (baseSource && typeof baseSource === 'object') {
    for (const [rawKey, rawValue] of Object.entries(baseSource)) {
      const value = finiteNumber(rawValue);
      if (value === undefined) continue;

      const baseKey = (Object.keys(BASE_ATTRIBUTE_ALIASES) as PermanentBaseAttribute[]).find(key =>
        BASE_ATTRIBUTE_ALIASES[key].includes(rawKey),
      );
      if (baseKey) {
        effect.永久属性![baseKey] = value;
      } else if (rawKey === '潜力' || rawKey === '_潜力') {
        effect.潜力提升 = value;
      } else if (BONUS_KEYS.includes(rawKey as PermanentBonusKey)) {
        effect.永久加成![rawKey as PermanentBonusKey] = value;
      }
    }
  }

  const bonusSource = itemData?.永久加成 ?? itemData?.permanentBonus;
  if (bonusSource && typeof bonusSource === 'object') {
    for (const key of BONUS_KEYS) {
      const value = finiteNumber(bonusSource[key]);
      if (value !== undefined) {
        effect.永久加成![key] = value;
      }
    }
  }

  const potential = finiteNumber(itemData?.潜力提升);
  if (potential !== undefined) {
    effect.潜力提升 = potential;
  }

  return effect;
}

function cloneEffect(effect: PermanentConsumableEffect): PermanentConsumableEffect {
  return {
    永久属性: { ...(effect.永久属性 || {}) },
    永久加成: { ...(effect.永久加成 || {}) },
    潜力提升: effect.潜力提升,
  };
}

const MOONCAKE_EFFECTS_BY_NORMALIZED_NAME = new Map(
  Object.entries(MOONCAKE_PERMANENT_EFFECTS).map(([name, effect]) => [normalizeItemName(name), effect]),
);
MOONCAKE_EFFECTS_BY_NORMALIZED_NAME.set(normalizeItemName('冰淇凌月饼'), MOONCAKE_PERMANENT_EFFECTS.冰淇淋月饼);

export function resolvePermanentConsumableEffect(
  itemName: string,
  itemData?: Record<string, any> | null,
): PermanentConsumableEffect | null {
  const explicit = normalizeExplicitEffect(itemData);
  if (hasEffect(explicit)) {
    return explicit;
  }

  const fallback = MOONCAKE_EFFECTS_BY_NORMALIZED_NAME.get(normalizeItemName(itemName));
  return fallback ? cloneEffect(fallback) : null;
}

export function hasPermanentConsumableEffect(itemName: string, itemData?: Record<string, any> | null): boolean {
  return resolvePermanentConsumableEffect(itemName, itemData) !== null;
}

function formatValue(value: number, suffix = ''): string {
  return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

export function describePermanentConsumableEffect(itemName: string, itemData?: Record<string, any> | null): string {
  const effect = resolvePermanentConsumableEffect(itemName, itemData);
  if (!effect) return '';

  const parts: string[] = [];
  const baseLabels: Record<PermanentBaseAttribute, string> = {
    魅力: '基础魅力',
    幸运: '基础幸运',
    闪避率: '基础闪避率',
    暴击率: '基础暴击率',
  };
  for (const [key, value] of Object.entries(effect.永久属性 || {}) as Array<[PermanentBaseAttribute, number]>) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) continue;
    parts.push(`${baseLabels[key]}${formatValue(numericValue, key.endsWith('率') ? '%' : '')}`);
  }
  for (const [key, value] of Object.entries(effect.永久加成 || {})) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) continue;
    const suffix = key.includes('成算') || key.includes('率') ? '%' : '';
    parts.push(`${key}${formatValue(numericValue, suffix)}`);
  }
  if (effect.潜力提升) {
    parts.push(`潜力${formatValue(effect.潜力提升)}`);
  }
  return parts.join('、');
}

export interface AppliedPermanentConsumableEffect {
  changed: boolean;
  summary: string;
}

export function applyPermanentConsumableEffect(
  statData: Record<string, any>,
  itemName: string,
  itemData?: Record<string, any> | null,
  quantity = 1,
): AppliedPermanentConsumableEffect {
  const effect = resolvePermanentConsumableEffect(itemName, itemData);
  if (!effect) {
    return { changed: false, summary: '' };
  }

  const count = Math.max(1, Math.floor(Number(quantity) || 1));
  migrateLegacyPermanentNumericBonuses(statData);
  if (!statData.基础属性 || typeof statData.基础属性 !== 'object') statData.基础属性 = {};
  if (!statData.核心状态 || typeof statData.核心状态 !== 'object') statData.核心状态 = {};

  const basePaths: Record<PermanentBaseAttribute, string> = {
    魅力: '_魅力',
    幸运: '_幸运',
    闪避率: '_闪避率',
    暴击率: '_暴击率',
  };
  for (const [key, value] of Object.entries(effect.永久属性 || {}) as Array<[PermanentBaseAttribute, number]>) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) continue;
    const path = basePaths[key];
    const current = Number(statData.基础属性[path]) || 0;
    const next = current + numericValue * count;
    statData.基础属性[path] = Math.max(0, next);
  }

  addPermanentNumericBonuses(statData, effect.永久加成 || {}, count);

  const potential = Number(effect.潜力提升 || 0);
  if (Number.isFinite(potential) && potential !== 0) {
    const currentPotential = Number(statData.核心状态._潜力) || 0;
    statData.核心状态._潜力 = Math.min(10, Math.max(0, currentPotential + potential * count));
  }

  return {
    changed: true,
    summary: describePermanentConsumableEffect(itemName, itemData),
  };
}
