import { migrateTestSkillData } from './skillSaveMigration';
import { settleExperience } from '../../../progression/experience';
import { creditMoney, settleMoney, type MoneyIncome } from '../../../money/ledger';
import { hydrateMessageAmamiState } from '../../../state/persistence';
const LATEST_MESSAGE_OPTION: VariableOption = { type: 'message', message_id: 'latest' };
let latestMvuTransactionTail: Promise<void> = Promise.resolve();

/**
 * Serialize read-modify-write operations on the latest MVU data.
 *
 * Mvu.replaceMvuData replaces the complete data object. Running two mutations
 * concurrently therefore allows a later write based on an older snapshot to
 * overwrite the earlier mutation. Interactive mutations must use this helper.
 */
export async function runLatestMvuTransaction<T>(operationName: string, operation: () => T | Promise<T>): Promise<T> {
  const previousTransaction = latestMvuTransactionTail;
  const transaction = previousTransaction
    .catch(() => undefined)
    .then(async () => {
      const startedAt = performance.now();
      try {
        return await operation();
      } finally {
        const elapsed = Math.round(performance.now() - startedAt);
        if (elapsed >= 250) {
          console.info(`[性斗学园] MVU事务完成：${operationName}（${elapsed}ms）`);
        }
      }
    });

  latestMvuTransactionTail = transaction.then(
    () => undefined,
    () => undefined,
  );
  return transaction;
}

export const FORBIDDEN_MVU_PATHS = [
  '角色基础.$头像URL',
  '角色基础.段位积分',
  '核心状态._魅力',
  '核心状态._幸运',
  '核心状态._闪避率',
  '核心状态._暴击率',
  '核心状态.$基础性斗力',
  '核心状态.$基础忍耐力',
  '性斗系统.当前回合',
  '性斗系统.高潮次数',
  '性斗系统.战斗摘要',
  '性斗系统.实时性斗力',
  '性斗系统.实时忍耐力',
  '性斗系统.行动日志',
  '性斗系统.战斗物品',
  '性斗系统.对手耐力',
  '性斗系统.对手最大耐力',
  '性斗系统.对手快感',
  '性斗系统.对手最大快感',
  '性斗系统.对手高潮次数',
  '性斗系统.对手性斗力',
  '性斗系统.对手忍耐力',
  '性斗系统.对手魅力',
  '性斗系统.对手幸运',
  '性斗系统.对手闪避率',
  '性斗系统.对手暴击率',
  '性斗系统.对手实时性斗力',
  '性斗系统.对手实时忍耐力',
  '性斗系统.对手临时状态',
  '性斗系统.对手技能冷却',
  '性斗系统.对手可用技能',
  '性斗系统.$可用技能',
  '性斗系统.$技能冷却',
  '临时状态.加成统计',
  '临时状态.七宗罪状态',
  '永久状态.加成统计',
  '物品系统.装备总加成',
  '物品系统.已激活作弊码',
] as const;

function normalizePath(path: string): string {
  return path.replace(/^stat_data\./, '').replace(/\[(\d+)\]/g, '.$1');
}

function parsePath(path: string): string[] {
  return normalizePath(path).split('.').filter(Boolean);
}

export function getPath<T = any>(obj: any, path: string, defaultValue?: T): T {
  if (!obj || !path) return defaultValue as T;

  let result = obj;
  for (const key of parsePath(path)) {
    if (result == null) return defaultValue as T;
    result = result[key];
  }

  return result === undefined ? (defaultValue as T) : result;
}

export function setPath<T extends object>(obj: T, path: string, value: any): T {
  if (!obj || !path) return obj;

  const keys = parsePath(path);
  let current: any = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return obj;
}

export function unsetPath<T extends object>(obj: T, path: string): T {
  if (!obj || !path) return obj;

  const keys = parsePath(path);
  let current: any = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current?.[keys[i]];
    if (current == null || typeof current !== 'object') {
      return obj;
    }
  }

  if (current && typeof current === 'object') {
    delete current[keys[keys.length - 1]];
  }
  return obj;
}

