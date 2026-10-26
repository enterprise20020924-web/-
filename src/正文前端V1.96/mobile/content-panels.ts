export interface MobileChoiceOption {
  label: string;
  text: string;
}

export type MobileJsonPatchTone = 'insert' | 'remove' | 'replace' | 'update';

export interface MobileJsonPatchOperationView {
  index: number;
  op: string;
  opLabel: string;
  tone: MobileJsonPatchTone;
  path: string;
  pathTrail: string;
  title: string;
  valuePrefix: string;
  valueText: string | null;
  emptyValueText: string;
}

export interface MobileJsonPatchPanelView {
  rawText: string;
  operations: MobileJsonPatchOperationView[];
}

const SEX_BATTLE_CHOICE_TEXT_PATTERN = /(?:性斗|发起性斗|进入性斗|开始性斗|进行性斗)/;

export function getMobileChoiceOptionKey(option: MobileChoiceOption, index: number) {
  return `${option.label}-${index}-${option.text}`;
}

export function isMobileSexBattleChoiceOption(option: MobileChoiceOption) {
  return option.label.trim().toUpperCase() === 'E' && SEX_BATTLE_CHOICE_TEXT_PATTERN.test(option.text);
}

export function inferMobileSexBattleEnemyName(text: string, knownNames: string[] = []) {
  const normalizedText = text
    .replace(/[【】]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const mentionedKnownName = knownNames.find(name => {
    const normalizedName = name.trim();
    return normalizedName.length > 0 && normalizedText.includes(normalizedName);
  });
  if (mentionedKnownName !== undefined) {
    return mentionedKnownName.trim();
  }

  const patterns = [
    /(?:向|对|与|找|挑战)\s*([^，,。！？!?；;：:\n]{1,16})\s*(?:发起|进行|开始|进入)?性斗/u,
    /(?:发起|进行|开始|进入)性斗\s*(?:对象|目标|对手)?\s*[:：\-—]?\s*([^，,。！？!?；;：:\n]{1,16})/u,
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    const candidate = sanitizeMobileEnemyName(match?.[1] ?? '');
    if (candidate !== null) {
      return candidate;
    }
  }

  return null;
}

export function parseMobileJsonPatchPanel(rawBlock: string | null | undefined): MobileJsonPatchPanelView | null {
  const rawText = rawBlock?.trim() ?? '';
  if (rawText.length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawText) as unknown;
    const parsedRecord = asRecord(parsed);
    const operationsSource = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsedRecord?.operations)
        ? parsedRecord.operations
        : Array.isArray(parsedRecord?.patches)
          ? parsedRecord.patches
          : [];

    return {
      rawText: truncatePanelText(rawText, 800),
      operations: operationsSource.map(formatMobileJsonPatchOperation),
    };
  } catch {
    return {
      rawText: truncatePanelText(rawText, 800),
      operations: [],
    };
  }
}

function formatMobileJsonPatchOperation(operation: unknown, index: number): MobileJsonPatchOperationView {
  const record = asRecord(operation);
  const op =
    String(record?.op ?? 'op')
      .trim()
      .toUpperCase() || 'OP';
  const path = String(record?.path ?? '(no path)').trim() || '(no path)';
  const hasValue = record !== null && Object.prototype.hasOwnProperty.call(record, 'value');
  const pathParts = parseJsonPatchPathParts(path);
  const tone = resolveMobileJsonPatchTone(op);

  return {
    index,
    op,
    opLabel: formatOperationLabel(op, tone),
    tone,
    path,
    pathTrail: formatPathTrail(pathParts, path),
    title: formatOperationTitle(tone, pathParts, path),
    valuePrefix: formatValuePrefix(op, tone),
    valueText: hasValue ? formatJsonPatchValue(record.value) : null,
    emptyValueText: tone === 'remove' ? '已从记录中撤下' : '等待写入',
  };
}

function parseJsonPatchPathParts(path: string) {
  return path
    .split('/')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function resolveMobileJsonPatchTone(op: string): MobileJsonPatchTone {
  switch (op.toLowerCase()) {
    case 'add':
    case 'insert':
      return 'insert';
    case 'remove':
      return 'remove';
    case 'replace':
      return 'replace';
    default:
      return 'update';
  }
}

function formatOperationLabel(op: string, tone: MobileJsonPatchTone) {
  if (isDeltaOperation(op)) {
    return '增减';
  }

  return {
    insert: '新增',
    remove: '移除',
    replace: '更新',
    update: '变更',
  }[tone];
}

function formatValuePrefix(op: string, tone: MobileJsonPatchTone) {
  if (isDeltaOperation(op)) {
    return '变化量';
  }

  return {
    insert: '登记为',
    remove: '处理',
    replace: '调整为',
    update: '结果',
  }[tone];
}

function formatOperationTitle(tone: MobileJsonPatchTone, pathParts: string[], fallbackPath: string) {
  const usefulParts = pathParts.filter(part => part !== '-');
  const leaf = usefulParts.at(-1) ?? fallbackPath;
  const parent = usefulParts.at(-2);

  if (tone === 'insert') {
    return parent !== undefined && pathParts.at(-1) === '-' ? `${parent} 新增记录` : `${leaf} 新增`;
  }
  if (tone === 'remove') {
    return `${leaf} 移除`;
  }
  if (tone === 'replace') {
    return `${leaf} 更新`;
  }
  return `${leaf} 变更`;
}

function formatPathTrail(pathParts: string[], fallbackPath: string) {
  const usefulParts = pathParts.filter(part => part !== '-');
  if (usefulParts.length <= 1) {
    return usefulParts[0] ?? fallbackPath;
  }

  return usefulParts.slice(0, -1).join(' / ');
}

function formatJsonPatchValue(value: unknown) {
  const serializedValue = typeof value === 'string' ? value : (JSON.stringify(value) ?? String(value));
  return truncatePanelText(serializedValue, 120);
}

function truncatePanelText(text: string, maxLength: number) {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  return normalizedText.length <= maxLength ? normalizedText : `${normalizedText.slice(0, maxLength - 1)}…`;
}

function isDeltaOperation(op: string) {
  return ['delta', 'increment', 'decrement', 'inc', 'dec', 'add_number'].includes(op.toLowerCase());
}

function sanitizeMobileEnemyName(candidate: string) {
  const normalizedCandidate = candidate
    .replace(/^[“"'(\u005b（《<]+|[”"')\u005d）》>]+$/g, '')
    .replace(/^(?:对象|目标|对手|角色|人物)\s*[:：\-—]?\s*/u, '')
    .trim();

  return normalizedCandidate.length > 0 && normalizedCandidate.length <= 16 ? normalizedCandidate : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
