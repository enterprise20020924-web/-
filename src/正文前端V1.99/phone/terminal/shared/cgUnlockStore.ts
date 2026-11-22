import { getCGImageKey, getUnlockedCGKeys, unlockCGKey as unlockLegacyCGKey } from './localPreferences';
import { CG_CONFIGS, type CharacterCGConfig } from '../战斗界面/data/cgConfig';
import { NAME_ALIASES } from '../战斗界面/enemyDatabase';

export { getCGImageKey };

export const CHARACTER_CG_UNLOCKS_VARIABLE_KEY = '性斗学园CG解锁记录';
export const CHAT_BOSS_BATTLE_RECORDS_VARIABLE_KEY = '性斗学园BOSS战记录';

const LEGACY_MVU_CG_UNLOCKS_FIELD = '已解锁CG';
const CHARACTER_VARIABLE_OPTION: VariableOption = { type: 'character' };
const CHAT_VARIABLE_OPTION: VariableOption = { type: 'chat' };

export interface CGUnlockMutationResult {
  changed: boolean;
  unlockedCount: number;
  characters: string[];
}

export type SerializableCGUnlockMap = Record<string, string[]>;

export interface YamadaHanakoBossBattleRecord {
  是否已挑战: boolean;
  是否已触发伪装逃跑: boolean;
}

export interface BossBattleRecords {
  山田花子: YamadaHanakoBossBattleRecord;
  [bossName: string]: unknown;
}

function normalizeCharacterName(name: string): string {
  return String(name || '')
    .trim()
    .replace(/[·・‧]/g, '');
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0))];
}

function emptyMutationResult(): CGUnlockMutationResult {
  return {
    changed: false,
    unlockedCount: 0,
    characters: [],
  };
}

function addChangedCharacter(result: CGUnlockMutationResult, characterName: string) {
  if (!result.characters.includes(characterName)) {
    result.characters.push(characterName);
  }
}

export function getCGConfigForCharacter(characterName: string): CharacterCGConfig | null {
  const normalizedName = normalizeCharacterName(characterName);
  if (!normalizedName) {
    return null;
  }

  const direct = CG_CONFIGS.find(config => config.characterName === normalizedName);
  if (direct) {
    return direct;
  }

  const aliasTarget = NAME_ALIASES[normalizedName];
  const candidates = [aliasTarget, aliasTarget?.replace(/_\d+$/g, ''), normalizedName.replace(/_\d+$/g, '')].filter(
    (candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0,
  );

  for (const candidate of candidates) {
    const matched = CG_CONFIGS.find(config => config.characterName === candidate);
    if (matched) {
      return matched;
    }
  }

  const byFullName = [...CG_CONFIGS].sort((a, b) => b.characterName.length - a.characterName.length);
  const includedConfig = byFullName.find(config => normalizedName.includes(config.characterName));
  if (includedConfig) {
    return includedConfig;
  }

  const aliases = Object.entries(NAME_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, fullName] of aliases) {
    if (!normalizedName.includes(alias)) {
      continue;
    }

    const withoutStageSuffix = fullName.replace(/_\d+$/g, '');
    const matched = CG_CONFIGS.find(
      config => config.characterName === fullName || config.characterName === withoutStageSuffix,
    );
    if (matched) {
      return matched;
    }
  }

  return null;
}

export function getCGCharacterName(characterName: string): string | null {
  return getCGConfigForCharacter(characterName)?.characterName ?? null;
}

export function getAllCGKeysForConfig(config: CharacterCGConfig): Set<string> {
  const keys = new Set<string>();
  const eventGroups = [config.male.defeat, config.male.victory, config.female.defeat, config.female.victory];

  for (const events of eventGroups) {
    for (const event of events) {
      for (let imageIndex = 0; imageIndex < event.images.length; imageIndex++) {
        keys.add(getCGImageKey(event.id, imageIndex));
      }
    }
  }

  return keys;
}

