import { extractTag, hasTag, stripCodeFence } from './parser';

export type GeneratedFormatKind = 'worldview' | 'role' | 'opening' | 'persona-normal' | 'persona-multistage';

export interface GeneratedFormatIssue {
  code: string;
  message: string;
}

export interface GeneratedFormatValidation {
  issues: GeneratedFormatIssue[];
  normalizedRaw: string;
  valid: boolean;
}

export interface GeneratedFormatRepair {
  after: GeneratedFormatValidation;
  changed: boolean;
  raw: string;
  usedFallbackLayout: boolean;
}

interface RepairOptions {
  fallbackName?: string;
}

const tagAliases: Record<string, string> = {
  world_result: 'worldview_result',
  worldview_result: 'worldview_result',
  worldviewresult: 'worldview_result',
  opening_result: 'opening_result',
  openingresult: 'opening_result',
  role_result: 'role_result',
  roleresult: 'role_result',
  persona_result: 'persona_result',
  personaresult: 'persona_result',
  role_name: 'role_name',
  rolename: 'role_name',
  multistage_persona: 'multistage_persona',
  multistagepersona: 'multistage_persona',
  quick_view: 'quick_view',
  quickview: 'quick_view',
  stage_early: 'stage_early',
  stageearly: 'stage_early',
  stage_middle: 'stage_middle',
  stagemiddle: 'stage_middle',
  stage_close: 'stage_close',
  stageclose: 'stage_close',
  stage_common: 'stage_common',
  stagecommon: 'stage_common',
};

const requiredTags: Record<GeneratedFormatKind, string[]> = {
  worldview: ['content', 'worldview_result'],
  opening: ['content', 'opening_result'],
  role: [
    'content',
    'role_result',
    'role_name',
    'aliases',
    'basic',
    'palette',
    'reinterpret',
    'multistage_persona',
    'stage_early',
    'stage_middle',
    'stage_close',
    'stage_common',
    'quick_view',
  ],
  'persona-normal': ['content', 'persona_result', 'palette'],
  'persona-multistage': [
    'content',
    'persona_result',
    'multistage_persona',
    'stage_early',
    'stage_middle',
    'stage_close',
    'stage_common',
  ],
};

const emptyAllowedTags = new Set(['stage_common']);

function canonicalTagName(value: string): string {
  const compact = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/gu, '_');
  return tagAliases[compact] ?? compact;
}

export function normalizeGeneratedMarkup(value: string): string {
  return stripCodeFence(value)
    .replace(/[＜〈]/gu, '<')
    .replace(/[＞〉]/gu, '>')
    .replace(/<<\s*(\/?)\s*([a-z][\w\s-]*)\s*>>/giu, '<$1$2>')
    .replace(/<\s*(\/?)\s*([a-z][\w\s-]*)\s*>/giu, (_match, slash: string, name: string) => {
      return `<${slash}${canonicalTagName(name)}>`;
    })
    .trim();
}

function tagBoundaryState(value: string, tag: string): 'missing' | 'unclosed' | 'closed' {
  if (hasTag(value, tag)) return 'closed';
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasOpening = new RegExp(`<${escaped}>`, 'iu').test(value);
  const hasClosing = new RegExp(`</${escaped}>`, 'iu').test(value);
  return hasOpening || hasClosing ? 'unclosed' : 'missing';
}

export function validateGeneratedFormat(kind: GeneratedFormatKind, raw: string): GeneratedFormatValidation {
  const stripped = stripCodeFence(raw).trim();
  const normalizedRaw = normalizeGeneratedMarkup(raw);
  const issues: GeneratedFormatIssue[] = [];

  if (normalizedRaw !== stripped) {
    issues.push({ code: 'noncanonical-tags', message: '检测到双尖括号、全角符号或标签别名，可自动规范化。' });
  }

  for (const tag of requiredTags[kind]) {
    const state = tagBoundaryState(normalizedRaw, tag);
    if (state === 'missing') {
      issues.push({ code: `missing-${tag}`, message: `缺少 <${tag}> 结构。` });
      continue;
    }
    if (state === 'unclosed') {
      issues.push({ code: `unclosed-${tag}`, message: `<${tag}> 未正确闭合。` });
      continue;
    }
    if (!emptyAllowedTags.has(tag) && !extractTag(normalizedRaw, tag).trim()) {
      issues.push({ code: `empty-${tag}`, message: `<${tag}> 内容为空。` });
    }
  }

  return { issues, normalizedRaw, valid: issues.length === 0 };
}

function escapeXmlText(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
}

function visibleText(value: string): string {
  return stripCodeFence(value)
    .replace(/<thinking>[\s\S]*?<\/thinking>/giu, '')
    .replace(/<\/?[a-z][^>]*>/giu, '')
    .trim();
}

function contentBody(value: string): string {
  const withoutThinking = value.replace(/<thinking>[\s\S]*?<\/thinking>/giu, '').trim();
  return hasTag(withoutThinking, 'content') ? extractTag(withoutThinking, 'content') : withoutThinking;
}

function existingOr(value: string, tag: string, fallback: string): string {
  if (!hasTag(value, tag)) return fallback;
  const content = extractTag(value, tag);
  return emptyAllowedTags.has(tag) || content.trim() ? content : fallback;
}

