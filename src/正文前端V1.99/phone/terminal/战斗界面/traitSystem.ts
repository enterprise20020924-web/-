export type TraitRarity = 'B' | 'A' | 'S';

export interface TraitModifiers {
  sexPowerMultiplier?: number;
  enduranceMultiplier?: number;
  maxEnduranceMultiplier?: number;
  maxPleasureMultiplier?: number;
  charmMultiplier?: number;
  luckMultiplier?: number;
  evasionFlat?: number;
  critFlat?: number;
  skillDamageMultiplier?: number;
  extraHitCount?: number;
}

export interface EnemyTraitDefinition {
  id: string;
  name: string;
  rarity: TraitRarity;
  description: string;
  modifiers?: TraitModifiers;
  ruleChanging?: boolean;
}

export interface EnemyTraitRuntimeState {
  ids: string[];
  aphrodisiacStacks: number;
  aphrodisiacActive: boolean;
  unyieldingUsed: boolean;
  firstStrikeActive: boolean;
  sealedSkillId: string | null;
  adaptationSkillId: string | null;
  adaptationUses: number;
}

const unicode = (value: string) => value;

export const TRAIT_DEFINITIONS: EnemyTraitDefinition[] = [
  {
    id: 'trait_sex_power_up',
    name: unicode('\u6027\u6b32\u5f3a\u5316'),
    rarity: 'B',
    description: unicode('\u6027\u6597\u529b\u63d0\u9ad8 20%'),
    modifiers: { sexPowerMultiplier: 0.2 },
  },
  {
    id: 'trait_endurance_up',
    name: unicode('\u94c1\u58c1\u9632\u5fa1'),
    rarity: 'B',
    description: unicode('\u5fcd\u8010\u529b\u63d0\u9ad8 25%'),
    modifiers: { enduranceMultiplier: 0.25 },
  },
  {
    id: 'trait_max_stamina_up',
    name: unicode('\u6301\u4e45\u8010\u529b'),
    rarity: 'B',
    description: unicode(
      '\u6700\u5927\u8010\u529b\u63d0\u9ad8 20%\uff0c\u5f53\u524d\u8010\u529b\u540c\u6b65\u589e\u52a0\u7edd\u5bf9\u5dee\u503c',
    ),
    modifiers: { maxEnduranceMultiplier: 0.2 },
  },
  {
    id: 'trait_evasion_up',
    name: unicode('\u654f\u9510\u76f4\u89c9'),
    rarity: 'B',
    description: unicode('\u95ea\u907f\u7387 +10\uff0c\u4e0a\u9650 70'),
    modifiers: { evasionFlat: 10 },
  },
  {
    id: 'trait_crit_up',
    name: unicode('\u7cbe\u51c6\u6253\u51fb'),
    rarity: 'B',
    description: unicode('\u66b4\u51fb\u7387 +15'),
    modifiers: { critFlat: 15 },
  },
  {
    id: 'trait_charm_up',
    name: unicode('\u9b45\u529b\u5149\u73af'),
    rarity: 'B',
    description: unicode('\u9b45\u529b +30%'),
    modifiers: { charmMultiplier: 0.3 },
  },
  {
    id: 'trait_luck_up',
    name: unicode('\u5e78\u8fd0\u4e4b\u661f'),
    rarity: 'B',
    description: unicode('\u5e78\u8fd0 +25%'),
    modifiers: { luckMultiplier: 0.25 },
  },
  {
    id: 'trait_regen',
    name: unicode('\u5feb\u901f\u6062\u590d'),
    rarity: 'B',
    description: unicode('\u6bcf\u56de\u5408\u6062\u590d\u6700\u5927\u8010\u529b 5%'),
  },
  {
    id: 'trait_max_pleasure_up',
    name: unicode('\u9ad8\u6f6e\u97e7\u6027'),
    rarity: 'B',
    description: unicode('\u6700\u5927\u5feb\u611f +15%'),
    modifiers: { maxPleasureMultiplier: 0.15 },
  },
  {
    id: 'trait_aphrodisiac',
    name: unicode('\u50ac\u6deb'),
    rarity: 'A',
    description: unicode(
      '\u6bcf\u56de\u5408\u53e0\u52a0\u4e00\u5c42\uff0c\u6301\u7eed\u5230\u73a9\u5bb6\u9996\u6b21\u9ad8\u6f6e',
    ),
  },
  {
    id: 'trait_damage_reflect',
    name: unicode('\u4f24\u5bb3\u53cd\u5f39'),
    rarity: 'A',
    description: unicode('\u53d7\u5230\u4f24\u5bb3\u65f6\u53cd\u5f3920%'),
  },
  {
    id: 'trait_life_drain',
    name: unicode('\u6027\u80fd\u5438\u53d6'),
    rarity: 'A',
    description: unicode('\u9020\u6210\u4f24\u5bb3\u540e\u964d\u4f4e\u81ea\u8eab\u5feb\u611f'),
  },
  {
    id: 'trait_expose_weakness',
    name: unicode('\u5f31\u70b9\u66b4\u9732'),
    rarity: 'A',
    description: unicode('\u547d\u4e2d\u540e 30% \u6982\u7387\u4f7f\u73a9\u5bb6\u654f\u611f'),
  },
  {
    id: 'trait_first_strike',
    name: unicode('\u5148\u624b'),
    rarity: 'A',
    description: unicode('\u7b2c\u4e00\u56de\u5408\u653b\u51fb +25%\uff0c\u66b4\u51fb +20'),
  },
  {
    id: 'trait_skill_enhance',
    name: unicode('\u6280\u80fd\u5f3a\u5316'),
    rarity: 'A',
    description: unicode('\u6280\u80fd\u4f24\u5bb3 +15%'),
    modifiers: { skillDamageMultiplier: 0.15 },
  },
  {
    id: 'trait_bind_master',
    name: unicode('\u675f\u7f1a\u5927\u5e08'),
    rarity: 'A',
    description: unicode('\u675f\u7f1a\u4e0a\u9650 +1 \u56de\u5408'),
  },
  {
    id: 'trait_debuff_extend',
    name: unicode('\u51cf\u76ca\u5ef6\u957f'),
    rarity: 'A',
    description: unicode('\u65bd\u52a0\u7ed9\u73a9\u5bb6\u7684\u51cf\u76ca +1 \u56de\u5408'),
  },
  {
    id: 'trait_combo_enhance',
    name: unicode('\u8fde\u51fb\u5f3a\u5316'),
    rarity: 'A',
    description: unicode('\u591a\u6bb5\u6280\u80fd\u8fde\u51fb +1'),
    modifiers: { extraHitCount: 1 },
  },
  {
    id: 'trait_level_swap',
    name: unicode('\u7b49\u7ea7\u4ea4\u6362'),
    rarity: 'S',
    description: unicode('\u4ec5\u5f71\u54cd\u538b\u5236\u8ba1\u7b97'),
    ruleChanging: true,
  },
  {
    id: 'trait_desperation',
    name: unicode('\u7edd\u5883\u53cd\u51fb'),
    rarity: 'S',
    description: unicode('\u5f53\u524d\u5feb\u611f\u8d8a\u9ad8\uff0c\u6280\u80fd\u4f24\u5bb3\u8d8a\u9ad8'),
  },
  {
    id: 'trait_pleasure_resonance',
    name: unicode('\u5feb\u611f\u5171\u9e23'),
    rarity: 'S',
    description: unicode('\u53d7\u5230\u5feb\u611f\u4f24\u5bb3\u65f6\u5c0630%\u8f6c\u7ed9\u73a9\u5bb6'),
  },
  {
    id: 'trait_unyielding',
    name: unicode('\u4e0d\u5c48\u610f\u5fd7'),
    rarity: 'S',
    description: unicode('\u9996\u6b21\u9ad8\u6f6e\u524d\u514d\u75ab\u4e00\u6b21'),
    ruleChanging: true,
  },
  {
    id: 'trait_taunt_seal',
    name: unicode('\u5632\u8bbd\u538b\u5236'),
    rarity: 'S',
    description: unicode('\u6218\u6597\u5f00\u59cb\u5c01\u5370\u4e00\u4e2a\u4e3b\u52a8\u6280\u80fd'),
    ruleChanging: true,
  },
  {
    id: 'trait_adaptation',
    name: unicode('\u9002\u5e94\u8fdb\u5316'),
    rarity: 'S',
    description: unicode('\u8fde\u7eed\u4f7f\u7528\u540c\u4e00\u6280\u80fd\u65f6\u4f24\u5bb3 -40%'),
  },
  {
    id: 'trait_double_climax',
    name: unicode('\u53cc\u91cd\u9ad8\u6f6e'),
    rarity: 'S',
    description: unicode('\u73a9\u5bb6\u6bcf\u6b21\u9ad8\u6f6e\u8ba1\u6570 +2'),
    ruleChanging: true,
  },
];

