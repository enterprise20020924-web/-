import definition from './narrative-display-rule.json';

const rule: TavernRegex = {
  id: definition.id,
  script_name: definition.scriptName,
  enabled: true,
  find_regex: definition.findRegex,
  replace_string: definition.replaceString,
  trim_strings: '',
  source: { user_input: false, ai_output: true, slash_command: false, world_info: false },
  destination: { display: true, prompt: false },
  run_on_edit: true,
  min_depth: null,
  max_depth: null,
};

/** One rule on this character. An unchanged rule never writes settings/reloads chat. */
export async function installNarrativeDisplayRule() {
  const character = SillyTavern.characters[Number(SillyTavern.characterId)];
  if (character === undefined) return;
  const option = { type: 'character' as const, name: character.avatar };
  const needsEnable = !isCharacterTavernRegexesEnabled();
  if (needsEnable) {
    const allowed = (SillyTavern.extensionSettings.character_allowed_regex ??= []) as string[];
    allowed.push(character.avatar);
    void SillyTavern.saveSettingsDebounced();
  }
  const regexes = getTavernRegexes(option);
  // Helper returns trim_strings as [] on newer versions; the local declaration uses ''.
  const expected = _.omit(rule, ['trim_strings']);
  if (regexes[0]?.id === rule.id && _.isMatch(regexes[0], expected)) {
    if (needsEnable) {
      const visible = $('#chat > .mes[is_user="false"][is_system="false"]').slice(-3).toArray();
      await Promise.all(visible.map(element => refreshOneMessage(Number(element.getAttribute('mesid')))));
    }
    return;
  }
  await updateTavernRegexesWith(current => [rule, ...current.filter(item => item.id !== rule.id)], option);
}
