import { createTraitRuntimeState, type EnemyTraitRuntimeState } from './traitSystem';

export const CHAT_ENEMY_TRAITS_KEY = '性斗学园敌人词条记录';

export interface PersistedEnemyTraitProfile {
  traitIds: string[];
  runtime?: Partial<EnemyTraitRuntimeState>;
}

type TraitMap = Record<string, PersistedEnemyTraitProfile>;

function readChatVariables(): Record<string, any> {
  try {
    const api = (window as any).TavernHelper ?? (window as any);
    return typeof api.getVariables === 'function' ? api.getVariables({ type: 'chat' }) || {} : {};
  } catch (error) {
    console.warn('[敌人词条] 读取持久化数据失败', error);
    return {};
  }
}

function readMap(): TraitMap {
  const raw = readChatVariables()[CHAT_ENEMY_TRAITS_KEY];
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

function writeMap(map: TraitMap): boolean {
  try {
    const api = (window as any).TavernHelper ?? (window as any);
    if (typeof api.insertOrAssignVariables !== 'function') return false;
    api.insertOrAssignVariables({ [CHAT_ENEMY_TRAITS_KEY]: map }, { type: 'chat' });
    return true;
  } catch (error) {
    console.warn('[敌人词条] 写入持久化数据失败', error);
    return false;
  }
}

export function getEnemyTraitProfile(enemyKey: string): PersistedEnemyTraitProfile | null {
  const profile = readMap()[enemyKey];
  if (!profile || !Array.isArray(profile.traitIds)) return null;
  return { traitIds: [...new Set(profile.traitIds.filter(id => typeof id === 'string'))], runtime: profile.runtime };
}

export function saveEnemyTraitProfile(enemyKey: string, profile: PersistedEnemyTraitProfile): boolean {
  const map = readMap();
  map[enemyKey] = {
    traitIds: [...new Set(profile.traitIds)],
    runtime: profile.runtime,
  };
  return writeMap(map);
}

export function clearEnemyTraitProfiles(): boolean {
  return writeMap({});
}

export function getOrCreateEnemyTraitRuntime(enemyKey: string, traitIds: string[]): EnemyTraitRuntimeState {
  const profile = getEnemyTraitProfile(enemyKey);
  // 词条 ID 跨遭遇持久化；运行态（封印技能、首次高潮等）只属于当前战斗。
  // 阶段切换沿用同一个 Vue runtime，因此不会重置这些一次性状态。
  // 旧版本可能留下 traitIds: []，此时应使用本次迁移后传入的抽取结果。
  const effectiveTraitIds = profile?.traitIds.length ? profile.traitIds : traitIds;
  return createTraitRuntimeState(effectiveTraitIds);
}

export function saveEnemyTraitRuntime(enemyKey: string, state: EnemyTraitRuntimeState): boolean {
  return saveEnemyTraitProfile(enemyKey, { traitIds: state.ids, runtime: state });
}
