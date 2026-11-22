import { INITIAL_ATTRIBUTES, INITIAL_CHARACTER_DATA, type CharacterData } from '../开局/types';
import { readUserProfile } from '../开局/utils/userProfile';

export const PLAYER_PRESET_VARIABLE_KEY = '性斗学园玩家预设';
export const PLAYER_PRESET_STORAGE_KEY = 'xuedou_player_presets';

const CHARACTER_VARIABLE_OPTION: VariableOption = { type: 'character' };
const DEFAULT_PRESET_NAME = '默认预设';

type StoredCharacterData = Omit<CharacterData, 'background'>;

interface StoredPlayerPresetEntry {
  savedAt: string;
  data: Partial<CharacterData>;
}

interface StoredPlayerPresetCollection {
  version: 2;
  presets: Record<string, StoredPlayerPresetEntry>;
}

interface LegacyStoredPlayerPreset {
  version?: 1;
  savedAt?: string;
  data?: Partial<CharacterData>;
}

export interface PlayerPresetSummary {
  characterName?: string;
  gender?: CharacterData['gender'];
  age?: number;
  archetypeId?: string | null;
  name: string;
  savedAt: string;
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Vue 响应式 Proxy 不能被 structuredClone 直接克隆，降级为 JSON 克隆即可满足预设持久化。
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function readCharacterVariables(): Record<string, any> {
  try {
    const globalAny = window as any;
    if (typeof globalAny.getVariables === 'function') {
      return globalAny.getVariables(CHARACTER_VARIABLE_OPTION) || {};
    }
  } catch (error) {
    console.warn('[性斗学园] 读取玩家预设变量失败:', error);
  }

  return {};
}

function writeCharacterVariables(data: Record<string, any>): boolean {
  try {
    const globalAny = window as any;
    if (typeof globalAny.insertOrAssignVariables === 'function') {
      globalAny.insertOrAssignVariables(data, CHARACTER_VARIABLE_OPTION);
      return true;
    }
  } catch (error) {
    console.warn('[性斗学园] 写入玩家预设变量失败:', error);
  }

  return false;
}

function clearCharacterPresetVariable(): void {
  try {
    const globalAny = window as any;
    const variables = readCharacterVariables();
    if (!(PLAYER_PRESET_VARIABLE_KEY in variables)) {
      return;
    }

    delete variables[PLAYER_PRESET_VARIABLE_KEY];

    if (typeof globalAny.replaceVariables === 'function') {
      globalAny.replaceVariables(variables, CHARACTER_VARIABLE_OPTION);
      return;
    }

    if (typeof globalAny.insertOrAssignVariables === 'function') {
      globalAny.insertOrAssignVariables({ [PLAYER_PRESET_VARIABLE_KEY]: undefined }, CHARACTER_VARIABLE_OPTION);
    }
  } catch (error) {
    console.warn('[性斗学园] 清理旧玩家预设角色变量失败:', error);
  }
}

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('[性斗学园] localStorage 不可用，玩家预设将回退到角色变量:', error);
    return null;
  }
}

function readLocalStorageValue(): unknown {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(PLAYER_PRESET_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn('[性斗学园] 解析本地玩家预设失败，将重置本地预设:', error);
    return null;
  }
}

function writeLocalStorageValue(collection: StoredPlayerPresetCollection): boolean {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(PLAYER_PRESET_STORAGE_KEY, JSON.stringify(collection));
    return true;
  } catch (error) {
    console.warn('[性斗学园] 写入本地玩家预设失败:', error);
    return false;
  }
}

function normalizePresetName(name: string | undefined, fallback = DEFAULT_PRESET_NAME): string {
  const normalized = String(name || '').trim();
  return normalized || fallback;
}

function normalizePresetData(rawData: unknown): CharacterData | null {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return null;
  }

  const data = rawData as Partial<CharacterData>;
  const legacyOpeningScene =
    !data.openingSceneOutline && data.personality?.includes('[生活模拟模式开局场景]')
      ? data.personality.replace('[生活模拟模式开局场景]\n', '').trim()
      : '';
  return {
    ...cloneValue(INITIAL_CHARACTER_DATA),
    ...cloneValue(data),
    userProfile:
      data.userProfile ||
      (!data.archetypeId &&
        [data.appearance, data.personality, data.palettePersonaOverview].some(value => value?.trim()))
        ? readUserProfile(data)
        : undefined,
    openingSceneOutline: data.openingSceneOutline || legacyOpeningScene,
    background: '',
    attributes: {
      角色基础: {
        ...cloneValue(INITIAL_ATTRIBUTES.角色基础),
        ...cloneValue(data.attributes?.角色基础 || {}),
      },
      核心状态: {
        ...cloneValue(INITIAL_ATTRIBUTES.核心状态),
        ...cloneValue(data.attributes?.核心状态 || {}),
      },
      基础属性: {
        ...cloneValue(INITIAL_ATTRIBUTES.基础属性),
        ...cloneValue(data.attributes?.基础属性 || {}),
      },
    },
    configFeatures: {
      ...cloneValue(INITIAL_CHARACTER_DATA.configFeatures),
      ...cloneValue(data.configFeatures || {}),
    },
    initialActiveSkills: Array.isArray(data.initialActiveSkills) ? [...data.initialActiveSkills] : [],
    initialPassiveSkills: Array.isArray(data.initialPassiveSkills) ? [...data.initialPassiveSkills] : [],
  };
}

