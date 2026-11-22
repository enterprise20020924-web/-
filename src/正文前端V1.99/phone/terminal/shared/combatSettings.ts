import { NPC_SKILL_POOLS, type SkillFamily } from '../战斗界面/npcSkillPools';
import { enforceNpcBattleProfilesSkillPools } from '../战斗界面/npcPersistence';

export const CHAT_COMBAT_SETTINGS_KEY = '性斗学园战斗设置';
export const ENEMY_TRAITS_ENABLED_KEY = '启用敌人词条';
export const NPC_SKILL_POOLS_KEY = 'NPC技能池';

export const ALL_NPC_SKILL_FAMILIES = Object.keys(NPC_SKILL_POOLS) as SkillFamily[];

type ChatVariables = Record<string, any>;

function getChatVariables(): ChatVariables {
  try {
    const api = (window as any).TavernHelper ?? (window as any);
    return typeof api.getVariables === 'function' ? api.getVariables({ type: 'chat' }) || {} : {};
  } catch (error) {
    console.warn('[战斗设置] 读取聊天变量失败', error);
    return {};
  }
}

export function isEnemyTraitsEnabled(): boolean {
  const value = getChatVariables()?.[CHAT_COMBAT_SETTINGS_KEY]?.[ENEMY_TRAITS_ENABLED_KEY];
  return value === undefined ? true : value === true;
}

export function setEnemyTraitsEnabled(enabled: boolean): boolean {
  try {
    const api = (window as any).TavernHelper ?? (window as any);
    if (typeof api.insertOrAssignVariables !== 'function') return false;
    const current = getChatVariables()?.[CHAT_COMBAT_SETTINGS_KEY];
    api.insertOrAssignVariables(
      {
        [CHAT_COMBAT_SETTINGS_KEY]: {
          ...(current && typeof current === 'object' ? current : {}),
          [ENEMY_TRAITS_ENABLED_KEY]: enabled,
        },
      },
      { type: 'chat' },
    );
    const event = new CustomEvent('xuedou:enemy-traits-changed', { detail: { enabled } });
    window.dispatchEvent(event);
    if (window.parent && window.parent !== window) {
      window.parent.dispatchEvent(new CustomEvent('xuedou:enemy-traits-changed', { detail: { enabled } }));
    }
    return true;
  } catch (error) {
    console.warn('[战斗设置] 写入聊天变量失败', error);
    return false;
  }
}

export function subscribeEnemyTraitsSetting(listener: (enabled: boolean) => void): () => void {
  const handler = (event: Event) => listener(Boolean((event as CustomEvent<{ enabled?: boolean }>).detail?.enabled));
  window.addEventListener('xuedou:enemy-traits-changed', handler);
  const parentWindow = window.parent && window.parent !== window ? window.parent : null;
  parentWindow?.addEventListener('xuedou:enemy-traits-changed', handler);
  return () => {
    window.removeEventListener('xuedou:enemy-traits-changed', handler);
    parentWindow?.removeEventListener('xuedou:enemy-traits-changed', handler);
  };
}

function normalizeNpcSkillPools(value: unknown): SkillFamily[] {
  if (!Array.isArray(value)) return [...ALL_NPC_SKILL_FAMILIES];
  const normalized = value.filter((family): family is SkillFamily =>
    ALL_NPC_SKILL_FAMILIES.includes(family as SkillFamily),
  );
  return normalized.length > 0 ? Array.from(new Set(normalized)) : [...ALL_NPC_SKILL_FAMILIES];
}

export function getNpcSkillPools(): SkillFamily[] {
  const value = getChatVariables()?.[CHAT_COMBAT_SETTINGS_KEY]?.[NPC_SKILL_POOLS_KEY];
  const normalized = normalizeNpcSkillPools(value);
  // 读取设置时也执行一次迁移，覆盖旧档在设置写入前就已保存的 NPC 战斗档案。
  enforceNpcBattleProfilesSkillPools(normalized);
  return normalized;
}

export function setNpcSkillPools(families: SkillFamily[]): boolean {
  const normalized = normalizeNpcSkillPools(families);
  try {
    const api = (window as any).TavernHelper ?? (window as any);
    if (typeof api.insertOrAssignVariables !== 'function') return false;
    const current = getChatVariables()?.[CHAT_COMBAT_SETTINGS_KEY];
    api.insertOrAssignVariables(
      {
        [CHAT_COMBAT_SETTINGS_KEY]: {
          ...(current && typeof current === 'object' ? current : {}),
          [NPC_SKILL_POOLS_KEY]: normalized,
        },
      },
      { type: 'chat' },
    );
    enforceNpcBattleProfilesSkillPools(normalized);
    const detail = { families: normalized };
    window.dispatchEvent(new CustomEvent('xuedou:npc-skill-pools-changed', { detail }));
    if (window.parent && window.parent !== window) {
      window.parent.dispatchEvent(new CustomEvent('xuedou:npc-skill-pools-changed', { detail }));
    }
    return true;
  } catch (error) {
    console.warn('[战斗设置] 写入 NPC 技能池失败', error);
    return false;
  }
}

export function subscribeNpcSkillPoolsSetting(listener: (families: SkillFamily[]) => void): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ families?: unknown }>).detail;
    listener(normalizeNpcSkillPools(detail?.families));
  };
  window.addEventListener('xuedou:npc-skill-pools-changed', handler);
  const parentWindow = window.parent && window.parent !== window ? window.parent : null;
  parentWindow?.addEventListener('xuedou:npc-skill-pools-changed', handler);
  return () => {
    window.removeEventListener('xuedou:npc-skill-pools-changed', handler);
    parentWindow?.removeEventListener('xuedou:npc-skill-pools-changed', handler);
  };
}
