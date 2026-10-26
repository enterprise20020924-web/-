import type { ChoiceOption } from '../types/content-renderer';

const SEX_BATTLE_CHOICE_TEXT_PATTERN = /(?:性斗|发起性斗|进入性斗|开始性斗|进行性斗)/;
const DELTA_OPERATIONS = new Set(['delta', 'inc', 'increase', 'dec', 'decrease']);

export interface ChoiceOptionEntry {
  option: ChoiceOption;
  originalIndex: number;
  displayIndex: number;
  key: string;
}

export interface ChoiceOptionPartition {
  regular: ChoiceOptionEntry[];
  sexBattle: ChoiceOptionEntry | null;
}

export interface JsonPatchOperationView {
  index: number;
  op: string;
  opLabel: string;
  tone: string;
  path: string;
  rawValue: unknown;
  hasValue: boolean;
  pathTrail: string;
  title: string;
  valuePrefix: string;
  valueText: string | null;
  emptyValueText: string;
}

export interface JsonPatchPanelView {
  rawText: string;
  operations: JsonPatchOperationView[];
}

export type JsonPatchAuditStatus = 'idle' | 'checking' | 'done' | 'error';
export type JsonPatchAuditItemStatus = 'ok' | 'fixed' | 'applied' | 'blocked' | 'skipped' | 'error';

export interface JsonPatchAuditItem {
  index: number;
  status: JsonPatchAuditItemStatus;
  label: string;
  message: string;
  path: string;
}

export interface JsonPatchAuditView {
  status: JsonPatchAuditStatus;
  summary: string;
  items: JsonPatchAuditItem[];
}

export function partitionChoiceOptions(options: ChoiceOption[]): ChoiceOptionPartition {
  const regular: ChoiceOptionEntry[] = [];
  let sexBattle: ChoiceOptionEntry | null = null;

  options.forEach((option, originalIndex) => {
    const entry: ChoiceOptionEntry = {
      option,
      originalIndex,
      displayIndex: regular.length,
      key: createChoiceOptionKey(option, originalIndex),
    };

    if (sexBattle === null && isSexBattleChoiceOption(option)) {
      sexBattle = entry;
      return;
    }

    regular.push(entry);
  });

  return { regular, sexBattle };
}

export function createChoiceOptionKey(option: ChoiceOption, originalIndex: number) {
  return `${option.label.trim().toUpperCase()}\u0000${originalIndex}\u0000${option.text.trim()}`;
}

export function isSexBattleChoiceOption(option: ChoiceOption) {
  return option.label.trim().toUpperCase() === 'E' && SEX_BATTLE_CHOICE_TEXT_PATTERN.test(option.text);
}

export function parseJsonPatchPanel(rawBlock: string | null | undefined): JsonPatchPanelView | null {
  const rawText = rawBlock?.trim() ?? '';
  if (rawText.length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawText) as unknown;
    const record = asRecord(parsed);
    const operationsSource = Array.isArray(parsed)
      ? parsed
      : Array.isArray(record?.operations)
        ? record.operations
        : Array.isArray(record?.patches)
          ? record.patches
          : [];

    return {
      rawText: truncateJsonPatchText(rawText, 800),
      operations: operationsSource.map(formatJsonPatchOperationView),
    };
  } catch {
    return {
      rawText: truncateJsonPatchText(rawText, 800),
      operations: [],
    };
  }
}

export function resolveJsonPatchOperationTone(op: string) {
  const normalizedOp = op.toLowerCase();
  if (normalizedOp === 'remove') {
    return 'remove';
  }
  if (normalizedOp === 'add' || normalizedOp === 'insert') {
    return 'insert';
  }
  if (normalizedOp === 'replace') {
    return 'replace';
  }
  return 'update';
}

export function isJsonPatchDeltaOperation(op: string) {
  return DELTA_OPERATIONS.has(op.toLowerCase());
}

