import { NAME_ALIASES } from '../战斗界面/enemyDatabase';
import { getAvatarResourceName } from '../性斗学园脚本/phone/backstreetAvatarSettings';

export const CHARACTER_AVATAR_VARIATIONS_VARIABLE_KEY = '性斗学园头像差分记录';
export const AVATAR_VARIATIONS_UPDATED_EVENT = 'fatria-avatar-variations-updated';

const CHARACTER_VARIABLE_OPTION: VariableOption = { type: 'character' };
export const AVATAR_VARIATION_KEYS = ['低好感', '中好感', '高好感', '服从', '平等', '支配'] as const;

export type AvatarVariationKey = (typeof AVATAR_VARIATION_KEYS)[number];

export interface AvatarVariationConfig {
  characterName: string;
  imageFolder: string;
}

export interface AvatarVariationOption {
  key: AvatarVariationKey;
  label: string;
  url: string;
}

interface AvatarAvailabilityCacheEntry {
  promise: Promise<boolean>;
  expiresAt: number;
}

const avatarAvailabilityCache = new Map<string, AvatarAvailabilityCacheEntry>();
const AVATAR_AVAILABILITY_TIMEOUT_MS = 2_500;
const AVATAR_AVAILABILITY_FAILURE_TTL_MS = 30_000;

/**
 * Check a remote avatar without allowing one stalled CDN request to block a page.
 * Successful checks stay cached for the lifetime of the script; failed checks are
 * retried after a short period so newly uploaded images are picked up automatically.
 */
export function isAvatarUrlAvailable(url: string): Promise<boolean> {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) return Promise.resolve(false);

  const cached = avatarAvailabilityCache.get(normalizedUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  let entry!: AvatarAvailabilityCacheEntry;
  const promise = new Promise<boolean>(resolve => {
    const image = new Image();
    let settled = false;
    const finish = (available: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(available);
      entry.expiresAt = available ? Number.MAX_SAFE_INTEGER : Date.now() + AVATAR_AVAILABILITY_FAILURE_TTL_MS;
    };
    const timeoutId = window.setTimeout(() => {
      image.src = '';
      finish(false);
    }, AVATAR_AVAILABILITY_TIMEOUT_MS);

    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = normalizedUrl;
  });

  entry = { promise, expiresAt: Number.MAX_SAFE_INTEGER };
  avatarAvailabilityCache.set(normalizedUrl, entry);
  return promise;
}

/** Probe a small number of avatar URLs at a time to avoid starving normal images. */
export async function filterAvailableAvatarVariationOptions(
  options: AvatarVariationOption[],
  maxConcurrent = 3,
): Promise<AvatarVariationOption[]> {
  if (options.length === 0) return [];

  const available = new Array<boolean>(options.length).fill(false);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < options.length) {
      const index = nextIndex++;
      available[index] = await isAvatarUrlAvailable(options[index].url);
    }
  };

  const workerCount = Math.min(Math.max(1, maxConcurrent), options.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return options.filter((_, index) => available[index]);
}

export interface AvatarVariationMutationResult {
  changed: boolean;
  unlockedCount: number;
  characters: string[];
}

export interface AvatarVariationRecord {
  unlocked: AvatarVariationKey[];
  selected?: AvatarVariationKey | null;
}

export type SerializableAvatarVariationMap = Record<string, AvatarVariationRecord>;

export const AVATAR_VARIATION_CONFIGS: AvatarVariationConfig[] = [{ characterName: '樱岛麻衣', imageFolder: '麻衣' }];

function emptyMutationResult(): AvatarVariationMutationResult {
  return {
    changed: false,
    unlockedCount: 0,
    characters: [],
  };
}

function normalizeCharacterName(name: string): string {
  return String(name || '')
    .trim()
    .replace(/[·・‧•\s\u3000._\-\u2014]/g, '');
}

function normalizeVariationKey(value: unknown): AvatarVariationKey | null {
  return AVATAR_VARIATION_KEYS.includes(value as AvatarVariationKey) ? (value as AvatarVariationKey) : null;
}

function uniqueVariationKeys(value: unknown): AvatarVariationKey[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: AvatarVariationKey[] = [];
  for (const item of value) {
    const key = normalizeVariationKey(item);
    if (key && !result.includes(key)) {
      result.push(key);
    }
  }

  return result;
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

function saveAvatarVariationMap(unlockMap: SerializableAvatarVariationMap): boolean {
  try {
    const globalAny = window as any;
    if (typeof globalAny.insertOrAssignVariables === 'function') {
      globalAny.insertOrAssignVariables(
        { [CHARACTER_AVATAR_VARIATIONS_VARIABLE_KEY]: unlockMap },
        CHARACTER_VARIABLE_OPTION,
      );
      return true;
    }
  } catch (error) {
    console.warn('[性斗学园] 写入头像差分变量失败:', error);
  }

  return false;
}

function notifyAvatarVariationsUpdated(result: AvatarVariationMutationResult) {
  if (!result.changed) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(AVATAR_VARIATIONS_UPDATED_EVENT, {
      detail: {
        characters: result.characters,
        unlockedCount: result.unlockedCount,
      },
    }),
  );
}

