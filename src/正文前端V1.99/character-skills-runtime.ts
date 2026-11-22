import type { CharacterSkillEntry, CharacterSkillTuple } from './character-skills';
import { normalizeCharacterDataName, resolveCharacterDataName } from './character-name-runtime';

export function createCharacterSkillResolver(characterSkillEntries: Array<[string, CharacterSkillTuple[]]>) {
  const characterSkillMap = new Map(
    characterSkillEntries.map(([name, skills]) => [normalizeCharacterDataName(name), skills.map(createSkillEntry)]),
  );
  const skillsByCanonicalName = new Map<string, CharacterSkillEntry[]>();
  for (const [name] of characterSkillEntries) {
    const key = normalizeCharacterDataName(name);
    const canonicalKey = normalizeCharacterDataName(resolveCharacterDataName(name) ?? name);
    if (!skillsByCanonicalName.has(canonicalKey) || key === canonicalKey) {
      skillsByCanonicalName.set(canonicalKey, characterSkillMap.get(key)!);
    }
  }
  const skillPrefixes = [...characterSkillMap].sort(([left], [right]) => right.length - left.length);

  return function resolveCharacterSkillEntries(candidates: string[]) {
    const names = uniqueNonEmpty(candidates);
    const normalizedCandidates = names.map(normalizeCharacterDataName);

    for (const candidate of names) {
      const canonicalName = resolveCharacterDataName(candidate);
      const canonicalMatch =
        canonicalName === null ? undefined : skillsByCanonicalName.get(normalizeCharacterDataName(canonicalName));
      if (canonicalMatch !== undefined) return canonicalMatch;
      const directMatch = characterSkillMap.get(normalizeCharacterDataName(candidate));
      if (directMatch !== undefined) {
        return directMatch;
      }
    }

    for (const [key, entries] of skillPrefixes) {
      if (
        normalizedCandidates.some(
          candidate => candidate.length >= 3 && (key.startsWith(candidate) || candidate.startsWith(key)),
        )
      ) {
        return entries;
      }
    }

    return [];
  };
}

function createSkillEntry(skill: CharacterSkillTuple): CharacterSkillEntry {
  return {
    name: skill[0],
    type: skill[1],
    cost: skill[2],
    cooldown: skill[3],
    accuracy: skill[4],
    critical: skill[5],
    combo: skill[6],
    damageFormula: skill[7],
    buffs: skill[8],
    effect: skill[9],
  };
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(value => value?.trim() ?? '').filter(value => value.length > 0)));
}
