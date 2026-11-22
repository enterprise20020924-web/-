export interface BonusStats {
  魅力加成: number;
  幸运加成: number;
  基础性斗力加成: number;
  基础性斗力成算: number;
  基础忍耐力加成: number;
  基础忍耐力成算: number;
  闪避率加成: number;
  暴击率加成: number;
}

export interface BaseAttributes {
  charm: number;
  luck: number;
  evasion: number;
  crit: number;
}

export interface DerivedCombatStats extends BaseAttributes {
  sexPower: number;
  endurance: number;
}

export interface DerivedCombatStatsInput {
  level: number;
  potential: number;
  baseAttributes: BaseAttributes;
  bonusSources?: Array<Partial<BonusStats> | undefined | null>;
  postOrgasm?: boolean;
  exhausted?: boolean;
}

export const BONUS_KEYS = [
  '魅力加成',
  '幸运加成',
  '基础性斗力加成',
  '基础性斗力成算',
  '基础忍耐力加成',
  '基础忍耐力成算',
  '闪避率加成',
  '暴击率加成',
] as const satisfies readonly (keyof BonusStats)[];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createEmptyBonusStats(): BonusStats {
  return {
    魅力加成: 0,
    幸运加成: 0,
    基础性斗力加成: 0,
    基础性斗力成算: 0,
    基础忍耐力加成: 0,
    基础忍耐力成算: 0,
    闪避率加成: 0,
    暴击率加成: 0,
  };
}

export function normalizeBonusStats(input: unknown): BonusStats {
  const result = createEmptyBonusStats();
  if (!input || typeof input !== 'object') {
    return result;
  }

  const source = input as Record<string, unknown>;
  for (const key of BONUS_KEYS) {
    const value = Number(source[key]);
    result[key] = Number.isFinite(value) ? value : 0;
  }
  return result;
}

export function mergeBonusStats(...sources: Array<Partial<BonusStats> | undefined | null>): BonusStats {
  const result = createEmptyBonusStats();
  for (const source of sources) {
    if (!source) continue;
    for (const key of BONUS_KEYS) {
      const value = Number(source[key]);
      if (Number.isFinite(value)) {
        result[key] += value;
      }
    }
  }
  return result;
}

export function hasAnyBonus(input: Partial<BonusStats> | undefined | null): boolean {
  if (!input) return false;
  return BONUS_KEYS.some(key => Number(input[key] || 0) !== 0);
}

export function calcEvasionWithDiminishingReturns(rawEvasion: number): number {
  const normalCap = 60;
  const hardCap = 70;
  const diminishingRatio = 5;
  const safeRaw = Math.max(0, Number(rawEvasion) || 0);

  if (safeRaw <= normalCap) {
    return safeRaw;
  }

  return Math.min(hardCap, normalCap + (safeRaw - normalCap) / diminishingRatio);
}

export function calculateBasePower(level: number, potential: number): number {
  return Math.max(0, Number(level) || 0) * Math.max(0, Number(potential) || 0);
}

export function calculatePowerWithBonus(baseValue: number, flatBonus: number, multiplierPercent: number): number {
  return Math.max(0, Math.round((baseValue + flatBonus) * (1 + multiplierPercent / 100)));
}

export function calculateDerivedCombatStats(input: DerivedCombatStatsInput): DerivedCombatStats {
  const bonuses = mergeBonusStats(...(input.bonusSources || []));
  const basePower = calculateBasePower(input.level, input.potential);

  let sexPower = calculatePowerWithBonus(basePower, bonuses.基础性斗力加成, bonuses.基础性斗力成算);
  let endurance = calculatePowerWithBonus(basePower, bonuses.基础忍耐力加成, bonuses.基础忍耐力成算);

  if (input.postOrgasm) {
    sexPower = Math.max(0, Math.floor(sexPower * 0.8));
    endurance = Math.max(0, Math.floor(endurance * 1.1));
  }

  if (input.exhausted) {
    endurance = Math.max(0, Math.floor(endurance * 0.7));
  }

  return {
    charm: Math.max(0, input.baseAttributes.charm + bonuses.魅力加成),
    luck: Math.max(0, input.baseAttributes.luck + bonuses.幸运加成),
    evasion: calcEvasionWithDiminishingReturns(input.baseAttributes.evasion + bonuses.闪避率加成),
    crit: clamp(input.baseAttributes.crit + bonuses.暴击率加成, 0, 100),
    sexPower,
    endurance,
  };
}