export function getAllCGKeysForCharacter(characterName: string): Set<string> {
  const config = getCGConfigForCharacter(characterName);
  return config ? getAllCGKeysForConfig(config) : new Set();
}

function readCharacterVariables(): Record<string, any> {
  try {
    const globalAny = window as any;
    if (typeof globalAny.getVariables === 'function') {
      return globalAny.getVariables(CHARACTER_VARIABLE_OPTION) || {};
    }
  } catch (error) {
    console.warn('[性斗学园] 读取角色变量失败:', error);
  }

  return {};
}

function readChatVariables(): Record<string, any> {
  try {
    const globalAny = window as any;
    if (typeof globalAny.getVariables === 'function') {
      return globalAny.getVariables(CHAT_VARIABLE_OPTION) || {};
    }
  } catch (error) {
    console.warn('[性斗学园] 读取聊天变量失败:', error);
  }

  return {};
}

function saveCharacterCGUnlockMap(unlockMap: SerializableCGUnlockMap): boolean {
  try {
    const globalAny = window as any;
    if (typeof globalAny.insertOrAssignVariables === 'function') {
      globalAny.insertOrAssignVariables({ [CHARACTER_CG_UNLOCKS_VARIABLE_KEY]: unlockMap }, CHARACTER_VARIABLE_OPTION);
      return true;
    }
  } catch (error) {
    console.warn('[性斗学园] 写入角色CG解锁变量失败:', error);
  }

  return false;
}

function saveBossBattleRecords(records: BossBattleRecords): boolean {
  try {
    const globalAny = window as any;
    if (typeof globalAny.insertOrAssignVariables === 'function') {
      globalAny.insertOrAssignVariables({ [CHAT_BOSS_BATTLE_RECORDS_VARIABLE_KEY]: records }, CHAT_VARIABLE_OPTION);
      return true;
    }
  } catch (error) {
    console.warn('[性斗学园] 写入聊天Boss战记录失败:', error);
  }

  return false;
}

function normalizeYamadaHanakoBossBattleRecord(rawValue: unknown): YamadaHanakoBossBattleRecord {
  const rawRecord = rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue) ? rawValue : {};
  return {
    是否已挑战: (rawRecord as Record<string, unknown>).是否已挑战 === true,
    是否已触发伪装逃跑: (rawRecord as Record<string, unknown>).是否已触发伪装逃跑 === true,
  };
}

export function getBossBattleRecords(): BossBattleRecords {
  const rawRecords = readChatVariables()[CHAT_BOSS_BATTLE_RECORDS_VARIABLE_KEY];
  const recordMap = rawRecords && typeof rawRecords === 'object' && !Array.isArray(rawRecords) ? rawRecords : {};
  return {
    ...(recordMap as Record<string, unknown>),
    山田花子: normalizeYamadaHanakoBossBattleRecord((recordMap as Record<string, unknown>).山田花子),
  };
}

export function hasYamadaHanakoBeenChallenged(): boolean {
  return getBossBattleRecords().山田花子.是否已挑战;
}

function hasCompleteYamadaHanakoBossBattleRecord(rawValue: unknown): boolean {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return false;
  }

  const record = rawValue as Record<string, unknown>;
  return typeof record.是否已挑战 === 'boolean' && typeof record.是否已触发伪装逃跑 === 'boolean';
}

// 旧聊天可能没有在本次更新前新增的 BOSS 记录；每次载入战斗时补齐默认结构。
export function ensureBossBattleRecords(): boolean {
  const chatVariables = readChatVariables();
  const rawRecords = chatVariables[CHAT_BOSS_BATTLE_RECORDS_VARIABLE_KEY];
  const recordMap = rawRecords && typeof rawRecords === 'object' && !Array.isArray(rawRecords) ? rawRecords : {};
  const rawYamadaRecord = (recordMap as Record<string, unknown>).山田花子;

  if (hasCompleteYamadaHanakoBossBattleRecord(rawYamadaRecord)) {
    return false;
  }

  return saveBossBattleRecords(getBossBattleRecords());
}

