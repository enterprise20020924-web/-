import definition from './narrative-display-rule.json';
import battleDefinition from '../battle/battle-display-rule.json';
import openingDefinition from '../opening/opening-display-rule.json';
import { stripCotBlocksForStructure } from './content-blocks';

const definitions = [openingDefinition, battleDefinition, definition];
const displayRules = definitions.map(item => {
  const separator = item.findRegex.lastIndexOf('/');
  return {
    pattern: new RegExp(item.findRegex.slice(1, separator), item.findRegex.slice(separator + 1)),
    replacement: item.replaceString,
  };
});

/** Runs on a display copy before Tavern's formatter; never changes chat or prompt text. */
export function addScriptDisplaySlots(source: string) {
  // Thinking can contain incomplete examples of <content> and <option>.
  // The thinking viewer reads the original message; display boundaries use the actual story only.
  const displaySource = stripCotBlocksForStructure(source);
  return displayRules.reduce((text, rule) => text.replace(rule.pattern, rule.replacement), displaySource);
}

/** Older forks persisted these three rules. The runtime now owns their replacements. */
export async function removeLegacyDisplayRules() {
  const character = SillyTavern.characters[Number(SillyTavern.characterId)];
  if (character === undefined) return;
  const option = { type: 'character' as const, name: character.avatar };
  const regexes = getTavernRegexes(option);
  const ids = new Set(definitions.map(item => item.id));
  if (!regexes.some(item => ids.has(item.id))) return;
  await updateTavernRegexesWith(current => current.filter(item => !ids.has(item.id)), option);
}
