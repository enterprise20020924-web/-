import {
  resolveCanonicalCharacterName,
  resolveCanonicalCharacterTargets,
  splitCharacterNameList,
} from '../engine/character-name-registry';

const RELATIONSHIP_SYSTEM_KEY = '关系系统';
const PRESENT_CHARACTERS_KEY = '在场人物';

export interface RelationshipNameCalibrationChange {
  path: string;
  message: string;
}

export interface RelationshipNameCalibrationResult {
  changed: boolean;
  changes: RelationshipNameCalibrationChange[];
}

export function resolveCanonicalRelationshipContactName(name: string) {
  if (name === PRESENT_CHARACTERS_KEY) {
    return name;
  }

  return resolveCanonicalCharacterName(name);
}

export function calibrateRelationshipNamesInStatData(
  statData: Record<string, unknown>,
): RelationshipNameCalibrationResult {
  const relationships = asRecord(statData[RELATIONSHIP_SYSTEM_KEY]);
  if (relationships === null) {
    return { changed: false, changes: [] };
  }

  const changes: RelationshipNameCalibrationChange[] = [];

  for (const oldName of Object.keys(relationships)) {
    if (oldName === PRESENT_CHARACTERS_KEY) {
      continue;
    }

    const canonicalName = resolveCanonicalRelationshipContactName(oldName);
    if (canonicalName.length === 0 || canonicalName === oldName) {
      continue;
    }

    relationships[canonicalName] = mergeRelationshipData(relationships[canonicalName], relationships[oldName]);
    delete relationships[oldName];
    changes.push({
      path: `${RELATIONSHIP_SYSTEM_KEY}.${canonicalName}`,
      message: `${RELATIONSHIP_SYSTEM_KEY}.${oldName} -> ${RELATIONSHIP_SYSTEM_KEY}.${canonicalName} 已合并并校准为注册全名。`,
    });
  }

  const presentCharacters = relationships[PRESENT_CHARACTERS_KEY];
  const normalizedPresentCharacters = uniqueCharacterNames(
    splitCharacterNameList(presentCharacters).flatMap(name => resolveCanonicalCharacterTargets(name)),
  );

  if (!Array.isArray(presentCharacters) || !areStringArraysEqual(presentCharacters, normalizedPresentCharacters)) {
    relationships[PRESENT_CHARACTERS_KEY] = normalizedPresentCharacters;
    changes.push({
      path: `${RELATIONSHIP_SYSTEM_KEY}.${PRESENT_CHARACTERS_KEY}`,
      message: `${RELATIONSHIP_SYSTEM_KEY}.${PRESENT_CHARACTERS_KEY} 已校准为 ${
        normalizedPresentCharacters.join('、') || '空列表'
      }。`,
    });
  }

  return {
    changed: changes.length > 0,
    changes,
  };
}

function mergeRelationshipData(existingValue: unknown, incomingValue: unknown) {
  const existingData = asRecord(existingValue);
  const incomingData = asRecord(incomingValue);
  if (existingData === null) {
    return incomingValue;
  }
  if (incomingData === null) {
    return existingValue;
  }

  const merged: Record<string, unknown> = { ...existingData, ...incomingData };
  const existingAffection = toFiniteNumber(existingData['好感度']);
  const incomingAffection = toFiniteNumber(incomingData['好感度']);
  if (existingAffection !== null || incomingAffection !== null) {
    merged['好感度'] = Math.max(existingAffection ?? 0, incomingAffection ?? 0);
  }

  return merged;
}

function uniqueCharacterNames(names: string[]) {
  return Array.from(new Set(names.filter(name => name.length > 0)));
}

function areStringArraysEqual(left: unknown[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function toFiniteNumber(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