function serializePresetData(data: CharacterData): StoredCharacterData {
  const { background: _background, ...presetData } = cloneValue(data);
  return presetData;
}

function createPresetEntry(data: CharacterData): StoredPlayerPresetEntry {
  return {
    savedAt: new Date().toISOString(),
    data: serializePresetData(data),
  };
}

function getLegacyPresetName(data: Partial<CharacterData> | undefined): string {
  return normalizePresetName(data?.name, DEFAULT_PRESET_NAME);
}

function parsePresetCollection(rawValue: unknown): StoredPlayerPresetCollection {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return { version: 2, presets: {} };
  }

  const raw = rawValue as Record<string, unknown>;
  if (raw.version === 2 && raw.presets && typeof raw.presets === 'object' && !Array.isArray(raw.presets)) {
    const presets: Record<string, StoredPlayerPresetEntry> = {};
    for (const [name, entry] of Object.entries(raw.presets)) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        continue;
      }

      const data = normalizePresetData((entry as StoredPlayerPresetEntry).data);
      if (!data) {
        continue;
      }

      presets[normalizePresetName(name)] = {
        savedAt: String((entry as StoredPlayerPresetEntry).savedAt || ''),
        data: serializePresetData(data),
      };
    }
    return { version: 2, presets };
  }

  const legacyData = normalizePresetData(raw.data || rawValue);
  if (!legacyData) {
    return { version: 2, presets: {} };
  }

  return {
    version: 2,
    presets: {
      [getLegacyPresetName(legacyData)]: {
        savedAt: String(raw.savedAt || ''),
        data: serializePresetData(legacyData),
      },
    },
  };
}

function getPlayerPresetCollection(): StoredPlayerPresetCollection {
  const localCollection = parsePresetCollection(readLocalStorageValue());
  const characterVariables = readCharacterVariables();
  const characterRawValue = characterVariables[PLAYER_PRESET_VARIABLE_KEY];
  const characterCollection = parsePresetCollection(characterRawValue);

  let changed = false;
  for (const [name, entry] of Object.entries(characterCollection.presets)) {
    const currentEntry = localCollection.presets[name];
    const currentTime = Date.parse(currentEntry?.savedAt || '');
    const incomingTime = Date.parse(entry.savedAt || '');
    if (
      !currentEntry ||
      (Number.isFinite(incomingTime) && (!Number.isFinite(currentTime) || incomingTime > currentTime))
    ) {
      localCollection.presets[name] = entry;
      changed = true;
    }
  }

  const migrationSaved = changed ? writeLocalStorageValue(localCollection) : true;
  if (changed && migrationSaved) {
    console.info('[性斗学园] 已将角色变量中的玩家预设迁移到 localStorage');
  }

  if (characterRawValue !== undefined && migrationSaved) {
    clearCharacterPresetVariable();
  }

  return localCollection;
}

function savePlayerPresetCollection(collection: StoredPlayerPresetCollection): boolean {
  return writeLocalStorageValue(collection) || writeCharacterVariables({ [PLAYER_PRESET_VARIABLE_KEY]: collection });
}

export function listPlayerPresets(): PlayerPresetSummary[] {
  const collection = getPlayerPresetCollection();
  return Object.entries(collection.presets)
    .map(([name, entry]) => ({
      name,
      savedAt: entry.savedAt,
      characterName: entry.data.name || name,
      gender: entry.data.gender,
      age: entry.data.age,
      archetypeId: entry.data.archetypeId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

export function hasSavedPlayerPreset(): boolean {
  return listPlayerPresets().length > 0;
}

export function loadPlayerPreset(name?: string): CharacterData | null {
  const collection = getPlayerPresetCollection();
  const normalizedName = normalizePresetName(name, '');
  const entry = normalizedName ? collection.presets[normalizedName] : Object.values(collection.presets)[0];
  return normalizePresetData(entry?.data);
}

export function savePlayerPreset(name: string, data: CharacterData): boolean {
  const collection = getPlayerPresetCollection();
  const presetName = normalizePresetName(name, data.name || DEFAULT_PRESET_NAME);
  collection.presets[presetName] = createPresetEntry(data);
  return savePlayerPresetCollection(collection);
}

export function renamePlayerPreset(oldName: string, newName: string): boolean {
  const collection = getPlayerPresetCollection();
  const normalizedOldName = normalizePresetName(oldName, '');
  const normalizedNewName = normalizePresetName(newName, '');
  if (!normalizedOldName || !normalizedNewName || !collection.presets[normalizedOldName]) {
    return false;
  }

  if (normalizedOldName === normalizedNewName) {
    return true;
  }

  collection.presets[normalizedNewName] = {
    ...collection.presets[normalizedOldName],
    savedAt: new Date().toISOString(),
  };
  delete collection.presets[normalizedOldName];
  return savePlayerPresetCollection(collection);
}

export function deletePlayerPreset(name: string): boolean {
  const collection = getPlayerPresetCollection();
  const normalizedName = normalizePresetName(name, '');
  if (!normalizedName || !collection.presets[normalizedName]) {
    return false;
  }

  delete collection.presets[normalizedName];
  return savePlayerPresetCollection(collection);
}
