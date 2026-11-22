import { CURRENCY_NAME, formatCurrencyText } from './currency';
export type MoneyTaskKind = 'freeTasks' | 'fixedTasks';
export interface MoneyTask {
  key: string;
  name: string;
  kind: MoneyTaskKind;
  group: 'main' | 'side' | 'free';
  value: Record<string, any>;
}
const digits: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};
const units: Record<string, number> = { 十: 10, 百: 100, 千: 1000, 万: 10000, 亿: 100000000 };
const roundMoney = (value: number) => Math.round(value * 100) / 100;
export function parseMoneyNumber(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) && input >= 0 ? roundMoney(input) : null;
  const text = String(input ?? '')
    .normalize('NFKC')
    .replace(/[,，\s]/g, '');
  const arabic = text.match(/^(\d+(?:\.\d+)?)([千万亿kKwW]?)$/);
  if (arabic)
    return roundMoney(
      Number(arabic[1]) *
        ({ 千: 1000, k: 1000, K: 1000, 万: 10000, w: 10000, W: 10000, 亿: 100000000 }[arabic[2]] ?? 1),
    );
  if (!/^[零〇一二两三四五六七八九十百千万亿]+$/.test(text)) return null;
  let result = 0,
    section = 0,
    digit = 0;
  for (const char of text) {
    if (char in digits) digit = digits[char];
    else if (units[char] < 10000) {
      section += (digit || 1) * units[char];
      digit = 0;
    } else {
      result += (section + digit) * units[char];
      section = 0;
      digit = 0;
    }
  }
  return result + section + digit;
}

/** 兼容旧奖励说明；区间、任选和未确定数额保留为待识别，不猜金额。 */
export function readTaskMoneyReward(task: Record<string, any>): number | null {
  for (const value of [
    task.天海信用点奖励,
    task.信用点奖励,
    task.奖励信用点,
    task.金币奖励,
    task.奖励金币,
    task.奖励金额,
  ]) {
    const parsed = parseMoneyNumber(value);
    if (parsed !== null) return parsed;
  }
  const reward = task.奖励 ?? task.奖励说明;
  if (reward && typeof reward === 'object' && !Array.isArray(reward)) {
    for (const key of [
      '天海信用点',
      '_天海信用点',
      '信用点',
      '天海信用点奖励',
      '信用点奖励',
      '金币',
      '学园金币',
      '_学园金币',
      '校园金币',
      '金币奖励',
    ]) {
      const parsed = parseMoneyNumber(reward[key]);
      if (parsed !== null) return parsed;
    }
    return readTaskMoneyReward({ 奖励: reward.说明 ?? reward.描述 ?? '' });
  }
  const clauses = String(reward ?? '')
    .normalize('NFKC')
    .replace(/(\d),(?=\d{3}(?:\D|$))/g, '$1')
    .split(/[,，;；、\n]/)
    .filter(clause => /信用点|金币|学园币|校园币/.test(clause));
  const text = clauses.join('；');
  if (
    !text ||
    /任选|二选一|三选一|或(?:者)?|随机\s*(?:天海信用点|信用点|(?:学园|校园)?金币|学园币|校园币)|(?:信用点|金币)\s*[:：]?\s*随机|至少|至多|最多|不超过/.test(
      text,
    )
  )
    return null;
  const token = '(?:(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?(?:[千万亿kKwW])?|[零〇一二两三四五六七八九十百千万亿]+)';
  if (new RegExp(token + '\\s*(?:~|～|至|到|-|—)\\s*' + token).test(text)) return null;
  const currency = '(?:天海信用点|信用点|(?:学园|校园)?金币|学园币|校园币)';
  if (new RegExp('(?:扣除|支付|消耗|罚款|花费)\\s*' + currency).test(text)) return null;
  if (new RegExp('(?:-|负|扣除|支付|消耗|罚款|花费)\\s*' + token + '\\s*(?:枚|个)?\\s*' + currency).test(text))
    return null;
  const matches = [
    ...text.matchAll(
      new RegExp(
        currency + '\\s*(?:奖励)?\\s*[:：+＋×xX=]?\\s*(' + token + ')|(' + token + ')\\s*(?:枚|个)?\\s*' + currency,
        'g',
      ),
    ),
  ];
  const values = matches
    .map(match => parseMoneyNumber(match[1] ?? match[2]))
    .filter((value): value is number => value !== null);
  return values.length && values.every(value => value === values[0]) ? values[0] : null;
}
export function taskNameKey(name: unknown) {
  return String(name ?? '')
    .normalize('NFKC')
    .replace(/[\s《》「」【】]/g, '')
    .trim();
}
export function isFixedMoneyTask(name: string, task: Record<string, any>) {
  return Boolean(task.固定任务ID) || task.来源 === '固定' || /[驱退]魔迷宫/.test(name);
}
export function collectMoneyTasks(statData: Record<string, any>): MoneyTask[] {
  const system = statData.任务系统 ?? {};
  const result: MoneyTask[] = [];
  const append = (name: string, value: unknown, group: MoneyTask['group']) => {
    if (!name || !value || typeof value !== 'object' || Array.isArray(value)) return;
    const task = value as Record<string, any>;
    const actualName = String(task.名称 || name);
    result.push({
      key: task.任务ID ? 'id:' + String(task.任务ID) : 'name:' + taskNameKey(actualName),
      name: actualName,
      value: task,
      group,
      kind: group !== 'free' && isFixedMoneyTask(actualName, task) ? 'fixedTasks' : 'freeTasks',
    });
  };
  append(system.主线任务?.名称 ?? '', system.主线任务, 'main');
  for (const [name, task] of Object.entries(system.支线任务 ?? {})) append(name, task, 'side');
  for (const [name, task] of Object.entries(system.自由任务 ?? {})) append(name, task, 'free');
  return [...new Map(result.map(task => [task.key, task])).values()];
}
export function taskIsComplete(task: Record<string, any>) {
  return ['已完成', '完成', '已领取', '已结算'].includes(String(task.状态 ?? ''));
}
export function completedTaskNames(statData: Record<string, any>): string[] {
  const records = statData.任务系统?.已完成记录;
  return Array.isArray(records)
    ? records.map(record => taskNameKey(typeof record === 'string' ? record : record?.名称)).filter(Boolean)
    : [];
}
export function completionIncludes(names: string[], name: string) {
  const key = taskNameKey(name);
  return names.some(record => record === key || record.startsWith(key + '(') || record.startsWith(key + ':'));
}
export function formatTaskReward(task: Record<string, any>): string {
  if (typeof task.奖励 === 'string' && task.奖励.trim()) return formatCurrencyText(task.奖励);
  if (typeof task.奖励说明 === 'string' && task.奖励说明.trim()) return formatCurrencyText(task.奖励说明);
  const amount = readTaskMoneyReward(task);
  return amount === null ? '' : amount.toLocaleString('zh-CN') + ' ' + CURRENCY_NAME;
}
