import type { RoleDraft, RoleResult, StagePersonas, WorldviewResult } from '../types';
import { buildAdaptedOrderedPrompts, getPresetKnowledge } from './presetAdapter';
import { extractContent, extractTag, hasTag, normalizeRoleName, splitAliases, stripCodeFence } from './parser';
import { condensedPaletteRoleKnowledge } from './roleKnowledge';

const worldKnowledgeIds = ['13', '39'];

const artifactTerms = [
  { label: '待补充', pattern: /待补充/u },
  { label: '用户手写', pattern: /用户手写/u },
  { label: '内部任务词', pattern: /当前任务/u },
  { label: '一键角色卡写卡器', pattern: /一键角色卡写卡器/u },
  { label: '工程占位词', pattern: /模板|提示词|工程词|占位符|placeholder/iu },
  { label: '内部标签', pattern: /<\/?(?:thinking|content|role_result|worldview_result|stage_early|stage_middle|stage_close|stage_common)\b/iu },
  { label: '内置任务标签', pattern: /one_click_card_writer_task|selected_template_knowledge|task_scope|task_reference/iu },
  { label: '前端流程词', pattern: /前端会|工具会|生成器|代码会/u },
];

export interface GenerationRetryOptions {
  avoidTerms?: string[];
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

function assertCleanContent(label: string, content: string): void {
  if (!content.trim()) throw new Error(`${label}为空，需重新生成`);
  const hit = artifactTerms
    .map(term => ({ term, match: content.match(term.pattern)?.[0] }))
    .find(result => result.match);
  if (hit) throw new Error(`${label}包含工程词或占位内容：${hit.term.label}（${hit.match}），需重新生成`);
}

function retryInstruction(options: GenerationRetryOptions = {}): string[] {
  const terms = Array.from(new Set((options.avoidTerms ?? []).map(term => term.trim()).filter(Boolean)));
  if (terms.length === 0) return [];
  return [
    `上次生成因为成品中出现这些工程/占位表达而失败：${terms.join('、')}。`,
    '本次必须把相关意思改写成角色或世界观内部的自然表述，不得再次出现这些表达，也不要解释规避过程。',
  ];
}

function requiredTag(value: string, tag: string, label: string, options: { allowEmpty?: boolean } = {}): string {
  if (!hasTag(value, tag)) throw new Error(`角色生成缺少 ${label}，需重新生成`);
  const content = extractTag(value, tag);
  if (!options.allowEmpty && !content.trim()) throw new Error(`角色生成缺少 ${label}，需重新生成`);
  return content;
}

function parseStagePersonas(multistagePersona: string): StagePersonas {
  const normalized = stripCodeFence(multistagePersona);
  return {
    early: requiredTag(normalized, 'stage_early', '<stage_early>'),
    middle: requiredTag(normalized, 'stage_middle', '<stage_middle>'),
    close: requiredTag(normalized, 'stage_close', '<stage_close>'),
    common: requiredTag(normalized, 'stage_common', '<stage_common>', { allowEmpty: true }),
  };
}

export async function generateWorldview(seed: string, options: GenerationRetryOptions = {}): Promise<WorldviewResult> {
  const userInput = [
    '【世界观模块】',
    '请根据下面的用户素材生成可直接写入世界书的世界观设定。',
    '',
    seed.trim(),
  ].join('\n');
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
  const contentBlock = extractContent(raw);
  if (!hasTag(contentBlock, 'worldview_result')) throw new Error('世界观生成缺少 <worldview_result>，需重新生成');
  const content = extractTag(contentBlock, 'worldview_result');
  assertCleanContent('世界观条目', content);
  return { content, raw };
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
  const content = extractContent(raw);
  const roleBlock = requiredTag(content, 'role_result', '<role_result>');
  const name = normalizeRoleName(requiredTag(roleBlock, 'role_name', '<role_name>'), fallbackName);
  const aliases = Array.from(new Set([name, ...splitAliases(requiredTag(roleBlock, 'aliases', '<aliases>'))]));
  const basic = requiredTag(roleBlock, 'basic', '<basic>');
  const palette = requiredTag(roleBlock, 'palette', '<palette>');
  const reinterpret = requiredTag(roleBlock, 'reinterpret', '<reinterpret>');
  const multistagePersona = requiredTag(roleBlock, 'multistage_persona', '<multistage_persona>');
  const quickView = requiredTag(roleBlock, 'quick_view', '<quick_view>');
  const stagePersonas = parseStagePersonas(multistagePersona);

  [
    ['角色基础信息', basic],
    ['性格调色盘', palette],
    ['二次解释', reinterpret],
    ['初识期多阶段人设', stagePersonas.early],
    ['熟悉期多阶段人设', stagePersonas.middle],
    ['亲近期多阶段人设', stagePersonas.close],
    ['角色速览', quickView],
  ].forEach(([label, field]) => assertCleanContent(label, field));
  if (stagePersonas.common.trim()) assertCleanContent('跨阶段通用内容', stagePersonas.common);

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
  };
}