export const TRAITS_BY_ID = Object.fromEntries(TRAIT_DEFINITIONS.map(trait => [trait.id, trait])) as Record<
  string,
  EnemyTraitDefinition
>;
const RULE_CHANGING_TRAITS = new Set(['trait_level_swap', 'trait_taunt_seal', 'trait_double_climax']);

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

export function createTraitSeededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

export function createTraitRuntimeState(ids: string[] = []): EnemyTraitRuntimeState {
  const normalized = [...new Set(ids)].filter(id => Boolean(TRAITS_BY_ID[id]));
  return {
    ids: normalized,
    aphrodisiacStacks: 0,
    aphrodisiacActive: normalized.includes('trait_aphrodisiac'),
    unyieldingUsed: false,
    firstStrikeActive: normalized.includes('trait_first_strike'),
    sealedSkillId: null,
    adaptationSkillId: null,
    adaptationUses: 0,
  };
}

export function getTraits(ids: string[]): EnemyTraitDefinition[] {
  return [...new Set(ids)].map(id => TRAITS_BY_ID[id]).filter(Boolean);
}

export function getTraitModifiers(ids: string[]): TraitModifiers {
  const result: TraitModifiers = {};
  for (const trait of getTraits(ids)) {
    for (const key of Object.keys(trait.modifiers || {}) as (keyof TraitModifiers)[])
      result[key] = (result[key] || 0) + (trait.modifiers?.[key] || 0);
  }
  return result;
}