function wrapContent(rootTag: string, body: string): string {
  return `<content>\n<${rootTag}>\n${body.trim()}\n</${rootTag}>\n</content>`;
}

function repairWorldview(normalized: string): { raw: string; usedFallbackLayout: boolean } {
  const source = contentBody(normalized);
  if (hasTag(source, 'worldview_result')) {
    return { raw: wrapContent('worldview_result', extractTag(source, 'worldview_result')), usedFallbackLayout: false };
  }
  const fallback = visibleText(source) || source.trim() || '世界观内容待人工检查';
  return { raw: wrapContent('worldview_result', escapeXmlText(fallback)), usedFallbackLayout: true };
}

function repairOpening(normalized: string): { raw: string; usedFallbackLayout: boolean } {
  const source = contentBody(normalized);
  if (hasTag(source, 'opening_result')) {
    return { raw: wrapContent('opening_result', extractTag(source, 'opening_result')), usedFallbackLayout: false };
  }
  const fallback = visibleText(source) || source.trim() || '开场白内容待人工检查';
  return { raw: wrapContent('opening_result', escapeXmlText(fallback)), usedFallbackLayout: true };
}

function roleStageBlock(source: string, fallback: string): string {
  const multistage = hasTag(source, 'multistage_persona') ? extractTag(source, 'multistage_persona') : source;
  const early = existingOr(multistage, 'stage_early', fallback);
  const middle = existingOr(multistage, 'stage_middle', fallback);
  const close = existingOr(multistage, 'stage_close', fallback);
  const common = existingOr(multistage, 'stage_common', '');
  return [
    '<multistage_persona>',
    `<stage_early>${early}</stage_early>`,
    `<stage_middle>${middle}</stage_middle>`,
    `<stage_close>${close}</stage_close>`,
    `<stage_common>${common}</stage_common>`,
    '</multistage_persona>',
  ].join('\n');
}

function repairRole(normalized: string, fallbackName: string): { raw: string; usedFallbackLayout: boolean } {
  const outer = contentBody(normalized);
  const source = hasTag(outer, 'role_result') ? extractTag(outer, 'role_result') : outer;
  const recognizableTags = ['role_name', 'basic', 'palette', 'reinterpret', 'multistage_persona', 'quick_view'].filter(
    tag => hasTag(source, tag),
  ).length;
  const plain = escapeXmlText(visibleText(source) || fallbackName);
  const name = existingOr(source, 'role_name', escapeXmlText(fallbackName));
  const aliases = existingOr(source, 'aliases', name);
  const basic = existingOr(source, 'basic', plain);
  const palette = existingOr(source, 'palette', basic);
  const reinterpret = existingOr(source, 'reinterpret', palette);
  const stageFallback = escapeXmlText(
    visibleText([palette, reinterpret].join('\n\n')) || visibleText(basic) || fallbackName,
  );
  const quickView = existingOr(
    source,
    'quick_view',
    `- 名称: ${escapeXmlText(visibleText(name) || fallbackName)}\n  简述: ${escapeXmlText((visibleText(basic) || fallbackName).slice(0, 80))}`,
  );
  const body = [
    `<role_name>${name}</role_name>`,
    `<aliases>${aliases}</aliases>`,
    `<basic>${basic}</basic>`,
    `<palette>${palette}</palette>`,
    `<reinterpret>${reinterpret}</reinterpret>`,
    roleStageBlock(source, stageFallback),
    `<quick_view>${quickView}</quick_view>`,
  ].join('\n');
  return { raw: wrapContent('role_result', body), usedFallbackLayout: recognizableTags === 0 };
}

function repairPersona(normalized: string, multistage: boolean): { raw: string; usedFallbackLayout: boolean } {
  const outer = contentBody(normalized);
  const source = hasTag(outer, 'persona_result') ? extractTag(outer, 'persona_result') : outer;
  const plain = escapeXmlText(visibleText(source) || '人设内容待人工检查');
  if (!multistage) {
    const palette = existingOr(source, 'palette', plain);
    return {
      raw: wrapContent('persona_result', `<palette>${palette}</palette>`),
      usedFallbackLayout: !hasTag(source, 'palette'),
    };
  }
  const hasStages = ['stage_early', 'stage_middle', 'stage_close'].some(tag => hasTag(source, tag));
  return {
    raw: wrapContent('persona_result', roleStageBlock(source, plain)),
    usedFallbackLayout: !hasStages,
  };
}

export function repairGeneratedFormat(
  kind: GeneratedFormatKind,
  raw: string,
  options: RepairOptions = {},
): GeneratedFormatRepair {
  const normalized = normalizeGeneratedMarkup(raw);
  let result: { raw: string; usedFallbackLayout: boolean };
  if (kind === 'worldview') result = repairWorldview(normalized);
  else if (kind === 'opening') result = repairOpening(normalized);
  else if (kind === 'role') result = repairRole(normalized, options.fallbackName?.trim() || '角色');
  else result = repairPersona(normalized, kind === 'persona-multistage');

  const repairedRaw = result.raw.trim();
  return {
    after: validateGeneratedFormat(kind, repairedRaw),
    changed: repairedRaw !== stripCodeFence(raw).trim(),
    raw: repairedRaw,
    usedFallbackLayout: result.usedFallbackLayout,
  };
}