function formatJsonPatchOperationView(operation: unknown, index: number): JsonPatchOperationView {
  const record = asRecord(operation);
  const op =
    String(record?.op ?? 'op')
      .trim()
      .toUpperCase() || 'OP';
  const path = String(record?.path ?? '(no path)').trim() || '(no path)';
  const hasValue = record !== null && Object.prototype.hasOwnProperty.call(record, 'value');
  const rawValue = hasValue ? record.value : undefined;
  const pathParts = parseJsonPatchPathParts(path);

  return {
    index,
    op,
    opLabel: formatJsonPatchOperationLabel(op),
    tone: resolveJsonPatchOperationTone(op),
    path,
    rawValue,
    hasValue,
    pathTrail: formatJsonPatchPathTrail(pathParts, path),
    title: formatJsonPatchOperationTitle(op, pathParts, path),
    valuePrefix: formatJsonPatchValuePrefix(op),
    valueText: hasValue ? formatJsonPatchValue(rawValue) : null,
    emptyValueText: formatJsonPatchEmptyValueText(op),
  };
}

function parseJsonPatchPathParts(path: string) {
  return path
    .split('/')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function formatJsonPatchOperationLabel(op: string) {
  if (isJsonPatchDeltaOperation(op)) {
    return '增减';
  }

  switch (resolveJsonPatchOperationTone(op)) {
    case 'insert':
      return '新增';
    case 'remove':
      return '移除';
    case 'replace':
      return '更新';
    default:
      return '变更';
  }
}

function formatJsonPatchValuePrefix(op: string) {
  if (isJsonPatchDeltaOperation(op)) {
    return '变化量';
  }

  switch (resolveJsonPatchOperationTone(op)) {
    case 'insert':
      return '登记为';
    case 'remove':
      return '处理';
    case 'replace':
      return '调整为';
    default:
      return '结果';
  }
}

function formatJsonPatchEmptyValueText(op: string) {
  return resolveJsonPatchOperationTone(op) === 'remove' ? '已从记录中撤下' : '等待写入';
}

function formatJsonPatchOperationTitle(op: string, pathParts: string[], fallbackPath: string) {
  const usefulParts = pathParts.filter(part => part !== '-');
  const leaf = usefulParts.at(-1) ?? fallbackPath;
  const parent = usefulParts.at(-2);
  const tone = resolveJsonPatchOperationTone(op);
  const numericIndex = /^\d+$/.test(leaf) ? Number(leaf) : null;
  const subject = numericIndex === null ? leaf : `${parent ?? '列表'} 第 ${numericIndex + 1} 项`;

  if (tone === 'insert') {
    return parent !== undefined && pathParts.at(-1) === '-' ? `${parent} 新增记录` : `${subject} 新增`;
  }
  if (tone === 'remove') {
    return `${subject} 移除`;
  }
  if (tone === 'replace') {
    return `${subject} 更新`;
  }
  return `${subject} 变更`;
}

function formatJsonPatchPathTrail(pathParts: string[], fallbackPath: string) {
  const usefulParts = pathParts.filter(part => part !== '-');
  if (usefulParts.length <= 1) {
    return usefulParts[0] ?? fallbackPath;
  }

  const hasNumericLeaf = /^\d+$/.test(usefulParts.at(-1) ?? '');
  if (hasNumericLeaf && usefulParts.length > 2) {
    return usefulParts.slice(0, -2).join(' / ');
  }

  return usefulParts.slice(0, -1).join(' / ');
}

function formatJsonPatchValue(value: unknown) {
  const serializedValue = typeof value === 'string' ? value : (JSON.stringify(value) ?? String(value));
  return truncateJsonPatchText(serializedValue, 120);
}

function truncateJsonPatchText(text: string, maxLength: number) {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  return normalizedText.length > maxLength ? `${normalizedText.slice(0, maxLength - 1)}…` : normalizedText;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
