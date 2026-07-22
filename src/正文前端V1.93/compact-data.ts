import type { CharacterSkillTuple } from './character-skills';
import type { CharacterBattleStats } from './character-stats';
import { decodeGzipJson } from './compressed-json';
import { V191_DATA_PAYLOAD } from './generated/v191DataPayload';

interface V191CompactData {
  characterSkills: Array<[string, CharacterSkillTuple[]]>;
  characterStats: CharacterBattleStats[];
}

export const compactV191Data = await decodeGzipJson<V191CompactData>(V191_DATA_PAYLOAD);