export const ensureYamadaHanakoBossBattleRecord = ensureBossBattleRecords;

export function markYamadaHanakoDisguiseEscape(): boolean {
  const records = getBossBattleRecords();
  records.山田花子.是否已挑战 = true;
  records.山田花子.是否已触发伪装逃跑 = true;
  return saveBossBattleRecords(records);
}

function normalizeUnlockMap(rawValue: unknown): SerializableCGUnlockMap {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return {};
  }

  const result: Record<string, Set<string>> = {};
  for (const [characterName, cgKeys] of Object.entries(rawValue as Record<string, unknown>)) {
    const canonicalName = getCGCharacterName(characterName);
    if (!canonicalName) {
      continue;
    }

    if (!result[canonicalName]) {
      result[canonicalName] = new Set();
    }
    for (const cgKey of uniqueStrings(cgKeys)) {
      result[canonicalName].add(cgKey);
    }
  }

  return Object.fromEntries(Object.entries(result).map(([characterName, keys]) => [characterName, [...keys]]));
}

function getCharacterCGUnlockMap(): SerializableCGUnlockMap {
  return normalizeUnlockMap(readCharacterVariables()[CHARACTER_CG_UNLOCKS_VARIABLE_KEY]);
}

function addCGKeysToUnlockMap(
  unlockMap: SerializableCGUnlockMap,
  characterName: string,
  cgKeys: Iterable<string>,
): number {
  const canonicalName = getCGCharacterName(characterName);
  if (!canonicalName) {
    return 0;
  }

  const unlockedKeys = new Set(uniqueStrings(unlockMap[canonicalName]));
  let addedCount = 0;

  for (const cgKey of cgKeys) {
    if (!cgKey || unlockedKeys.has(cgKey)) {
      continue;
    }

    unlockedKeys.add(cgKey);
    addedCount++;
  }

  if (addedCount > 0) {
    unlockMap[canonicalName] = [...unlockedKeys];
  }

  return addedCount;
}

function addCGKeysToMutationResult(result: CGUnlockMutationResult, characterName: string, addedCount: number) {
  if (addedCount <= 0) {
    return;
  }

  result.changed = true;
  result.unlockedCount += addedCount;
  addChangedCharacter(result, characterName);
}

function getLegacyCGUnlockMap(): SerializableCGUnlockMap {
  const legacyKeys = getUnlockedCGKeys();
  const result: SerializableCGUnlockMap = {};
  if (legacyKeys.size === 0) {
    return result;
  }

  for (const config of CG_CONFIGS) {
    const cgKeys = [...getAllCGKeysForConfig(config)].filter(cgKey => legacyKeys.has(cgKey));
    if (cgKeys.length > 0) {
      result[config.characterName] = cgKeys;
    }
  }

  return result;
}

export function readMvuCGUnlockMap(statData: any): SerializableCGUnlockMap {
  const relationships = statData?.关系系统;
  const result: SerializableCGUnlockMap = {};
  if (!relationships || typeof relationships !== 'object') {
    return result;
  }

  for (const config of CG_CONFIGS) {
    const relationship = relationships[config.characterName];
    const unlockedKeys = uniqueStrings(relationship?.[LEGACY_MVU_CG_UNLOCKS_FIELD]);
    if (unlockedKeys.length > 0) {
      result[config.characterName] = unlockedKeys;
    }
  }

  return result;
}

function mergeUnlockMap(
  target: SerializableCGUnlockMap,
  source: SerializableCGUnlockMap,
  result: CGUnlockMutationResult,
) {
  for (const [characterName, cgKeys] of Object.entries(source)) {
    const addedCount = addCGKeysToUnlockMap(target, characterName, cgKeys);
    const canonicalName = getCGCharacterName(characterName);
    if (canonicalName) {
      addCGKeysToMutationResult(result, canonicalName, addedCount);
    }
  }
}