export function isForbiddenMvuPath(path: string): boolean {
  const normalized = normalizePath(path);
  return FORBIDDEN_MVU_PATHS.some(forbidden => normalized === forbidden || normalized.startsWith(`${forbidden}.`));
}

export function sanitizeMvuData(mvuData: Mvu.MvuData): string[] {
  hydrateMessageAmamiState(mvuData);
  settleMoney(mvuData);
  settleExperience(mvuData);
  migrateTestSkillData(mvuData?.stat_data);
  const statData = mvuData?.stat_data;
  if (!statData) {
    return [];
  }

  const removedPaths: string[] = [];
  for (const path of FORBIDDEN_MVU_PATHS) {
    if (getPath(statData, path) !== undefined) {
      unsetPath(statData, path);
      removedPaths.push(path);
    }
  }

  if (removedPaths.length > 0) {
    console.warn(`[性斗学园] 已从 MVU 写回数据中移除废弃路径：${removedPaths.join(', ')}`);
  }

  return removedPaths;
}

export async function waitForMvu(): Promise<boolean> {
  const globalAny = window as any;
  if (typeof globalAny.waitGlobalInitialized === 'function') {
    try {
      await globalAny.waitGlobalInitialized('Mvu');
    } catch (error) {
      console.warn('[性斗学园] 等待 MVU 初始化失败:', error);
    }
  }

  if (typeof Mvu === 'undefined' || !Mvu) {
    console.warn('[性斗学园] MVU 变量框架未初始化');
    return false;
  }

  return true;
}

export async function getLatestMvuData(): Promise<Mvu.MvuData | null> {
  if (!(await waitForMvu())) {
    return null;
  }
  const data = Mvu.getMvuData(LATEST_MESSAGE_OPTION);
  hydrateMessageAmamiState(data);
  settleMoney(data);
  migrateTestSkillData(data?.stat_data);
  return data;
}

export async function getLatestStatData(): Promise<Record<string, any> | null> {
  const mvuData = await getLatestMvuData();
  return mvuData?.stat_data ?? null;
}

export async function grantMoneyWithUpdates(updates: Record<string, any>, amount: number, source: MoneyIncome) {
  return updateLatestMvuData(data => {
    for (const [path, value] of Object.entries(updates)) {
      if (!isForbiddenMvuPath(path)) setPath(data.stat_data, path, value);
    }
    creditMoney(data, amount, source);
  });
}

export async function replaceLatestMvuData(mvuData: Mvu.MvuData): Promise<void> {
  if (!(await waitForMvu())) {
    return;
  }
  sanitizeMvuData(mvuData);
  await Mvu.replaceMvuData(mvuData, LATEST_MESSAGE_OPTION);
}

export async function updateLatestMvuData(
  updater: (mvuData: Mvu.MvuData) => void | Promise<void>,
): Promise<Mvu.MvuData | null> {
  return runLatestMvuTransaction('通用数据更新', async () => {
    const mvuData = await getLatestMvuData();
    if (!mvuData) {
      return null;
    }

    if (!mvuData.stat_data) {
      mvuData.stat_data = {};
    }

    await updater(mvuData);
    await replaceLatestMvuData(mvuData);
    return mvuData;
  });
}

export async function updateLatestStatData(updates: Record<string, any>): Promise<void> {
  await runLatestMvuTransaction('通用状态更新', async () => {
    if (!(await waitForMvu())) {
      return;
    }

    const mvuData = await getLatestMvuData();
    if (!mvuData) {
      console.error('[性斗学园] 无法获取 MVU 数据');
      return;
    }

    if (!mvuData.stat_data) {
      mvuData.stat_data = {};
    }

    let hasAllowedUpdate = false;
    for (const [path, value] of Object.entries(updates)) {
      if (isForbiddenMvuPath(path)) {
        console.warn(`[性斗学园] 已阻止写入废弃 MVU 路径：${path}`);
        continue;
      }
      setPath(mvuData.stat_data, path, value);
      hasAllowedUpdate = true;
    }

    if (!hasAllowedUpdate) {
      return;
    }

    await replaceLatestMvuData(mvuData);
  });
}
