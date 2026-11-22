import { BONUS_KEYS, type BonusStats } from './combatMath';

const BASE_ATTRIBUTE_BY_BONUS: Record<keyof BonusStats, string> = {
  魅力加成: '_魅力',
  幸运加成: '_幸运',
  基础性斗力加成: '_性斗力加成',
  基础性斗力成算: '_性斗力成算',
  基础忍耐力加成: '_忍耐力加成',
  基础忍耐力成算: '_忍耐力成算',
  闪避率加成: '_闪避率',
  暴击率加成: '_暴击率',
};

export function addPermanentNumericBonuses(
  statData: Record<string, any>,
  bonus: Partial<BonusStats>,
  quantity = 1,
): void {
  if (!statData.基础属性 || typeof statData.基础属性 !== 'object') statData.基础属性 = {};
  for (const key of BONUS_KEYS) {
    const amount = Number(bonus[key]);
    if (!Number.isFinite(amount) || amount === 0) continue;
    const path = BASE_ATTRIBUTE_BY_BONUS[key];
    statData.基础属性[path] = (Number(statData.基础属性[path]) || 0) + amount * quantity;
  }
}

export function migrateLegacyPermanentNumericBonuses(statData: Record<string, any>): string[] {
  const statusList = statData?.永久状态?.状态列表;
  if (!statusList || typeof statusList !== 'object' || Array.isArray(statusList)) return [];

  const migrated: string[] = [];
  for (const [name, status] of Object.entries(statusList) as Array<[string, any]>) {
    if (!name.startsWith('商店永久加成_') && !name.startsWith('永久消耗品_')) continue;
    if (!status || typeof status !== 'object' || Object.keys(status).some(key => key !== '加成' && key !== '描述')) {
      continue;
    }
    const bonus = status.加成;
    if (!bonus || typeof bonus !== 'object' || Array.isArray(bonus)) continue;
    if (Object.keys(bonus).some(key => !BONUS_KEYS.includes(key as keyof BonusStats))) continue;
    if (BONUS_KEYS.some(key => bonus[key] !== undefined && !Number.isFinite(Number(bonus[key])))) continue;

    addPermanentNumericBonuses(statData, bonus);
    delete statusList[name];
    migrated.push(name);
  }
  return migrated;
}
