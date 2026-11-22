import {
  assignSkillFamily,
  buildNpcSkillIds,
  filterNpcSkillIds,
  filterNpcSkillIdsByFamilies,
  NPC_SKILL_POOLS,
  NPC_SKILLS,
  type SkillFamily,
} from './npcSkillPools';

export const CHAT_NPC_PROFILES_KEY = '性斗学园NPC战斗档案';

export interface NpcBattleProfile {
  level: number;
  skillIds: string[];
  family?: SkillFamily;
}

function readChatVariables(): Record<string, any> {
  try {
    const api = (window as any).TavernHelper ?? (window as any);
    return typeof api.getVariables === 'function' ? api.getVariables({ type: 'chat' }) || {} : {};
  } catch {
    return {};
  }
}

function readProfiles(): Record<string, NpcBattleProfile> {
  const raw = readChatVariables()[CHAT_NPC_PROFILES_KEY];
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

function writeProfiles(profiles: Record<string, NpcBattleProfile>): boolean {
  try {
    const api = (window as any).TavernHelper ?? (window as any);
    if (typeof api.insertOrAssignVariables !== 'function') return false;
    api.insertOrAssignVariables({ [CHAT_NPC_PROFILES_KEY]: profiles }, { type: 'chat' });
    return true;
  } catch {
    return false;
  }
}

export function getNpcBattleProfile(key: string): NpcBattleProfile | null {
  const profiles = readProfiles();
  let profilesChanged = false;

  // 任意 NPC 档案被读取时一并清理旧版 e_basic_* 技能，避免未遭遇的旧档案继续污染技能池。
  Object.entries(profiles).forEach(([profileKey, candidate]) => {
    if (!candidate || !Array.isArray(candidate.skillIds)) return;
    const cleanedSkillIds = filterNpcSkillIds(candidate.skillIds);
    if (cleanedSkillIds.length === candidate.skillIds.length) return;
    profiles[profileKey] = { ...candidate, skillIds: cleanedSkillIds };
    profilesChanged = true;
  });

  const profile = profiles[key];
  if (!profile || !Array.isArray(profile.skillIds)) {
    if (profilesChanged) writeProfiles(profiles);
    return null;
  }
  const level = Math.max(20, Math.min(80, Math.round(Number(profile.level) || 20)));
  const family = ['hand', 'oral', 'foot', 'chest', 'ride', 'tool', 'mental'].includes(profile.family || '')
    ? (profile.family as SkillFamily)
    : undefined;
  const skillIds = filterNpcSkillIds(profile.skillIds);
  const normalizedProfile = { level, skillIds, family };

  // 迁移旧档案：早期版本会把 e_basic_* 等通用技能写入 NPC 档案。
  if (skillIds.length !== profile.skillIds.length || level !== Number(profile.level) || family !== profile.family) {
    profiles[key] = normalizedProfile;
    profilesChanged = true;
  }

  if (profilesChanged) writeProfiles(profiles);

  return normalizedProfile;
}

export function saveNpcBattleProfile(key: string, profile: NpcBattleProfile): boolean {
  const profiles = readProfiles();
  profiles[key] = {
    level: Math.max(20, Math.min(80, Math.round(profile.level))),
    skillIds: filterNpcSkillIds(profile.skillIds),
    family: profile.family,
  };
  return writeProfiles(profiles);
}

export function getOrCreateNpcBattleProfile(key: string, requestedLevel: number, skillIds: string[]): NpcBattleProfile {
  const existing = getNpcBattleProfile(key);
  if (existing) return existing;
  const profile = { level: Math.max(20, Math.min(80, Math.round(requestedLevel))), skillIds: [...new Set(skillIds)] };
  saveNpcBattleProfile(key, profile);
  return profile;
}

/**
 * 设置技能池后立即迁移旧 NPC 档案，避免下一场战斗继续沿用已被关闭的技能系。
 * 已经属于允许池的档案保持不变；不属于允许池的档案会重抽为允许池中的单一技能系。
 */
export function enforceNpcBattleProfilesSkillPools(allowedFamilies: readonly SkillFamily[]): boolean {
  const normalizedFamilies = allowedFamilies.filter(family => Boolean(NPC_SKILL_POOLS[family]?.length));
  if (normalizedFamilies.length === 0) return false;

  const profiles = readProfiles();
  let changed = false;
  Object.entries(profiles).forEach(([profileKey, candidate]) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return;

    const currentFamily =
      candidate.family && normalizedFamilies.includes(candidate.family) ? candidate.family : undefined;
    const family = currentFamily ?? assignSkillFamily(profileKey, normalizedFamilies);
    const filteredSkillIds = filterNpcSkillIdsByFamilies(candidate.skillIds, [family], NPC_SKILLS);
    const skillIds =
      filteredSkillIds.length > 0 ? filteredSkillIds : buildNpcSkillIds(NPC_SKILLS, profileKey, [family]);
    const level = Math.max(20, Math.min(80, Math.round(Number(candidate.level) || 20)));
    const nextProfile: NpcBattleProfile = { level, skillIds, family };

    const sameSkillIds =
      Array.isArray(candidate.skillIds) &&
      candidate.skillIds.length === skillIds.length &&
      candidate.skillIds.every((skillId, index) => skillId === skillIds[index]);
    if (candidate.family !== family || Number(candidate.level) !== level || !sameSkillIds) {
      profiles[profileKey] = nextProfile;
      changed = true;
    }
  });

  return changed ? writeProfiles(profiles) : true;
}