function addChangedCharacter(result: AvatarVariationMutationResult, characterName: string) {
  if (!result.characters.includes(characterName)) {
    result.characters.push(characterName);
  }
}

export function getAvatarVariationConfigForCharacter(characterName: string): AvatarVariationConfig | null {
  const normalizedName = normalizeCharacterName(characterName);
  if (!normalizedName) {
    return null;
  }

  const createDefaultConfig = (name: string): AvatarVariationConfig => ({
    characterName: name,
    imageFolder: name,
  });

  const direct = AVATAR_VARIATION_CONFIGS.find(
    config =>
      normalizeCharacterName(config.characterName) === normalizedName ||
      normalizeCharacterName(config.imageFolder) === normalizedName,
  );
  if (direct) {
    return direct;
  }

  const aliasTarget = NAME_ALIASES[normalizedName];
  const candidates = [aliasTarget, aliasTarget?.replace(/_\d+$/g, ''), normalizedName.replace(/_\d+$/g, '')].filter(
    (candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0,
  );

  for (const candidate of candidates) {
    const matched = AVATAR_VARIATION_CONFIGS.find(
      config => normalizeCharacterName(config.characterName) === normalizeCharacterName(candidate),
    );
    if (matched) {
      return matched;
    }
  }

  if (aliasTarget) {
    return createDefaultConfig(aliasTarget);
  }

  const byFullName = [...AVATAR_VARIATION_CONFIGS].sort((a, b) => b.characterName.length - a.characterName.length);
  const includedConfig = byFullName.find(config =>
    normalizedName.includes(normalizeCharacterName(config.characterName)),
  );
  if (includedConfig) {
    return includedConfig;
  }

  const aliases = Object.entries(NAME_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, fullName] of aliases) {
    if (!normalizedName.includes(normalizeCharacterName(alias))) {
      continue;
    }

    const matched = AVATAR_VARIATION_CONFIGS.find(
      config => normalizeCharacterName(config.characterName) === normalizeCharacterName(fullName),
    );
    if (matched) {
      return matched;
    }

    return createDefaultConfig(fullName);
  }

  return createDefaultConfig(characterName.trim());
}

export function getAvatarVariationCharacterName(characterName: string): string | null {
  return getAvatarVariationConfigForCharacter(characterName)?.characterName ?? null;
}

function normalizeAvatarVariationMap(rawValue: unknown): SerializableAvatarVariationMap {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return {};
  }

  const result: SerializableAvatarVariationMap = {};
  for (const [characterName, rawRecord] of Object.entries(rawValue as Record<string, unknown>)) {
    const config = getAvatarVariationConfigForCharacter(characterName);
    if (!config || !rawRecord || typeof rawRecord !== 'object' || Array.isArray(rawRecord)) {
      continue;
    }

    const record = rawRecord as Record<string, unknown>;
    const unlocked = uniqueVariationKeys(record.unlocked);
    const selected = normalizeVariationKey(record.selected);
    result[config.characterName] = {
      unlocked,
      ...(selected && unlocked.includes(selected) ? { selected } : {}),
    };
  }

  return result;
}

function getCharacterAvatarVariationMap(): SerializableAvatarVariationMap {
  return normalizeAvatarVariationMap(readCharacterVariables()[CHARACTER_AVATAR_VARIATIONS_VARIABLE_KEY]);
}

function addAvatarVariationKeysToMap(
  unlockMap: SerializableAvatarVariationMap,
  characterName: string,
  keys: Iterable<AvatarVariationKey>,
): number {
  const config = getAvatarVariationConfigForCharacter(characterName);
  if (!config) {
    return 0;
  }

  const existingRecord = unlockMap[config.characterName] || { unlocked: [] };
  const unlocked = new Set(uniqueVariationKeys(existingRecord.unlocked));
  let addedCount = 0;

  for (const key of keys) {
    if (unlocked.has(key)) {
      continue;
    }

    unlocked.add(key);
    addedCount++;
  }

  if (addedCount > 0) {
    unlockMap[config.characterName] = {
      unlocked: [...unlocked],
      ...(existingRecord.selected && unlocked.has(existingRecord.selected)
        ? { selected: existingRecord.selected }
        : {}),
    };
  }

  return addedCount;
}

function addAvatarKeysToMutationResult(
  result: AvatarVariationMutationResult,
  characterName: string,
  addedCount: number,
) {
  if (addedCount <= 0) {
    return;
  }

  result.changed = true;
  result.unlockedCount += addedCount;
  addChangedCharacter(result, characterName);
}

