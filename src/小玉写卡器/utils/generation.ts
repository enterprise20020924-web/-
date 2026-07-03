import type {
  PersonaOnlyMode,
  PersonaOnlyResult,
  RoleDraft,
  RoleResult,
  StagePersonas,
  WorldviewResult,
} from '../types';
import { buildAdaptedOrderedPrompts, getPresetKnowledge } from './presetAdapter';
import { extractContent, extractTag, hasTag, normalizeRoleName, splitAliases, stripCodeFence } from './parser';
import { condensedPaletteRoleKnowledge } from './roleKnowledge';

const worldKnowledgeIds = ['13', '39'];

const artifactTerms = [
  { label: '待补充', pattern: /待补充/u },
  { label: '用户手写', pattern: /用户手写/u },
  { label: '内部任务词', pattern: /当前任务/u },
  { label: '写卡器工具名', pattern: /一键角色卡写卡器|玉藻前写卡器/u },
  { label: '工程占位词', pattern: /模板|提示词|工程词|占位符|placeholder/iu },
  {
    label: '内部标签',
    pattern:
      /<\/?(?:thinking|content|role_result|worldview_result|persona_result|role_name|aliases|basic|palette|reinterpret|quick_view|multistage_persona|stage_early|stage_middle|stage_close|stage_common)\b/iu,
  },
  {
    label: '内置任务标签',
    pattern: /one_click_card_writer_task|selected_template_knowledge|task_scope|task_reference/iu,
  },
  { label: '前端流程词', pattern: /前端会|工具会|生成器|代码会/u },
];

export interface GenerationRetryOptions {
  avoidTerms?: string[];
}

interface LenientTagOptions {
  allowEmpty?: boolean;
  fallback: string;
}

async function callAdaptedPreset(userInput: string, taskInstruction: string, knowledge: string): Promise<string> {
  const orderedPrompts = buildAdaptedOrderedPrompts({ userInput, taskInstruction, knowledge });
  return generateRaw({
    user_input: userInput,
    ordered_prompts: orderedPrompts,
    overrides: {
      world_info_before: '',
      persona_description: '',
      char_description: '',
      char_personality: '',
      scenario: '',
      world_info_after: '',
      dialogue_examples: '',
      chat_history: {
        with_depth_entries: false,
        author_note: '',
        prompts: [],
      },
    },
    max_chat_history: 0,
    should_silence: true,
  });
}

function addWarning(warnings: string[], message: string) {
  if (!warnings.includes(message)) warnings.push(message);
}

function fallbackContent(value: string, fallback: string): string {
  return stripCodeFence(value).trim() || fallback;
}

function inlineSummary(value: string, fallback: string): string {
  const summary = stripCodeFence(value)
    .replace(/<\/?[^>]+>/gu, ' ')
    .split(/\r?\n/u)
    .map(line => line.trim())
    .find(Boolean);
  return (summary || fallback).slice(0, 80);
}

function collectContentWarnings(label: string, content: string, warnings: string[]): void {
  if (!content.trim()) {
    addWarning(warnings, `${label}为空，已用保底内容继续处理，请人工校对。`);
    return;
  }
  const hit = artifactTerms
    .map(term => ({ term, match: content.match(term.pattern)?.[0] }))
    .find(result => result.match);
  if (hit) {
    addWarning(warnings, `${label}包含工程词或占位内容：${hit.term.label}（${hit.match}），已继续处理，请人工校对。`);
  }
}

function retryInstruction(options: GenerationRetryOptions = {}): string[] {
  const terms = Array.from(new Set((options.avoidTerms ?? []).map(term => term.trim()).filter(Boolean)));
  if (terms.length === 0) return [];
  return [
    `上次生成因为成品中出现这些工程/占位表达而失败：${terms.join('、')}。`,
    '本次必须把相关意思改写成角色或世界观内部的自然表述，不得再次出现这些表达，也不要解释规避过程。',
  ];
}

function readTagLenient(
  value: string,
  tag: string,
  label: string,
  warnings: string[],
  options: LenientTagOptions,
): string {
  if (!hasTag(value, tag)) {
    addWarning(warnings, `标签异常：缺少 ${label}，已用可解析的原始输出继续。`);
    return options.fallback;
  }
  const content = extractTag(value, tag);
  if (!options.allowEmpty && !content.trim()) {
    addWarning(warnings, `标签异常：${label} 为空，已用保底内容继续。`);
    return options.fallback;
  }
  return content;
}

function parseStagePersonas(multistagePersona: string, warnings: string[], fallback: string): StagePersonas {
  const normalized = fallbackContent(multistagePersona, fallback);
  const stageFallback = fallbackContent(normalized, fallback);
  return {
    early: readTagLenient(normalized, 'stage_early', '<stage_early>', warnings, { fallback: stageFallback }),
    middle: readTagLenient(normalized, 'stage_middle', '<stage_middle>', warnings, { fallback: stageFallback }),
    close: readTagLenient(normalized, 'stage_close', '<stage_close>', warnings, { fallback: stageFallback }),
    common: readTagLenient(normalized, 'stage_common', '<stage_common>', warnings, { allowEmpty: true, fallback: '' }),
  };
}

