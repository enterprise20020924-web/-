import type {
  OpeningResult,
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
const openingKnowledgeIds = ['24', '39'];
const sourceChunkChars = 20000;
const mergeTargetChars = 20000;
const mergeBatchChars = 20000;
const activeGenerationIds = new Set<string>();
let writerGenerationStopRequested = false;
const statusPlaceholder = '<StatusPlaceHolderImpl/>';

const artifactTerms = [
  { label: '待补充', pattern: /待补充/u },
  { label: '用户手写', pattern: /用户手写/u },
  { label: '内部任务词', pattern: /当前任务/u },
  { label: '一键角色卡写卡器', pattern: /一键角色卡写卡器/u },
  { label: '工程占位词', pattern: /模板|提示词|工程词|占位符|placeholder/iu },
  {
    label: '内部标签',
    pattern:
      /<\/?(?:thinking|content|role_result|worldview_result|opening_result|persona_result|role_name|aliases|basic|palette|reinterpret|quick_view|multistage_persona|stage_early|stage_middle|stage_close|stage_common)\b/iu,
  },
  {
    label: '内置任务标签',
    pattern: /one_click_card_writer_task|selected_template_knowledge|task_scope|task_reference/iu,
  },
  { label: '前端流程词', pattern: /前端会|工具会|生成器|代码会/u },
];

export interface GenerationRetryOptions {
  avoidTerms?: string[];
  shouldStream?: boolean;
  autoContinue?: boolean;
  onProgress?: (progress: GenerationProgress) => void;
  onHeartbeat?: (heartbeat: GenerationHeartbeat) => void;
  requestContinuation?: (request: ContinuationApprovalRequest) => Promise<boolean>;
}

export interface GenerationProgress {
  phase: 'segment' | 'summary' | 'complete';
  message: string;
  completed: number;
  total: number;
}

export interface GenerationHeartbeat {
  generationId: string;
  active: boolean;
  elapsedMs: number;
  beat: number;
  shouldStream: boolean;
}

export interface ContinuationApprovalRequest {
  attempts: number;
  generated: string;
}

interface LenientTagOptions {
  allowEmpty?: boolean;
  fallback: string;
}

function createGenerationId(): string {
  return `one-click-card-writer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function resetWriterGenerationStop(): void {
  writerGenerationStopRequested = false;
}

export function requestWriterGenerationStop(): boolean {
  writerGenerationStopRequested = true;
  let stopped = false;
  for (const generationId of activeGenerationIds) stopped = stopGenerationById(generationId) || stopped;
  return stopped;
}

export function assertWriterGenerationActive(): void {
  if (writerGenerationStopRequested) throw new Error('已主动停止生成，可重新开始当前阶段');
}

async function requestPresetPart(
  userInput: string,
  orderedPrompts: RolePrompt[],
  options: GenerationRetryOptions,
): Promise<{ text: string; interrupted: boolean }> {
  assertWriterGenerationActive();
  const generationId = createGenerationId();
  const startedAt = Date.now();
  const shouldStream = options.shouldStream ?? false;
  let beat = 0;
  let streamedText = '';
  activeGenerationIds.add(generationId);
  options.onHeartbeat?.({ generationId, active: true, elapsedMs: 0, beat, shouldStream });
  const streamListener = shouldStream
    ? eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (fullText, receivedGenerationId) => {
        if (receivedGenerationId === generationId) streamedText = fullText;
      })
    : null;
  const heartbeatTimer = window.setInterval(() => {
    beat += 1;
    options.onHeartbeat?.({
      generationId,
      active: true,
      elapsedMs: Date.now() - startedAt,
      beat,
      shouldStream,
    });
  }, 1000);

  try {
    const result = await generateRaw({
      generation_id: generationId,
      user_input: userInput,
      ordered_prompts: orderedPrompts,
      should_stream: shouldStream,
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
    assertWriterGenerationActive();
    return { text: typeof result === 'string' ? result : result.content, interrupted: false };
  } catch (error) {
    if (writerGenerationStopRequested) throw new Error('已主动停止生成，可重新开始当前阶段');
    if (streamedText.trim()) return { text: streamedText, interrupted: true };
    throw error;
  } finally {
    streamListener?.stop();
    window.clearInterval(heartbeatTimer);
    activeGenerationIds.delete(generationId);
    options.onHeartbeat?.({
      generationId,
      active: false,
      elapsedMs: Date.now() - startedAt,
      beat,
      shouldStream,
    });
  }
}

function outputNeedsContinuation(text: string, interrupted: boolean): boolean {
  const hasContentStart = /<content(?:\s[^>]*)?>/iu.test(text);
  const hasContentEnd = /<\/content>/iu.test(text);
  if (hasContentStart) return !hasContentEnd;
  return interrupted;
}

function mergeContinuationText(current: string, continuation: string): string {
  const next = continuation.trimStart();
  if (!current) return next;
  const maxOverlap = Math.min(2000, current.length, next.length);
  for (let length = maxOverlap; length >= 24; length -= 1) {
    if (current.slice(-length) === next.slice(0, length)) return `${current}${next.slice(length)}`;
  }
  return `${current}${current.endsWith('\n') ? '' : '\n'}${next}`;
}

function buildContinuationPrompts(basePrompts: RolePrompt[], generated: string): RolePrompt[] {
  return [
    ...basePrompts,
    { role: 'assistant', content: generated },
    {
      role: 'user',
      content: [
        '上轮输出因长度限制或连接中断而未完成。',
        '从上面 assistant 内容最后一个未完成的位置直接继续，不得复述、重写或总结已经生成的部分。',
        '不要重新开启已经存在的 <thinking>、<content> 或内部结果标签；只补完被截断的句子、YAML和标签。',
        '继续到本轮任务完整结束，并确保所有已经开启的 XML 标签全部正确闭合。',
      ].join('\n'),
    },
  ];
}

async function callAdaptedPreset(
  userInput: string,
  taskInstruction: string,
  knowledge: string,
  options: GenerationRetryOptions = {},
): Promise<string> {
  assertWriterGenerationActive();
  const basePrompts = buildAdaptedOrderedPrompts({ userInput, taskInstruction, knowledge });
  let accumulated = '';
  let prompts = basePrompts;
  let continuationsInBatch = 0;

  while (true) {
    const result = await requestPresetPart(userInput, prompts, options);
    accumulated = mergeContinuationText(accumulated, result.text);
    if (!outputNeedsContinuation(accumulated, result.interrupted)) return accumulated;
    if (!options.autoContinue) return accumulated;

    assertWriterGenerationActive();
    if (continuationsInBatch >= 5) {
      const shouldContinue = await options.requestContinuation?.({ attempts: 5, generated: accumulated });
      assertWriterGenerationActive();
      if (!shouldContinue) throw new Error('输出自动续传 5 次后仍未完成，已停止当前阶段');
      continuationsInBatch = 0;
    }

    continuationsInBatch += 1;
    options.onProgress?.({
      phase: 'complete',
      message: `检测到输出截断，正在自动续传：${continuationsInBatch}/5`,
      completed: continuationsInBatch,
      total: 5,
    });
    prompts = buildContinuationPrompts(basePrompts, accumulated);
  }
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

export function parseWorldviewResult(raw: string, fallbackSeed = ''): WorldviewResult {
  const warnings: string[] = [];
  const contentBlock = extractContent(raw);
  const content = readTagLenient(contentBlock, 'worldview_result', '<worldview_result>', warnings, {
    fallback: fallbackContent(contentBlock, raw.trim() || fallbackSeed.trim()),
  });
  collectContentWarnings('世界观条目', content, warnings);
  return { content, raw, warnings };
}

function appendStatusPlaceholder(content: string): string {
  const withoutPlaceholder = content.replace(/<StatusPlaceHolderImpl\s*\/>/giu, '').trim();
  return `${withoutPlaceholder}\n\n${statusPlaceholder}`;
}

export function parseOpeningResult(raw: string, fallbackOutline = ''): OpeningResult {
  const warnings: string[] = [];
  const contentBlock = extractContent(raw);
  const content = readTagLenient(contentBlock, 'opening_result', '<opening_result>', warnings, {
    fallback: fallbackContent(contentBlock, raw.trim() || fallbackOutline.trim()),
  });
  collectContentWarnings('开场白', content, warnings);
  return { content: appendStatusPlaceholder(content), raw, warnings };
}

export function parsePersonaOnlyResult(raw: string, mode: PersonaOnlyMode, fallbackSeed = ''): PersonaOnlyResult {
  const isMultistage = mode === 'multistage';
  const warnings: string[] = [];
  const contentBlock = extractContent(raw);
  const resultBlock = readTagLenient(contentBlock, 'persona_result', '<persona_result>', warnings, {
    fallback: fallbackContent(contentBlock, raw.trim() || fallbackSeed.trim()),
  });

  if (!isMultistage) {
    const content = readTagLenient(resultBlock, 'palette', '<palette>', warnings, {
      fallback: fallbackContent(resultBlock, fallbackSeed.trim()),
    });
    collectContentWarnings('普通调色盘人设', content, warnings);
    return { mode, content, raw, warnings };
  }

  const multistagePersona = readTagLenient(resultBlock, 'multistage_persona', '<multistage_persona>', warnings, {
    fallback: fallbackContent(resultBlock, fallbackSeed.trim()),
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

export function parseRoleResult(raw: string, draft: RoleDraft, index: number): RoleResult {
  const fallbackName = draft.name.trim() || `角色${index + 1}`;
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

function assertIntermediateContent(label: string, content: string): void {
  if (!content.trim()) throw new Error(`${label}为空，需重新生成`);
  const hit = artifactTerms
    .map(term => ({ term, match: content.match(term.pattern)?.[0] }))
    .find(result => result.match);
  if (hit) throw new Error(`${label}包含工程词或占位内容：${hit.term.label}（${hit.match}），需重新生成`);
}

function splitOversizedPart(value: string, maxChars: number): string[] {
  if (value.length <= maxChars) return [value];
  const parts: string[] = [];
  for (let start = 0; start < value.length; start += maxChars) {
    parts.push(value.slice(start, start + maxChars));
  }
  return parts;
}

function splitSource(value: string, maxChars = sourceChunkChars): string[] {
  const normalized = value.trim();
  if (normalized.length <= maxChars) return [normalized];

  const paragraphs = normalized
    .split(/\n{2,}/u)
    .flatMap(paragraph => splitOversizedPart(paragraph.trim(), maxChars))
    .filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    current = paragraph;
  }
  if (current) chunks.push(current);
  return chunks;
}

function packSegments(segments: string[], maxChars: number): string[] {
  return splitSource(segments.join('\n\n--- 分段边界 ---\n\n'), maxChars);
}

function extractLooseSegment(raw: string, tag: string, label: string): string {
  const content = extractContent(raw);
  const result = hasTag(content, tag) ? extractTag(content, tag) : stripCodeFence(content);
  assertIntermediateContent(label, result);
  return result;
}

async function compactSegments(
  segments: string[],
  config: {
    label: string;
    tag: string;
    knowledge: string;
    options: GenerationRetryOptions;
  },
): Promise<string> {
  let current = segments;
  let round = 0;

  while ((current.length > 1 || current.join('\n\n').length > mergeTargetChars) && round < 8) {
    round += 1;
    const batches = packSegments(current, mergeBatchChars);
    const merged: string[] = [];
    config.options.onProgress?.({
      phase: 'summary',
      message: `分段蒸馏完成，开始总结蒸馏（第 ${round} 轮，共 ${batches.length} 组）`,
      completed: 0,
      total: batches.length,
    });

    for (let index = 0; index < batches.length; index += 1) {
      const userInput = [`【${config.label}待合并片段 ${index + 1}/${batches.length}】`, batches[index]].join('\n\n');
      const taskInstruction = [
        `蒸馏并合并这组${config.label}片段。`,
        '保留用户明确设定、专名、数值、关系与因果，删除重复表达和创作过程说明。',
        '使用紧凑中文 YAML；在不损失有效设定的前提下压缩到约 12000 汉字以内。',
        `输出放在 <content><${config.tag}>...</${config.tag}></content> 中。`,
      ].join('\n');
      const raw = await callAdaptedPreset(userInput, taskInstruction, config.knowledge, config.options);
      merged.push(extractLooseSegment(raw, config.tag, `${config.label}合并结果`));
      config.options.onProgress?.({
        phase: 'summary',
        message: `总结蒸馏第 ${round} 轮：${index + 1}/${batches.length}`,
        completed: index + 1,
        total: batches.length,
      });
    }

    current = merged;
  }

  return current.join('\n\n');
}

async function prepareWorldviewSource(
  seed: string,
  options: GenerationRetryOptions,
  knowledge: string,
): Promise<string> {
  const chunks = splitSource(seed);
  if (chunks.length === 1) return chunks[0];

  options.onProgress?.({
    phase: 'segment',
    message: `世界观内容超过 2 万字符，开始分段蒸馏：0/${chunks.length}`,
    completed: 0,
    total: chunks.length,
  });
  const segments: string[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const userInput = [`【世界观素材分段 ${index + 1}/${chunks.length}】`, chunks[index]].join('\n\n');
    const taskInstruction = [
      '这里只蒸馏世界观素材的一个分段，不生成角色。',
      '完整提取并合理化本段中的明确设定、专名、规则、数值和因果，删除重复与赘述，不得改变用户原意。',
      '输出紧凑中文 YAML；在不损失有效设定的前提下压缩到约 12000 汉字以内。',
      '输出放在 <content><worldview_segment>...</worldview_segment></content> 中。',
    ].join('\n');
    const raw = await callAdaptedPreset(userInput, taskInstruction, knowledge, options);
    segments.push(extractLooseSegment(raw, 'worldview_segment', '世界观分段'));
    options.onProgress?.({
      phase: 'segment',
      message: `分段蒸馏世界观：${index + 1}/${chunks.length}`,
      completed: index + 1,
      total: chunks.length,
    });
  }

  const result = await compactSegments(segments, {
    label: '世界观',
    tag: 'worldview_segment',
    knowledge,
    options,
  });
  options.onProgress?.({
    phase: 'complete',
    message: '世界观蒸馏完成，进入世界观正式生成',
    completed: 1,
    total: 1,
  });
  return result;
}

async function prepareRoleSource(
  draft: RoleDraft,
  worldContent: string,
  index: number,
  options: GenerationRetryOptions,
): Promise<string> {
  const chunks = splitSource(draft.seed);
  if (chunks.length === 1) return chunks[0];

  options.onProgress?.({
    phase: 'segment',
    message: `${draft.label}内容超过 2 万字符，开始分段蒸馏：0/${chunks.length}`,
    completed: 0,
    total: chunks.length,
  });
  const segments: string[] = [];
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const userInput = [
      '【已处理世界观，仅作角色整理参考】',
      worldContent.trim(),
      '',
      `【${draft.label}素材分段 ${chunkIndex + 1}/${chunks.length}】`,
      chunks[chunkIndex],
    ].join('\n');
    const taskInstruction = [
      `这里只蒸馏角色${index + 1}自己的一个素材分段，不得混入其他角色。`,
      '结合已处理世界观，完整提取该角色的明确设定、关系、经历、能力、禁忌、性格机制与阶段变化。',
      '删除重复与赘述，不得改变用户原意；输出紧凑中文 YAML，并在不损失有效设定的前提下压缩到约 12000 汉字以内。',
      '输出放在 <content><role_material>...</role_material></content> 中。',
    ].join('\n');
    const raw = await callAdaptedPreset(userInput, taskInstruction, condensedPaletteRoleKnowledge, options);
    segments.push(extractLooseSegment(raw, 'role_material', `${draft.label}素材分段`));
    options.onProgress?.({
      phase: 'segment',
      message: `分段蒸馏${draft.label}：${chunkIndex + 1}/${chunks.length}`,
      completed: chunkIndex + 1,
      total: chunks.length,
    });
  }

  const result = await compactSegments(segments, {
    label: `${draft.label}素材`,
    tag: 'role_material',
    knowledge: condensedPaletteRoleKnowledge,
    options,
  });
  options.onProgress?.({
    phase: 'complete',
    message: `${draft.label}蒸馏完成，进入角色正式生成`,
    completed: 1,
    total: 1,
  });
  return result;
}

async function prepareOpeningSource(
  source: string,
  options: GenerationRetryOptions,
  knowledge: string,
): Promise<string> {
  const chunks = splitSource(source);
  if (chunks.length === 1) return chunks[0];

  options.onProgress?.({
    phase: 'segment',
    message: `开场白参考内容超过 2 万字符，开始分段蒸馏：0/${chunks.length}`,
    completed: 0,
    total: chunks.length,
  });
  const segments: string[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const userInput = [`【开场白参考分段 ${index + 1}/${chunks.length}】`, chunks[index]].join('\n\n');
    const taskInstruction = [
      '这里只蒸馏开场白创作参考的一个分段，不直接写开场白。',
      '保留文风特征、大纲中的时间地点人物状态与事件顺序，以及世界观和角色设定中的关键约束。',
      '删除重复与赘述，不得混淆“文风参考”“开场大纲”“设定参考”。',
      '输出紧凑中文 YAML，并在不损失有效设定的前提下压缩到约 12000 汉字以内。',
      '输出放在 <content><opening_material>...</opening_material></content> 中。',
    ].join('\n');
    const raw = await callAdaptedPreset(userInput, taskInstruction, knowledge, options);
    segments.push(extractLooseSegment(raw, 'opening_material', '开场白参考分段'));
    options.onProgress?.({
      phase: 'segment',
      message: `分段蒸馏开场白参考：${index + 1}/${chunks.length}`,
      completed: index + 1,
      total: chunks.length,
    });
  }

  const result = await compactSegments(segments, {
    label: '开场白参考',
    tag: 'opening_material',
    knowledge,
    options,
  });
  options.onProgress?.({
    phase: 'complete',
    message: '开场白参考蒸馏完成，进入开场白正式生成',
    completed: 1,
    total: 1,
  });
  return result;
}

export async function generateWorldview(seed: string, options: GenerationRetryOptions = {}): Promise<WorldviewResult> {
  const knowledge = getPresetKnowledge(worldKnowledgeIds);
  const preparedSeed = await prepareWorldviewSource(seed, options, knowledge);
  const userInput = [
    '【世界观模块】',
    '请根据下面已经按需蒸馏过的用户素材，生成可直接写入世界书的世界观设定。',
    '',
    preparedSeed,
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
  const raw = await callAdaptedPreset(userInput, taskInstruction, knowledge, options);
  return parseWorldviewResult(raw, seed);
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
  const raw = await callAdaptedPreset(userInput, taskInstruction, condensedPaletteRoleKnowledge, options);
  return parsePersonaOnlyResult(raw, mode, seed);
}

export async function generateOpening(
  literaryStyle: string,
  outline: string,
  worldContent: string,
  roles: RoleResult[],
  options: GenerationRetryOptions = {},
): Promise<OpeningResult> {
  const knowledge = getPresetKnowledge(openingKnowledgeIds);
  const roleReference = roles
    .map(role =>
      [
        `【角色：${role.name}】`,
        role.basic,
        '',
        '【性格调色盘】',
        role.palette,
        '',
        '【初识期表现】',
        role.stagePersonas.early,
        '',
        '【角色速览】',
        role.quickView,
      ].join('\n'),
    )
    .join('\n\n');
  const source = [
    '【用户指定文风】',
    literaryStyle.trim(),
    '',
    '【用户开场大纲】',
    outline.trim(),
    '',
    '【已生成世界观】',
    worldContent.trim(),
    '',
    '【已生成角色设定】',
    roleReference,
  ].join('\n');
  const preparedSource = await prepareOpeningSource(source, options, knowledge);
  const userInput = ['【开场白模块】', preparedSource].join('\n\n');
  const taskInstruction = [
    '把用户开场大纲扩写为可以直接放入角色卡“第一条消息”的完整开场白。',
    '严格模仿用户提供的文风特征，但不要复述或照抄文风参考里的具体情节与句子。',
    '完整落实大纲中的时间、地点、在场人物、人物状态、局势和事件起点，不得擅自改掉明确设定。',
    '人物言行必须符合已生成的世界观、角色基础、性格调色盘和初识期表现。',
    '结尾必须留下自然、具体、能够让用户立即接话或行动的钩子；不得总结、升华、封闭事件，也不得替用户作出关键决定。',
    '直接输出故事正文，不要解释创作过程，不要输出标题，不要自行添加状态栏占位符。',
    ...retryInstruction(options),
    '输出必须放在 <content><opening_result>...</opening_result></content> 中。',
  ].join('\n');
  const raw = await callAdaptedPreset(userInput, taskInstruction, knowledge, options);
  return parseOpeningResult(raw, outline);
}

export async function generateRole(
  draft: RoleDraft,
  worldContent: string,
  index: number,
  options: GenerationRetryOptions = {},
): Promise<RoleResult> {
  const fallbackName = draft.name.trim() || `角色${index + 1}`;
  const preparedRoleSource = await prepareRoleSource(draft, worldContent, index, options);
  const userInput = [
    `【${draft.label}】`,
    `角色临时名称：${fallbackName}`,
    '',
    '【已生成世界观，仅作本角色参考】',
    worldContent.trim(),
    '',
    `【本轮唯一角色素材：${draft.label}】`,
    preparedRoleSource,
  ].join('\n');
  const taskInstruction = [
    `只生成${draft.label}，不得读取、推测或混入其他角色素材。`,
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
  const raw = await callAdaptedPreset(userInput, taskInstruction, knowledge, options);
  return parseRoleResult(raw, draft, index);
}
