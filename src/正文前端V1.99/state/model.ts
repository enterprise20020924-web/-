import type { ExperienceState } from '../progression/experience';
import type { AttributeGrowthState } from '../progression/attribute-growth';
import type { MoneyState } from '../money/ledger';
import type { BankState } from '../bank/loan';
import type { IdentityMechanismState } from '../identity/mechanisms';

export const AMAMI_STATE_KEY = '_amamiState';
export const STATE_BRANCHES = ['experience', 'attributeGrowth', 'money', 'bank', 'identity', '什亭之匣'] as const;
export type StateChange = { path: string[]; value?: any; remove?: true };
export type StateDelta = { messageId: number; changes: StateChange[] };
export interface AmamiState {
  version: 1;
  experience?: ExperienceState;
  attributeGrowth?: AttributeGrowthState;
  money?: MoneyState;
  bank?: BankState;
  identity?: IdentityMechanismState;
  什亭之匣?: boolean;
  /** 仅兼容旧版已经删掉成长明细的楼层。 */
  progressionPruned?: 1;
  delta?: StateDelta;
}

const LEGACY_BRANCHES = {
  _amamiExperience: 'experience',
  _amamiAttributeGrowth: 'attributeGrowth',
  _amamiMoney: 'money',
  _amamiBank: 'bank',
  _amamiProgressionPruned: 'progressionPruned',
} as const;
const LEGACY_DELTA_KEY = '_amamiEconomyDelta';

/** 新分支优先；旧值只搬迁一次，写回后不再保留平行根字段。 */
export function migrateAmamiState(data: Record<string, any>): boolean {
  let changed = false;
  // 羁绊值只读当前 MVU，清理旧版重复保存的数值与达标记录。
  const identity = data[AMAMI_STATE_KEY]?.identity;
  if (identity?.meters?.bond) {
    delete identity.meters.bond;
    if (Object.keys(identity.meters).length === 0) delete identity.meters;
    changed = true;
  }
  for (const [oldKey, branch] of Object.entries(LEGACY_BRANCHES)) {
    if (!Object.hasOwn(data, oldKey)) continue;
    const state = (data[AMAMI_STATE_KEY] ??= { version: 1 });
    state[branch] ??= data[oldKey];
    delete data[oldKey];
    changed = true;
  }
  if (data[LEGACY_DELTA_KEY]) {
    const state = (data[AMAMI_STATE_KEY] ??= { version: 1 });
    const old = data[LEGACY_DELTA_KEY];
    state.delta ??= {
      messageId: old.messageId,
      changes: old.changes.map((change: StateChange) => ({
        ...change,
        path: [
          LEGACY_BRANCHES[change.path[0] as keyof typeof LEGACY_BRANCHES] ?? change.path[0],
          ...change.path.slice(1),
        ],
      })),
    } satisfies StateDelta;
    delete data[LEGACY_DELTA_KEY];
    changed = true;
  }
  return changed;
}

export function readAmamiState(data?: Record<string, any>): AmamiState | undefined {
  if (!data) return undefined;
  migrateAmamiState(data);
  return data[AMAMI_STATE_KEY];
}

export function getAmamiState(data: Record<string, any>): AmamiState {
  return readAmamiState(data) ?? (data[AMAMI_STATE_KEY] = { version: 1 });
}