function formatStagePersonas(stagePersonas: StagePersonas): string {
  return [
    '初识期 0~30',
    stagePersonas.early.trim(),
    '',
    '熟悉期 31~70',
    stagePersonas.middle.trim(),
    '',
    '亲近期 71~100',
    stagePersonas.close.trim(),
    ...(stagePersonas.common.trim() ? ['', '跨阶段通用', stagePersonas.common.trim()] : []),
  ].join('\n');
}

export async function generateWorldview(seed: string, options: GenerationRetryOptions = {}): Promise<WorldviewResult> {
  const userInput = ['【世界观模块】', '请根据下面的用户素材生成可直接写入世界书的世界观设定。', '', seed.trim()].join(
    '\n',
  );
  const taskInstruction = [
    '生成世界观条目。',
    '你正在适配秋青子写卡预设，不得另建预设结构。',
    '允许在不推翻用户明确设定的前提下做合理化补充：补足命名、因果、边界和规则。',
    '不要和用户对话，不要询问下一步。',
    ...retryInstruction(options),
    '输出必须放在 <content><worldview_result>...</worldview_result></content> 中。',
    'worldview_result 内使用中文 YAML，不要写解释。',
  ].join('\n');
  const knowledge = getPresetKnowledge(worldKnowledgeIds);
  const raw = await callAdaptedPreset(userInput, taskInstruction, knowledge);
  const warnings: string[] = [];
  const contentBlock = extractContent(raw);
  const content = readTagLenient(contentBlock, 'worldview_result', '<worldview_result>', warnings, {
    fallback: fallbackContent(contentBlock, raw.trim() || seed.trim()),
  });
  collectContentWarnings('世界观条目', content, warnings);
  return { content, raw, warnings };
}

export async function generatePersonaOnly(
  seed: string,
  mode: PersonaOnlyMode,
  options: GenerationRetryOptions = {},
): Promise<PersonaOnlyResult> {
  const isMultistage = mode === 'multistage';
  const userInput = [
    '【单独人设素材】',
    '请只根据下面的人设信息生成人设正文，不写世界观和写入配置。',
    '',
    seed.trim(),
  ].join('\n');
  const taskInstruction = [
    isMultistage ? '生成多阶段调色盘人设。' : '生成普通性格调色盘人设。',
    '你正在适配秋青子写卡预设的人设写法，但本任务是独立功能，不生成完整角色卡。',
    '只输出可直接复制的人设正文，不生成世界书条目、基础信息、角色速览、MVU、EJS、正则或写入说明。',
    '允许在不推翻用户明确设定的前提下做合理化补充：补足行为逻辑、关系触发、压力状态和二次解释。',
    '可写入字段内禁止出现内部流程说明、占位说明、标签说明或创作说明。',
    '不要和用户对话，不要询问下一步。',
    ...retryInstruction(options),
    isMultistage
      ? '输出必须放在 <content><persona_result><multistage_persona>...</multistage_persona></persona_result></content> 中。'
      : '输出必须放在 <content><persona_result><palette>...</palette></persona_result></content> 中。',
    isMultistage
      ? [
          '<multistage_persona> 内必须包含以下子标签：',
          '<stage_early>初识期 0~30 的调色盘头部、专属衍生、专属二次解释</stage_early>',
          '<stage_middle>熟悉期 31~70 的调色盘头部、专属衍生、专属二次解释</stage_middle>',
          '<stage_close>亲近期 71~100 的调色盘头部、专属衍生、专属二次解释</stage_close>',
          '<stage_common>跨阶段通用衍生、通用二次解释、总结；没有则留空</stage_common>',
        ].join('\n')
      : '<palette> 内只写普通调色盘正文：底色、主色调、点缀、衍生、压力状态、关系触发和二次解释。',
    '所有子标签必须闭合，标签外不要输出解释。',
  ].join('\n');
  const raw = await callAdaptedPreset(userInput, taskInstruction, condensedPaletteRoleKnowledge);
  const warnings: string[] = [];
  const contentBlock = extractContent(raw);
  const resultBlock = readTagLenient(contentBlock, 'persona_result', '<persona_result>', warnings, {
    fallback: fallbackContent(contentBlock, raw.trim() || seed.trim()),
  });

  if (!isMultistage) {
    const content = readTagLenient(resultBlock, 'palette', '<palette>', warnings, {
      fallback: fallbackContent(resultBlock, seed.trim()),
    });
    collectContentWarnings('普通调色盘人设', content, warnings);
    return { mode, content, raw, warnings };
  }

  const multistagePersona = readTagLenient(resultBlock, 'multistage_persona', '<multistage_persona>', warnings, {
    fallback: fallbackContent(resultBlock, seed.trim()),
  });
  const stagePersonas = parseStagePersonas(multistagePersona, warnings, multistagePersona);
  [
    ['初识期多阶段人设', stagePersonas.early],
    ['熟悉期多阶段人设', stagePersonas.middle],
    ['亲近期多阶段人设', stagePersonas.close],
  ].forEach(([label, field]) => collectContentWarnings(label, field, warnings));
  if (stagePersonas.common.trim()) collectContentWarnings('跨阶段通用内容', stagePersonas.common, warnings);
  return { mode, content: formatStagePersonas(stagePersonas), raw, warnings };
}

