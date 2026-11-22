import {
  BONUS_KEYS,
  BonusStats,
  createEmptyBonusStats,
  hasAnyBonus,
  mergeBonusStats,
  normalizeBonusStats,
} from './combatMath';

export interface TimedStatusEffect {
  加成?: Partial<BonusStats>;
  剩余回合?: number;
  描述?: string;
  资源变化?: {
    快感?: number;
    耐力?: number;
    是否为百分比?: boolean;
  };
  特殊效果?: {
    类型?: string;
    效果值?: number;
    是否为百分比?: boolean;
  };
}

export interface PermanentStatusEffect {
  加成?: Partial<BonusStats>;
  描述?: string;
  资源变化?: {
    快感?: number;
    耐力?: number;
    是否为百分比?: boolean;
  };
  特殊效果?: {
    类型?: string;
    效果值?: number;
    是否为百分比?: boolean;
  };
}

export type StatusEntry = TimedStatusEffect | PermanentStatusEffect | number;
export type StatusList = Record<string, StatusEntry>;

export interface TickStatusResult {
  状态列表: Record<string, TimedStatusEffect>;
  过期状态: string[];
}

function getEntryBonus(entry: StatusEntry): BonusStats {
  if (!entry || typeof entry !== 'object') {
    return createEmptyBonusStats();
  }
  return normalizeBonusStats((entry as TimedStatusEffect).加成);
}

export function calculateBonusFromStatusList(statusList: StatusList | undefined | null): BonusStats {
  if (!statusList || typeof statusList !== 'object') {
    return createEmptyBonusStats();
  }

  const bonuses: BonusStats[] = [];
  for (const entry of Object.values(statusList)) {
    const bonus = getEntryBonus(entry);
    if (hasAnyBonus(bonus)) {
      bonuses.push(bonus);
    }
  }
  return mergeBonusStats(...bonuses);
}

export function normalizeTimedStatusList(statusList: StatusList | undefined | null): Record<string, TimedStatusEffect> {
  if (!statusList || typeof statusList !== 'object') {
    return {};
  }

  const normalized: Record<string, TimedStatusEffect> = {};
  for (const [name, entry] of Object.entries(statusList)) {
    if (typeof entry === 'number') {
      normalized[name] = { 剩余回合: Math.max(0, entry), 加成: createEmptyBonusStats() };
      continue;
    }

    if (!entry || typeof entry !== 'object') {
      continue;
    }

    normalized[name] = {
      加成: normalizeBonusStats((entry as TimedStatusEffect).加成),
      剩余回合: Math.max(0, Number((entry as TimedStatusEffect).剩余回合) || 0),
      描述: (entry as TimedStatusEffect).描述 || '',
      资源变化:
        (entry as TimedStatusEffect).资源变化 && typeof (entry as TimedStatusEffect).资源变化 === 'object'
          ? {
              快感: Number((entry as TimedStatusEffect).资源变化?.快感) || 0,
              耐力: Number((entry as TimedStatusEffect).资源变化?.耐力) || 0,
              是否为百分比: Boolean((entry as TimedStatusEffect).资源变化?.是否为百分比),
            }
          : undefined,
      特殊效果:
        (entry as TimedStatusEffect).特殊效果 && typeof (entry as TimedStatusEffect).特殊效果 === 'object'
          ? {
              类型: (entry as TimedStatusEffect).特殊效果?.类型 || '',
              效果值: Number((entry as TimedStatusEffect).特殊效果?.效果值) || 0,
              是否为百分比: Boolean((entry as TimedStatusEffect).特殊效果?.是否为百分比),
            }
          : undefined,
    };
  }

  return normalized;
}

export function tickStatusList(statusList: StatusList | undefined | null): TickStatusResult {
  const normalized = normalizeTimedStatusList(statusList);
  const nextStatusList: Record<string, TimedStatusEffect> = {};
  const expired: string[] = [];

  for (const [name, entry] of Object.entries(normalized)) {
    const remainingTurns = Math.max(0, Number(entry.剩余回合) || 0) - 1;
    if (remainingTurns > 0) {
      nextStatusList[name] = { ...entry, 剩余回合: remainingTurns };
    } else {
      expired.push(name);
    }
  }

  return {
    状态列表: nextStatusList,
    过期状态: expired,
  };
}

export function upsertStatusEffect(
  statusList: StatusList | undefined | null,
  name: string,
  effect: TimedStatusEffect,
): Record<string, TimedStatusEffect> {
  const normalized = normalizeTimedStatusList(statusList);
  normalized[name] = {
    加成: normalizeBonusStats(effect.加成),
    剩余回合: Math.max(0, Number(effect.剩余回合) || 0),
    描述: effect.描述 || '',
    资源变化: effect.资源变化,
    特殊效果: effect.特殊效果,
  };
  return normalized;
}

export function removeStatusEffect(
  statusList: StatusList | undefined | null,
  name: string,
): Record<string, TimedStatusEffect> {
  const normalized = normalizeTimedStatusList(statusList);
  delete normalized[name];
  return normalized;
}

export function pickNonZeroBonus(input: Partial<BonusStats> | undefined | null): Partial<BonusStats> {
  const normalized = normalizeBonusStats(input);
  const output: Partial<BonusStats> = {};
  for (const key of BONUS_KEYS) {
    if (normalized[key] !== 0) {
      output[key] = normalized[key];
    }
  }
  return output;
}
