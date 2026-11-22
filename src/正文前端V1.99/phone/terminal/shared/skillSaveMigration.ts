/** Read old test saves once; all current writes use the new release's 主动技能 field. */
export function normalizeTestSkillSystem(value: unknown): Record<string, unknown> {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const record = (data: unknown): Record<string, unknown> =>
    data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  const { $主动技能: legacy, ...current } = source;
  return { ...current, 主动技能: { ...record(legacy), ...record(current.主动技能) } };
}

export function migrateTestSkillData(statData: Record<string, any> | undefined): boolean {
  const skills = statData?.技能系统;
  if (!skills || typeof skills !== 'object' || !Object.hasOwn(skills, '$主动技能')) return false;
  statData!.技能系统 = normalizeTestSkillSystem(skills);
  return true;
}
