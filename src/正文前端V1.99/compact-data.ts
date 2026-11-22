import type { CharacterSkillTuple } from './character-skills';
import type { CharacterBattleStats } from './character-stats';
import { decodeGzipJson } from './compressed-json';
import { CORE_CHARACTER_DATA_PAYLOAD } from './generated/core-character-data';

interface CoreCharacterData {
  characterSkills: Array<[string, CharacterSkillTuple[]]>;
  characterStats: CharacterBattleStats[];
}

export const coreCharacterData = await decodeGzipJson<CoreCharacterData>(CORE_CHARACTER_DATA_PAYLOAD);
