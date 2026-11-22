/** 仅用于两个已编写身份的预制 input，不扫描或改写玩家的一般输入。 */
const PRESET_CHARACTER_ALIASES: Record<string, string> = {
  神崎: '神崎凛',
  响木: '响木天音',
  天音: '响木天音',
  苍蓝星: '响木天音',
  维多利亚: '维多利亚戈德温',
  莎拉: '莎拉斯通',
};

export function canonicalPresetRgbName(name: string) {
  return PRESET_CHARACTER_ALIASES[name] ?? name;
}

const PRESET_CHARACTER_NAMES = [
  '神崎凛',
  '神崎',
  '响木天音',
  '响木',
  '天音',
  '维多利亚戈德温',
  '维多利亚',
  '莎拉斯通',
  '莎拉',
  '苍蓝星',
  '阿斯特赖亚',
  '塞蕾娜克西娅',
];

export function wrapIdentityPresetRgbNames(
  input: string,
  identityId: string | null | undefined,
  playerName?: string | null,
) {
  if (identityId !== 'f_magic_girl' && identityId !== 'f_gyaru') return input;
  const names = [...new Set([...PRESET_CHARACTER_NAMES, playerName?.trim() ?? ''])]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  const pattern = new RegExp(names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gu');
  // 已有 RGB 整段保留，其余标签与属性也不改写，只包装可见文本里的已知名字。
  return input
    .split(/(<RGB\s*>[^<>]*<\/RGB\s*>|<[^>]*>)/gi)
    .map(part => (part.startsWith('<') ? part : part.replace(pattern, name => `<RGB>${name}</RGB>`)))
    .join('');
}

export function buildIdentityOpeningInput(
  characterDescription: string,
  openingStory: string | undefined,
  identityId: string | null | undefined,
  playerName: string,
) {
  const input = openingStory
    ? `${characterDescription}\n\n<amami_opening_instruction>\n${openingStory}\n</amami_opening_instruction>`
    : characterDescription;
  return wrapIdentityPresetRgbNames(input, identityId, playerName);
}
