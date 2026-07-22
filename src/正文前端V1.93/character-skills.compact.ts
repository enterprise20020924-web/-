import { compactV191Data } from './compact-data';
import { createCharacterSkillResolver } from './character-skills-runtime';

export const resolveCharacterSkillEntries = createCharacterSkillResolver(compactV191Data.characterSkills);