function getMergedUnlockMap(mvuData?: Mvu.MvuData | null): {
  unlockMap: SerializableCGUnlockMap;
  migration: CGUnlockMutationResult;
} {
  const unlockMap = getCharacterCGUnlockMap();
  const migration = emptyMutationResult();

  mergeUnlockMap(unlockMap, getLegacyCGUnlockMap(), migration);
  if (mvuData?.stat_data) {
    mergeUnlockMap(unlockMap, readMvuCGUnlockMap(mvuData.stat_data), migration);
  }

  return { unlockMap, migration };
}

export async function migrateLegacyCGUnlocksToCharacterVariables(
  mvuData?: Mvu.MvuData | null,
): Promise<CGUnlockMutationResult> {
  const { unlockMap, migration } = getMergedUnlockMap(mvuData);
  if (migration.changed) {
    saveCharacterCGUnlockMap(unlockMap);
  }

  return migration;
}

export async function getAllUnlockedCGKeysByCharacter(): Promise<SerializableCGUnlockMap> {
  const { unlockMap, migration } = getMergedUnlockMap();
  if (migration.changed) {
    saveCharacterCGUnlockMap(unlockMap);
  }

  return unlockMap;
}

export async function getCharacterUnlockedCGKeys(characterName: string): Promise<Set<string>> {
  const canonicalName = getCGCharacterName(characterName);
  if (!canonicalName) {
    return new Set();
  }

  const unlockMap = await getAllUnlockedCGKeysByCharacter();
  return new Set(uniqueStrings(unlockMap[canonicalName]));
}

export async function unlockCharacterCGKey(characterName: string, cgKey: string): Promise<boolean> {
  const canonicalName = getCGCharacterName(characterName);
  if (!canonicalName || !cgKey) {
    return false;
  }

  const { unlockMap, migration } = getMergedUnlockMap();
  const existingKeys = new Set(uniqueStrings(unlockMap[canonicalName]));
  const wasUnlocked = existingKeys.has(cgKey);
  const addedCount = addCGKeysToUnlockMap(unlockMap, canonicalName, [cgKey]);

  if (migration.changed || addedCount > 0) {
    const savedToCharacter = saveCharacterCGUnlockMap(unlockMap);
    if (!savedToCharacter && addedCount > 0) {
      unlockLegacyCGKey(cgKey);
    }
  }

  return !wasUnlocked;
}

export async function unlockAllCGsForCharacter(characterName: string): Promise<CGUnlockMutationResult> {
  const result = emptyMutationResult();
  const config = getCGConfigForCharacter(characterName);
  if (!config) {
    return result;
  }

  const { unlockMap, migration } = getMergedUnlockMap();
  const addedCount = addCGKeysToUnlockMap(unlockMap, config.characterName, getAllCGKeysForConfig(config));

  if (migration.changed || addedCount > 0) {
    saveCharacterCGUnlockMap(unlockMap);
  }

  addCGKeysToMutationResult(result, config.characterName, addedCount);
  return result;
}

export async function unlockMaxFavorCharacterCGsFromMvuData(mvuData: Mvu.MvuData): Promise<CGUnlockMutationResult> {
  const result = emptyMutationResult();
  const relationships = mvuData.stat_data?.关系系统;
  if (!relationships || typeof relationships !== 'object') {
    return result;
  }

  const unlockMap = getCharacterCGUnlockMap();

  for (const [characterName, relationship] of Object.entries(relationships)) {
    if (characterName === '在场人物' || !relationship || typeof relationship !== 'object') {
      continue;
    }

    const favor = Number((relationship as Record<string, any>).好感度);
    if (!Number.isFinite(favor) || favor < 100) {
      continue;
    }

    const config = getCGConfigForCharacter(characterName);
    if (!config) {
      continue;
    }

    const addedCount = addCGKeysToUnlockMap(unlockMap, config.characterName, getAllCGKeysForConfig(config));
    addCGKeysToMutationResult(result, config.characterName, addedCount);
  }

  if (result.changed) {
    saveCharacterCGUnlockMap(unlockMap);
  }

  return result;
}