export async function generateRole(
  draft: RoleDraft,
  worldContent: string,
  index: number,
  options: GenerationRetryOptions = {},
): Promise<RoleResult> {
  const fallbackName = draft.name.trim() || `角色${index + 1}`;
  const userInput = [
    `【${draft.label}】`,
    `角色临时名称：${fallbackName}`,
    '',
    '【已生成世界观】',
    worldContent.trim(),
    '',
    '【用户角色素材】',
    draft.seed.trim(),
  ].join('\n');
  const taskInstruction = [
    '生成一个完整角色的写卡条目。',
    '你正在适配秋青子写卡预设，不得另建预设结构。',
    '允许在不推翻用户明确设定的前提下做合理化补充：补足身份、关系、行为逻辑、调色盘衍生和二次解释。',
    '角色多阶段人设只产出中文正文；固定 EJS 结构会在写入阶段包裹这些正文。',
    '默认用好感度划分三个阶段：初识期 0~30，熟悉期 31~70，亲近期 71~100。若用户素材给出其他阶段，以用户为准。',
    '可写入字段内禁止出现内部流程说明、占位说明、标签说明或创作说明。',
    '不要和用户对话，不要询问下一步。',
    ...retryInstruction(options),
    '输出必须放在 <content><role_result>...</role_result></content> 中，并包含以下子标签：',
    '<role_name>角色正式名</role_name>',
    '<aliases>英文逗号分隔的角色名、昵称、外号</aliases>',
    '<basic>角色基础信息 YAML</basic>',
    '<palette>性格调色盘正文</palette>',
    '<reinterpret>二次解释正文</reinterpret>',
    '<multistage_persona>',
    '<stage_early>初识期 0~30 的调色盘头部、专属衍生、专属二次解释</stage_early>',
    '<stage_middle>熟悉期 31~70 的调色盘头部、专属衍生、专属二次解释</stage_middle>',
    '<stage_close>亲近期 71~100 的调色盘头部、专属衍生、专属二次解释</stage_close>',
    '<stage_common>跨阶段通用衍生、通用二次解释、总结；没有则留空</stage_common>',
    '</multistage_persona>',
    '<quick_view>角色速览单项 YAML</quick_view>',
    '所有子标签必须闭合。',
  ].join('\n');
  const knowledge = condensedPaletteRoleKnowledge;
  const raw = await callAdaptedPreset(userInput, taskInstruction, knowledge);
  const warnings: string[] = [];
  const content = extractContent(raw);
  const roleBlock = readTagLenient(content, 'role_result', '<role_result>', warnings, {
    fallback: fallbackContent(content, raw.trim() || draft.seed.trim() || fallbackName),
  });
  const name = normalizeRoleName(
    readTagLenient(roleBlock, 'role_name', '<role_name>', warnings, { fallback: fallbackName }),
    fallbackName,
  );
  const aliases = Array.from(
    new Set([name, ...splitAliases(readTagLenient(roleBlock, 'aliases', '<aliases>', warnings, { fallback: name }))]),
  );
  const basic = readTagLenient(roleBlock, 'basic', '<basic>', warnings, {
    fallback: fallbackContent(roleBlock, draft.seed.trim() || fallbackName),
  });
  const palette = readTagLenient(roleBlock, 'palette', '<palette>', warnings, { fallback: basic });
  const reinterpret = readTagLenient(roleBlock, 'reinterpret', '<reinterpret>', warnings, { fallback: palette });
  const multistageFallback = fallbackContent([palette, reinterpret].filter(Boolean).join('\n\n'), basic);
  const multistagePersona = readTagLenient(roleBlock, 'multistage_persona', '<multistage_persona>', warnings, {
    fallback: multistageFallback,
  });
  const quickView = readTagLenient(roleBlock, 'quick_view', '<quick_view>', warnings, {
    fallback: ['- 名称: ' + name, `  简述: ${inlineSummary(basic, '详见角色详细条目')}`].join('\n'),
  });
  const stagePersonas = parseStagePersonas(multistagePersona, warnings, multistageFallback);

  [
    ['角色基础信息', basic],
    ['性格调色盘', palette],
    ['二次解释', reinterpret],
    ['初识期多阶段人设', stagePersonas.early],
    ['熟悉期多阶段人设', stagePersonas.middle],
    ['亲近期多阶段人设', stagePersonas.close],
    ['角色速览', quickView],
  ].forEach(([label, field]) => collectContentWarnings(label, field, warnings));
  if (stagePersonas.common.trim()) collectContentWarnings('跨阶段通用内容', stagePersonas.common, warnings);

  return {
    draft,
    name,
    aliases,
    basic,
    palette,
    reinterpret,
    multistagePersona,
    stagePersonas,
    quickView,
    raw,
    warnings,
  };
}
