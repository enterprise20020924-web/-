import { coreCharacterData } from './compact-data';
import { normalizeCharacterDataName, resolveCharacterDataName } from './character-name-runtime';

export const characterBattleStats = coreCharacterData.characterStats;

const statsByName = new Map(characterBattleStats.map(stats => [normalizeCharacterDataName(stats.name), stats]));

export function resolveCharacterBattleStats(candidates: string[]) {
  for (const candidate of candidates) {
    const name = resolveCharacterDataName(candidate) ?? candidate;
    const stats = statsByName.get(normalizeCharacterDataName(name));
    if (stats !== undefined) return stats;
  }
  return null;
}