function getUnlockKeysFromRelationship(relationship: Record<string, any>): AvatarVariationKey[] {
  const result: AvatarVariationKey[] = [];
  const favor = Number(relationship.好感度);
  if (Number.isFinite(favor)) {
    if (favor > 30) result.push('低好感');
    if (favor > 60) result.push('中好感');
    if (favor > 90) result.push('高好感');
  }

  switch (String(relationship.誓约 || '无')) {
    case '被支配型':
      result.push('服从');
      break;
    case '平等型':
      result.push('平等');
      break;
    case '支配型':
      result.push('支配');
      break;
  }

  return result;
}

export async function unlockAvatarVariationsFromMvuData(mvuData: Mvu.MvuData): Promise<AvatarVariationMutationResult> {
  const result = emptyMutationResult();
  const relationships = mvuData.stat_data?.关系系统;
  if (!relationships || typeof relationships !== 'object') {
    return result;
  }

  const unlockMap = getCharacterAvatarVariationMap();

  for (const [characterName, relationship] of Object.entries(relationships)) {
    if (characterName === '在场人物' || !relationship || typeof relationship !== 'object') {
      continue;
    }

    const config = getAvatarVariationConfigForCharacter(characterName);
    if (!config) {
      continue;
    }

    const addedCount = addAvatarVariationKeysToMap(
      unlockMap,
      config.characterName,
      getUnlockKeysFromRelationship(relationship as Record<string, any>),
    );
    addAvatarKeysToMutationResult(result, config.characterName, addedCount);
  }

  if (result.changed) {
    saveAvatarVariationMap(unlockMap);
    notifyAvatarVariationsUpdated(result);
  }

  return result;
}

export async function getAllAvatarVariationRecordsByCharacter(): Promise<SerializableAvatarVariationMap> {
  return getCharacterAvatarVariationMap();
}

export async function getUnlockedAvatarVariationOptions(characterName: string): Promise<AvatarVariationOption[]> {
  const config = getAvatarVariationConfigForCharacter(characterName);
  if (!config) {
    return [];
  }

  const unlockMap = await getAllAvatarVariationRecordsByCharacter();
  return uniqueVariationKeys(unlockMap[config.characterName]?.unlocked).map(key => ({
    key,
    label: key,
    url: getAvatarVariationUrl(config, key),
  }));
}

export function getAllAvatarVariationOptions(characterName: string): AvatarVariationOption[] {
  const config = getAvatarVariationConfigForCharacter(characterName);
  if (!config) {
    return [];
  }

  return AVATAR_VARIATION_KEYS.map(key => ({
    key,
    label: key,
    url: getAvatarVariationUrl(config, key),
  }));
}

export async function getSelectedAvatarVariationKey(characterName: string): Promise<AvatarVariationKey | null> {
  const config = getAvatarVariationConfigForCharacter(characterName);
  if (!config) {
    return null;
  }

  const unlockMap = await getAllAvatarVariationRecordsByCharacter();
  const record = unlockMap[config.characterName];
  return record?.selected && record.unlocked.includes(record.selected) ? record.selected : null;
}

export async function getSelectedAvatarVariationUrl(characterName: string): Promise<string | null> {
  const config = getAvatarVariationConfigForCharacter(characterName);
  const selectedKey = await getSelectedAvatarVariationKey(characterName);
  return config && selectedKey ? getAvatarVariationUrl(config, selectedKey) : null;
}

export async function selectAvatarVariation(characterName: string, key: AvatarVariationKey | null): Promise<boolean> {
  const config = getAvatarVariationConfigForCharacter(characterName);
  if (!config) {
    return false;
  }

  const unlockMap = getCharacterAvatarVariationMap();
  const record = unlockMap[config.characterName];
  if (!record) {
    return false;
  }

  if (key && !record.unlocked.includes(key)) {
    return false;
  }

  const nextRecord: AvatarVariationRecord = {
    unlocked: record.unlocked,
    selected: key,
  };
  unlockMap[config.characterName] = nextRecord;

  const changed = record.selected !== nextRecord.selected;
  if (changed) {
    saveAvatarVariationMap(unlockMap);
    window.dispatchEvent(
      new CustomEvent(AVATAR_VARIATIONS_UPDATED_EVENT, {
        detail: {
          characters: [config.characterName],
          unlockedCount: 0,
        },
      }),
    );
  }

  return changed;
}

export function getAvatarVariationUrl(config: AvatarVariationConfig, key: AvatarVariationKey): string {
  const imageFolder = getAvatarResourceName(config.imageFolder);
  return `https://img.vinsimage.org/性斗学园/头像差分/${encodeURIComponent(imageFolder)}/${encodeURIComponent(key)}.png`;
}
