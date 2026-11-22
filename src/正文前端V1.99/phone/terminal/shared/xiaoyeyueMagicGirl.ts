import { BONUS_KEYS, BonusStats, clamp, createEmptyBonusStats, normalizeBonusStats } from './combatMath';

export const XIAOYEYUE_MAGIC_GIRL_REQUIRED_NAME = '小夜月静夜';
export const XIAOYEYUE_LIGHT_DARK_CONSTITUTION_ID = 'c_xiaoyeyue_light_dark_magic_girl';
export const XIAOYEYUE_LIGHT_DARK_CONSTITUTION_NAME = '光与暗交融的魔法少女';

const LIGHT_DARK_DYNAMIC_BONUS_KEYS = ['基础性斗力成算', '基础忍耐力成算'] as const;

type StatusEntryWithBonus = {
  加成?: Partial<BonusStats>;
  描述?: string;
};

function normalizeStatusName(name: string): string {
  return name.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
}

export function isXiaoyeyueLightDarkConstitutionStatusName(name: string): boolean {
  return normalizeStatusName(name) === normalizeStatusName(XIAOYEYUE_LIGHT_DARK_CONSTITUTION_NAME);
}

function getPermanentStatusList(statData: any): Record<string, any> | null {
  const statusList = statData?.永久状态?.状态列表;
  if (!statusList || typeof statusList !== 'object' || Array.isArray(statusList)) {
    return null;
  }
  return statusList;
}

export function getXiaoyeyueLightDarkStatusEntry(
  statusList: unknown,
): { name: string; entry: StatusEntryWithBonus } | null {
  if (!statusList || typeof statusList !== 'object' || Array.isArray(statusList)) {
    return null;
  }

  for (const [name, entry] of Object.entries(statusList as Record<string, any>)) {
    if (isXiaoyeyueLightDarkConstitutionStatusName(name)) {
      return {
        name,
        entry: entry && typeof entry === 'object' ? (entry as StatusEntryWithBonus) : {},
      };
    }
  }

  return null;
}

export function calculateXiaoyeyueLightDarkBonus(corruptionInput: unknown): BonusStats {
  const bonus = createEmptyBonusStats();
  const rawCorruption = Number(corruptionInput);
  const corruption = clamp(Number.isFinite(rawCorruption) ? rawCorruption : 0, 0, 100);

  if (corruption <= 50) {
    bonus.基础忍耐力成算 = Math.max(0, Math.round(100 - corruption * 2));
    return bonus;
  }

  bonus.基础性斗力成算 = Math.min(100, Math.max(1, Math.round(1 + ((corruption - 51) / 49) * 99)));
  return bonus;
}

export function getXiaoyeyueLightDarkDynamicBonusCorrection(statData: any, statusListInput?: unknown): BonusStats {
  const statusList = statusListInput ?? getPermanentStatusList(statData);
  const match = getXiaoyeyueLightDarkStatusEntry(statusList);
  if (!match) {
    return createEmptyBonusStats();
  }

  const desiredBonus = calculateXiaoyeyueLightDarkBonus(statData?.核心状态?.堕落度 ?? 0);
  const embeddedBonus = normalizeBonusStats(match.entry.加成);
  const correction = createEmptyBonusStats();

  for (const key of LIGHT_DARK_DYNAMIC_BONUS_KEYS) {
    correction[key] = desiredBonus[key] - embeddedBonus[key];
  }

  return correction;
}

export function syncXiaoyeyueLightDarkStatusBonus(statData: any): boolean {
  const statusList = getPermanentStatusList(statData);
  const match = getXiaoyeyueLightDarkStatusEntry(statusList);
  if (!statusList || !match) {
    return false;
  }

  const currentBonus = normalizeBonusStats(match.entry.加成);
  const desiredDynamicBonus = calculateXiaoyeyueLightDarkBonus(statData?.核心状态?.堕落度 ?? 0);
  const nextBonus: BonusStats = {
    ...currentBonus,
    基础性斗力成算: desiredDynamicBonus.基础性斗力成算,
    基础忍耐力成算: desiredDynamicBonus.基础忍耐力成算,
  };

  const changed = BONUS_KEYS.some(key => currentBonus[key] !== nextBonus[key]);
  if (!changed) {
    return false;
  }

  statusList[match.name] = {
    ...match.entry,
    加成: nextBonus,
  };
  return true;
}
