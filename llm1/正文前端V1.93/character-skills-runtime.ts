import type { CharacterSkillEntry, CharacterSkillTuple } from './character-skills';

export function createCharacterSkillResolver(characterSkillEntries: Array<[string, CharacterSkillTuple[]]>) {
  const characterSkillMap = new Map(
    characterSkillEntries.map(([name, skills]) => [normalizeSkillLookupText(name), skills.map(createSkillEntry)]),
  );

  return function resolveCharacterSkillEntries(candidates: string[]) {
    const normalizedCandidates = uniqueNonEmpty(candidates).map(normalizeSkillLookupText);

    for (const candidate of normalizedCandidates) {
      const directMatch = characterSkillMap.get(candidate);
      if (directMatch !== undefined) {
        return directMatch;
      }
    }

    for (const [key, entries] of characterSkillMap) {
      if (
        normalizedCandidates.some(candidate =>
          candidate.length >= 3 && (key.startsWith(candidate) || candidate.startsWith(key)),
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

function normalizeSkillLookupText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[·・•\s_\-—–（）()[\]【】《》〈〉「」『』“”"']/g, '')
    .trim()
    .toLowerCase();
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(value => value?.trim() ?? '').filter(value => value.length > 0)));
}
