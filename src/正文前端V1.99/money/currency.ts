export const CURRENCY_NAME = '天海信用点';
export const MONEY_FIELD = '_天海信用点';
export const LEGACY_MONEY_FIELDS = [
  '天海信用点',
  '_学园金币',
  '学园金币',
  '校园金币',
  '学园币',
  '校园币',
  '金币',
] as const;

/** 旧余额按优先级迁移，不把多个别名相加；显式的零余额也有效。 */
export function readMoneySnapshot(items: Record<string, any>): number {
  const value = [MONEY_FIELD, ...LEGACY_MONEY_FIELDS].map(key => items[key]).find(value => value != null);
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
}

export function syncMoneySnapshot(data: Record<string, any>, balance: number): void {
  const items = (data.stat_data.物品系统 ??= {});
  items[MONEY_FIELD] = balance;
  for (const key of LEGACY_MONEY_FIELDS) delete items[key];
  // MVU 的动态字段结构也同步改名，旧 ZOD 运行时的输出可在结算后再次归一。
  const properties = data.schema?.properties?.物品系统?.properties;
  if (properties) {
    properties[MONEY_FIELD] ??= properties._学园金币 ?? properties.学园金币 ?? { type: 'number', required: true };
    for (const key of LEGACY_MONEY_FIELDS) delete properties[key];
  }
}

export function formatCurrencyText(text: string): string {
  return text.replace(/(?:天海)?信用点|(?:学园|校园)?金币|学园币|校园币/g, CURRENCY_NAME);
}
