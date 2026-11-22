import { CORE_CHARACTER_ALIASES, CORE_CHARACTER_NAMES } from './generated/core-character-aliases';

export function normalizeCharacterDataName(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[{}·・•‧∙･．.\s_\-—–（）()[\]【】《》〈〉「」『』“”"']/g, '')
    .toLowerCase();
}

const characterNames = new Map<string, string>([
  ...Object.entries(CORE_CHARACTER_ALIASES).map(([alias, name]): [string, string] => [
    normalizeCharacterDataName(alias),
    name,
  ]),
  ...CORE_CHARACTER_NAMES.map((name): [string, string] => [normalizeCharacterDataName(name), name]),
]);

/** 本体数据库的姓名／形态解析，仅用于资料展示，不参与发起性斗时的对手选择。 */
export function resolveCharacterDataName(value: string) {
  return characterNames.get(normalizeCharacterDataName(value)) ?? null;
}
