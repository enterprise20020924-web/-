import regexThinkingRaw from '../assets/regex-仅格式思维链.json?raw';
import regexLatestMvuRaw from '../assets/regex-只发送最新2楼的变量更新.json?raw';
import regexMvuDoneRaw from '../assets/regex-[美化]变量完成-三明月喵.json?raw';
import regexMvuPendingRaw from '../assets/regex-[美化]变量更新中-三明月喵.json?raw';

interface PresetRegexAsset {
  id: string;
  scriptName: string;
  findRegex: string;
  replaceString: string;
  trimStrings?: string[] | string;
  placement?: number[];
  disabled?: boolean;
  markdownOnly?: boolean;
  promptOnly?: boolean;
  runOnEdit?: boolean;
  minDepth?: number | null;
  maxDepth?: number | null;
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parsePresetRegex(raw: string): PresetRegexAsset {
  return JSON.parse(raw) as PresetRegexAsset;
}

function normalizeTrimStrings(value: PresetRegexAsset['trimStrings']): string {
  if (Array.isArray(value)) return value.join('');
  return value ?? '';
}

function wrapFrontendCodeBlock(html: string): string {
  const trimmed = html.trim();
  if (/^```/u.test(trimmed)) return trimmed;
  return ['```html', trimmed, '```'].join('\n');
}

function convertPresetRegex(asset: PresetRegexAsset): TavernRegex {
  const placement = asset.placement ?? [];
  return {
    id: asset.id,
    script_name: asset.scriptName,
    enabled: true,
    scope: 'character',
    find_regex: asset.findRegex,
    replace_string: asset.replaceString,
    trim_strings: normalizeTrimStrings(asset.trimStrings),
    source: {
      user_input: placement.includes(1),
      ai_output: placement.includes(2),
      slash_command: false,
      world_info: false,
    },
    destination: {
      display: asset.markdownOnly === true,
      prompt: asset.promptOnly === true,
    },
    run_on_edit: asset.runOnEdit ?? false,
    min_depth: asset.minDepth ?? null,
    max_depth: asset.maxDepth ?? null,
  };
}

function buildStatusDisplayRegex(html: string): TavernRegex {
  const scriptName = '一键生卡_MVU状态栏';
  const regex: TavernRegex = {
    id: randomId('qz-card-status'),
    script_name: scriptName,
    enabled: true,
    scope: 'character',
    find_regex: '/<StatusPlaceHolderImpl\\/>/g',
    replace_string: wrapFrontendCodeBlock(html),
    trim_strings: '',
    source: {
      user_input: false,
      ai_output: true,
      slash_command: false,
      world_info: false,
    },
    destination: {
      display: true,
      prompt: false,
    },
    run_on_edit: true,
    min_depth: null,
    max_depth: null,
  };
  return regex;
}

function buildStatusPromptRegex(): TavernRegex {
  return {
    id: randomId('qz-card-status-hide'),
    script_name: '一键生卡_隐藏状态栏标记',
    enabled: true,
    scope: 'character',
    find_regex: '/<StatusPlaceHolderImpl\\/>/g',
    replace_string: '',
    trim_strings: '',
    source: {
      user_input: false,
      ai_output: true,
      slash_command: false,
      world_info: false,
    },
    destination: {
      display: false,
      prompt: true,
    },
    run_on_edit: true,
    min_depth: null,
    max_depth: null,
  };
}

export async function installMvuRegexes(statusHtml: string): Promise<void> {
  const regexesToInstall = [
    convertPresetRegex(parsePresetRegex(regexThinkingRaw)),
    convertPresetRegex(parsePresetRegex(regexLatestMvuRaw)),
    convertPresetRegex(parsePresetRegex(regexMvuDoneRaw)),
    convertPresetRegex(parsePresetRegex(regexMvuPendingRaw)),
    buildStatusPromptRegex(),
    buildStatusDisplayRegex(statusHtml),
  ];
  const scriptNames = new Set(regexesToInstall.map(regex => regex.script_name));

  await updateTavernRegexesWith(
    regexes => [...regexes.filter(item => !scriptNames.has(item.script_name)), ...regexesToInstall],
    { scope: 'character' },
  );
}