export function applyTraitModifiersToEnemyBase<T extends Record<string, number>>(base: T, ids: string[]): T {
  const modifiers = getTraitModifiers(ids);
  const next = { ...base };
  const multiply = (key: keyof T, amount?: number) => {
    if (typeof amount === 'number')
      (next as Record<string, number>)[String(key)] = Math.round(next[key] * (1 + amount));
  };
  multiply('\u5bf9\u624b\u6027\u6597\u529b' as keyof T, modifiers.sexPowerMultiplier);
  multiply('\u5bf9\u624b\u5fcd\u8010\u529b' as keyof T, modifiers.enduranceMultiplier);
  multiply('\u5bf9\u624b\u8010\u529b' as keyof T, modifiers.enduranceMultiplier);
  multiply('\u5bf9\u624b\u6700\u5927\u8010\u529b' as keyof T, modifiers.maxEnduranceMultiplier);
  multiply('\u5bf9\u624b\u6700\u5927\u5feb\u611f' as keyof T, modifiers.maxPleasureMultiplier);
  multiply('\u5bf9\u624b\u9b45\u529b' as keyof T, modifiers.charmMultiplier);
  multiply('\u5bf9\u624b\u5e78\u8fd0' as keyof T, modifiers.luckMultiplier);
  if (typeof modifiers.evasionFlat === 'number')
    (next as Record<string, number>)['\u5bf9\u624b\u95ea\u907f\u7387'] = Math.max(
      0,
      (next as Record<string, number>)['\u5bf9\u624b\u95ea\u907f\u7387'] + modifiers.evasionFlat,
    );
  if (typeof modifiers.critFlat === 'number')
    (next as Record<string, number>)['\u5bf9\u624b\u66b4\u51fb\u7387'] = Math.min(
      100,
      Math.max(0, (next as Record<string, number>)['\u5bf9\u624b\u66b4\u51fb\u7387'] + modifiers.critFlat),
    );
  return next;
}

export function getTraitCountForDifficulty(difficulty: string): number {
  if (difficulty === '\u4f5c\u5f0a') return 3;
  // “抖M”是当前 UI 使用的难度名；保留“梦魇”以兼容旧存档。
  if (difficulty === '抖M' || difficulty === '\u68a6\u9b47') return 2;
  if (difficulty === '\u56f0\u96be') return 1;
  return 0;
}

const TRAIT_RARITY_WEIGHTS: Record<string, Record<TraitRarity, number>> = {
  困难: { B: 50, A: 35, S: 15 },
  抖M: { B: 40, A: 35, S: 25 },
  作弊: { B: 30, A: 35, S: 35 },
};

function weightedPick<T>(items: T[], random: () => number, weight: (item: T) => number): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
  if (total <= 0) return items[Math.min(items.length - 1, Math.floor(random() * items.length))] ?? null;
  let cursor = random() * total;
  for (const item of items) {
    cursor -= Math.max(0, weight(item));
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

export function drawEnemyTraits(difficulty: string, random: () => number = Math.random): string[] {
  const selected: EnemyTraitDefinition[] = [];
  let pool = [...TRAIT_DEFINITIONS];
  const rarityWeights = TRAIT_RARITY_WEIGHTS[difficulty] ?? TRAIT_RARITY_WEIGHTS.困难;
  while (selected.length < getTraitCountForDifficulty(difficulty) && pool.length > 0) {
    const availableRarities = (['B', 'A', 'S'] as TraitRarity[]).filter(rarity =>
      pool.some(item => item.rarity === rarity),
    );
    const pickedRarity = weightedPick(availableRarities, random, rarity => rarityWeights[rarity]);
    const rarityPool = pickedRarity ? pool.filter(item => item.rarity === pickedRarity) : pool;
    const picked = weightedPick(rarityPool, random, () => 1);
    if (!picked) break;
    selected.push(picked);
    pool = pool.filter(
      item =>
        item.id !== picked.id &&
        !(RULE_CHANGING_TRAITS.has(item.id) && selected.some(trait => RULE_CHANGING_TRAITS.has(trait.id))),
    );
  }
  return selected.map(trait => trait.id);
}

export function hasTrait(ids: string[], id: string): boolean {
  return ids.includes(id);
}
