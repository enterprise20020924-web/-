import { coreCharacterData } from './compact-data';
import { createCharacterSkillResolver } from './character-skills-runtime';

export const resolveCharacterSkillEntries = createCharacterSkillResolver(coreCharacterData.characterSkills);
