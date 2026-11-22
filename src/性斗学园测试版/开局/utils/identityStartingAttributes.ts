import { getSelectedIdentity } from '../data/identityDatabase';
import { INITIAL_ATTRIBUTES, type CharacterAttributes, type CharacterData, type FixedIdentityStart } from '../types';

type IdentitySelection = Pick<CharacterData, 'name' | 'gender' | 'archetypeId'>;

export function getIdentityFixedStart(data: IdentitySelection) {
  return getSelectedIdentity(data)?.fixedStart;
}

function withFixedStart(attributes: CharacterAttributes, start: FixedIdentityStart): CharacterAttributes {
  return {
    ...attributes,
    角色基础: { ...attributes.角色基础, _等级: start.level, _段位: start.rank },
    核心状态: { ...attributes.核心状态, _潜力: start.potential },
  };
}

/** 只用于开局表单，不限制游戏开始后的升级与成长。 */
export function applyIdentityStartingAttributes(data: CharacterData, previous?: CharacterData): CharacterData {
  const start = getIdentityFixedStart(data);
  if (start) return { ...data, attributes: withFixedStart(data.attributes, start) };
  if (!previous || !getIdentityFixedStart(previous)) return data;

  // 切换身份时撤回原身份赠送的三项固定数值，其余已分配属性照常保留。
  return {
    ...data,
    attributes: withFixedStart(data.attributes, {
      level: INITIAL_ATTRIBUTES.角色基础._等级,
      rank: INITIAL_ATTRIBUTES.角色基础._段位 ?? '无段位',
      potential: INITIAL_ATTRIBUTES.核心状态._潜力,
    }),
  };
}

export function getIdentityInitialAttributes(data: IdentitySelection): CharacterAttributes {
  const attributes: CharacterAttributes = {
    角色基础: { ...INITIAL_ATTRIBUTES.角色基础 },
    核心状态: { ...INITIAL_ATTRIBUTES.核心状态 },
    基础属性: { ...INITIAL_ATTRIBUTES.基础属性 },
  };
  const start = getIdentityFixedStart(data);
  return start ? withFixedStart(attributes, start) : attributes;
}

export function isIdentityAttributeLocked(data: IdentitySelection, path: string) {
  return Boolean(getIdentityFixedStart(data)) && ['角色基础._等级', '核心状态._潜力'].includes(path);
}

/** 提交身份开局条件与道具；潜力先于成长计算生效，段位独立保存。 */
export function getIdentityStartingUpdates(data: IdentitySelection): Record<string, unknown> {
  const identity = getSelectedIdentity(data);
  const start = identity?.fixedStart;
  const updates: Record<string, unknown> = {
    '角色基础.身份': identity?.name ?? '泛泛之辈',
    ...(start
      ? { '角色基础._等级': start.level, '角色基础._段位': start.rank, '核心状态._潜力': start.potential }
      : {}),
  };
  for (const [name, item] of Object.entries(identity?.startingItems ?? {})) {
    updates[`物品系统.背包.${name}`] = { ...item };
  }
  return updates;
}
