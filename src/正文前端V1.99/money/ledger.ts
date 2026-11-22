import { AMAMI_STATE_KEY, getAmamiState, readAmamiState } from '../state/model';
import { inheritAmamiState } from '../state/persistence';
import { MONEY_FIELD, LEGACY_MONEY_FIELDS, readMoneySnapshot, syncMoneySnapshot } from './currency';
export { MONEY_FIELD } from './currency';
import {
  collectMoneyTasks,
  completedTaskNames,
  completionIncludes,
  readTaskMoneyReward,
  taskIsComplete,
  type MoneyTaskKind,
} from './tasks';

export const MONEY_STATE_KEY = 'money';
export type MoneyIncome = 'experience' | 'redemption' | 'sales' | 'lottery' | 'envelope' | 'loans' | MoneyTaskKind;
export type MoneyExpense = 'shopping' | 'lottery' | 'skills' | 'battle' | 'bankPrincipal' | 'bankInterest';
export type MoneyData = { stat_data: Record<string, any>; [key: string]: any };
export interface TaskMoneyRecord {
  name: string;
  kind: MoneyTaskKind;
  amount: number | null;
  paid: boolean;
}
export interface MoneyState {
  version: 1;
  starting: number;
  totalIncome: number;
  totalEarned: number;
  totalSpent: number;
  income: Partial<Record<MoneyIncome, number>>;
  expense: Partial<Record<MoneyExpense, number>>;
  tasks: Record<string, TaskMoneyRecord>;
}
export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const amountOf = (value: unknown) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
export function readMoneyState(data?: MoneyData): MoneyState | undefined {
  const state = readAmamiState(data)?.money;
  return state?.version === 1 ? state : undefined;
}
export function moneyBalance(state: MoneyState) {
  return roundMoney(
    state.starting +
      Object.values(state.income).reduce((a, b) => a + b, 0) -
      Object.values(state.expense).reduce((a, b) => a + b, 0),
  );
}
function syncBalance(data: MoneyData, state: MoneyState) {
  state.totalIncome = roundMoney(Object.values(state.income).reduce((a, b) => a + b, 0));
  state.totalEarned = roundMoney(state.totalIncome - (state.income.loans ?? 0));
  state.totalSpent = roundMoney(Object.values(state.expense).reduce((a, b) => a + b, 0));
  syncMoneySnapshot(data, moneyBalance(state));
}
function createMoneyState(data: MoneyData): MoneyState {
  const items = data.stat_data.物品系统 ?? {};
  const state: MoneyState = {
    version: 1,
    starting: roundMoney(readMoneySnapshot(items)),
    totalIncome: 0,
    totalEarned: 0,
    totalSpent: 0,
    income: {},
    expense: {},
    tasks: {},
  };
  const completed = completedTaskNames(data.stat_data);
  for (const task of collectMoneyTasks(data.stat_data)) {
    state.tasks[task.key] = {
      name: task.name,
      kind: task.kind,
      amount: readTaskMoneyReward(task.value),
      paid: taskIsComplete(task.value) || completionIncludes(completed, task.name),
    };
  }
  for (const name of completed) state.tasks['name:' + name] ??= { name, kind: 'freeTasks', amount: null, paid: true };
  return state;
}
export function ensureMoney(data: MoneyData, previous?: MoneyData): MoneyState {
  inheritAmamiState(data, previous);
  let state = readMoneyState(data);
  if (!state) {
    state = readMoneyState(previous)
      ? structuredClone(readMoneyState(previous)!)
      : createMoneyState(previous?.stat_data ? previous : data);
    getAmamiState(data).money = state;
  }
  syncBalance(data, state);
  return state;
}
export function getMoneyBalance(data: MoneyData): number {
  return moneyBalance(ensureMoney(data));
}
export function creditMoney(data: MoneyData, value: number, source: MoneyIncome): number {
  const state = ensureMoney(data);
  const amount = roundMoney(amountOf(value));
  state.income[source] = roundMoney((state.income[source] ?? 0) + amount);
  syncBalance(data, state);
  return amount;
}
/** 扣实际持有额；整笔付款仍沿用调用方原有的余额判断。 */
export function debitMoney(data: MoneyData, value: number, source: MoneyExpense): number {
  const state = ensureMoney(data);
  const amount = roundMoney(Math.min(amountOf(value), Math.max(0, moneyBalance(state))));
  state.expense[source] = roundMoney((state.expense[source] ?? 0) + amount);
  syncBalance(data, state);
  return amount;
}
export function settleMoney(data: MoneyData, previous?: MoneyData): boolean {
  if (!data?.stat_data) return false;
  const snapshot = () =>
    JSON.stringify([
      data[AMAMI_STATE_KEY],
      ...[MONEY_FIELD, ...LEGACY_MONEY_FIELDS].map(key => data.stat_data.物品系统?.[key]),
      data.schema?.properties?.物品系统?.properties,
    ]);
  const before = snapshot();
  const state = ensureMoney(data, previous);
  const completed = completedTaskNames(data.stat_data);
  for (const task of collectMoneyTasks(data.stat_data)) {
    const record = (state.tasks[task.key] ??= {
      name: task.name,
      kind: task.kind,
      amount: readTaskMoneyReward(task.value),
      paid: false,
    });
    // 未识别的旧文案允许后来补出确定金额；一旦识别，金额锁定。
    if (record.amount === null && !record.paid) record.amount = readTaskMoneyReward(task.value);
    if (
      !record.paid &&
      record.amount !== null &&
      (taskIsComplete(task.value) || completionIncludes(completed, task.name))
    ) {
      creditMoney(data, record.amount, record.kind);
      record.paid = true;
    }
  }
  // 完成时移出任务列表、只追加完成记录的旧输出也能结算。
  for (const record of Object.values(state.tasks)) {
    if (!record.paid && record.amount !== null && completionIncludes(completed, record.name)) {
      creditMoney(data, record.amount, record.kind);
      record.paid = true;
    }
  }
  syncBalance(data, state);
  return before !== snapshot();
}

/** 战斗只提交自身收支差额，保留期间的银行与商店交易。 */
export function mergeMoneyChanges(target: MoneyData, next: MoneyData, previous: MoneyData): boolean {
  const current = ensureMoney(target);
  const before = readMoneyState(previous);
  const after = readMoneyState(next);
  if (!after || JSON.stringify(after) === JSON.stringify(before)) return false;
  if (JSON.stringify(current) === JSON.stringify(after)) {
    syncBalance(target, current);
    return false;
  }
  const duplicateTaskIncome: Record<string, number> = {};
  for (const [key, record] of Object.entries(after.tasks)) {
    if (record.paid && !before?.tasks[key]?.paid && current.tasks[key]?.paid && record.amount !== null) {
      duplicateTaskIncome[record.kind] = (duplicateTaskIncome[record.kind] ?? 0) + record.amount;
    }
  }
  let changed = false;
  for (const key of ['income', 'expense'] as const) {
    for (const [source, value] of Object.entries(after[key])) {
      const delta = Math.max(
        0,
        roundMoney(
          value -
            Number((before?.[key] as Record<string, number> | undefined)?.[source] ?? 0) -
            (key === 'income' ? (duplicateTaskIncome[source] ?? 0) : 0),
        ),
      );
      if (!delta) continue;
      const totals = current[key] as Record<string, number>;
      totals[source] = roundMoney((totals[source] ?? 0) + delta);
      changed = true;
    }
  }
  for (const [key, record] of Object.entries(after.tasks)) {
    if (JSON.stringify(record) === JSON.stringify(before?.tasks[key])) continue;
    if (!current.tasks[key]?.paid) current.tasks[key] = structuredClone(record);
  }
  syncBalance(target, current);
  return changed;
}
