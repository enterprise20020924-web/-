// Local snapshot metadata is compared with the published bundle before each page session chooses a calibration source.
export const MVU_CALIBRATION_SCHEMA_SOURCE_URL =
  'https://cdn.jsdelivr.net/gh/vincentrong2005/Fatria/dist/性斗学园/变量结构/index.js';
export const MVU_CALIBRATION_SCHEMA_LOCAL_FINGERPRINT = '7010:92884524';

const LOCAL_MVU_SCHEMA_ROOT_KEYS = [
  '角色基础',
  '核心状态',
  '基础属性',
  '临时状态',
  '永久状态',
  '性斗系统',
  '关系系统',
  '任务系统',
  '物品系统',
  '位置系统',
  '时间系统',
  '势力声望',
  '技能系统',
];

const LOCAL_MVU_SCHEMA_FIXED_CHILDREN: Record<string, string[]> = {
  角色基础: ['_等级', '_姓名', '经验值', '声望', '_段位', '难度', '性别'],
  核心状态: ['$属性点', '$技能点', '$最大耐力', '$耐力', '$最大快感', '$快感', '堕落度', '_潜力'],
  基础属性: ['_魅力', '_幸运', '_闪避率', '_暴击率'],
  临时状态: ['状态列表'],
  永久状态: ['状态列表'],
  性斗系统: ['对手名称', '性斗类型', '胜负规则'],
  关系系统: ['在场人物'],
  任务系统: ['主线任务', '支线任务', '已完成记录'],
  物品系统: ['学园金币', '背包', '_装备栏'],
  位置系统: ['坐标', '楼层', '地点名称'],
  时间系统: ['日期', '星期', '时间'],
  势力声望: ['学生会', '女权协会', 'BF社', '体育联盟', '研究会', '地下联盟', '男性自保联盟', '雌堕会'],
  技能系统: ['主动技能', '$天赋'],
};

const LOCAL_MVU_SCHEMA_RELATIONSHIP_FIELD_NAMES = ['好感度', '支配度', '誓约', '关系类型'];
const LOCAL_MVU_SCHEMA_EQUIPMENT_SLOT_NAMES = ['主装备', '副装备', '饰品1', '饰品2', '特殊装备'];
const LOCAL_MVU_SCHEMA_EQUIPMENT_FIELD_NAMES = ['名称', '等级', '加成属性', '描述'];
const LOCAL_MVU_SCHEMA_MAIN_TASK_FIELD_NAMES = ['名称', '描述', '状态', '目标', '奖励', '期限'];
const LOCAL_MVU_SCHEMA_SIDE_TASK_FIELD_NAMES = ['描述', '类型', '状态', '目标', '奖励', '期限'];

export const MVU_SCHEMA_ROOT_KEYS = [...LOCAL_MVU_SCHEMA_ROOT_KEYS];
export const MVU_SCHEMA_FIXED_CHILDREN = cloneStringArrayRecord(LOCAL_MVU_SCHEMA_FIXED_CHILDREN);
export const MVU_SCHEMA_RELATIONSHIP_FIELD_NAMES = [...LOCAL_MVU_SCHEMA_RELATIONSHIP_FIELD_NAMES];
export const MVU_SCHEMA_EQUIPMENT_SLOT_NAMES = [...LOCAL_MVU_SCHEMA_EQUIPMENT_SLOT_NAMES];
export const MVU_SCHEMA_EQUIPMENT_FIELD_NAMES = [...LOCAL_MVU_SCHEMA_EQUIPMENT_FIELD_NAMES];
export const MVU_SCHEMA_MAIN_TASK_FIELD_NAMES = [...LOCAL_MVU_SCHEMA_MAIN_TASK_FIELD_NAMES];
export const MVU_SCHEMA_SIDE_TASK_FIELD_NAMES = [...LOCAL_MVU_SCHEMA_SIDE_TASK_FIELD_NAMES];

export const MVU_SCHEMA_ROOT_ALIASES: Record<string, string> = {
  等级: '角色基础',
  姓名: '角色基础',
  经验: '角色基础',
  经验值: '角色基础',
  声望: '角色基础',
  段位: '角色基础',
  难度: '角色基础',
  性别: '角色基础',
  属性点: '核心状态',
  技能点: '核心状态',
  最大耐力: '核心状态',
  耐力: '核心状态',
  最大快感: '核心状态',
  快感: '核心状态',
  堕落: '核心状态',
  堕落度: '核心状态',
  潜力: '核心状态',
  魅力: '基础属性',
  幸运: '基础属性',
  闪避率: '基础属性',
  暴击率: '基础属性',
  时间: '时间系统',
  日期: '时间系统',
  星期: '时间系统',
  位置: '位置系统',
  地点: '位置系统',
  当前地点: '位置系统',
  关系: '关系系统',
  在场人物: '关系系统',
  背包: '物品系统',
  学园金币: '物品系统',
  金币: '物品系统',
  物品: '物品系统',
  性斗: '性斗系统',
  对手名称: '性斗系统',
  技能: '技能系统',
  主动技能: '技能系统',
  天赋: '技能系统',
};

export const MVU_SCHEMA_CHILD_ALIASES: Record<string, Record<string, string>> = {
  角色基础: {
    经验: '经验值',
  },
  核心状态: {
    堕落: '堕落度',
  },
  关系系统: {
    在场角色: '在场人物',
    当前人物: '在场人物',
    当前角色: '在场人物',
  },
  位置系统: {
    当前地点: '地点名称',
    地点: '地点名称',
    当前位置: '地点名称',
    区域: '地点名称',
    当前区域: '地点名称',
  },
  物品系统: {
    物品: '背包',
    道具: '背包',
    金币: '学园金币',
    装备栏: '_装备栏',
  },
  技能系统: {
    技能: '主动技能',
    天赋: '$天赋',
  },
};

export const MVU_SCHEMA_RELATIONSHIP_FIELD_ALIASES: Record<string, string> = {
  屈服度: '支配度',
  服从度: '支配度',
};

interface NumericConstraint {
  min?: number;
  max?: number;
}

interface MvuSchemaLike {
  safeParse?: (value: unknown) => MvuSchemaSafeParseResult;
  shape?: Record<string, MvuSchemaLike>;
  def?: Record<string, unknown>;
  _def?: Record<string, unknown>;
  minValue?: unknown;
  maxValue?: unknown;
}

type MvuSchemaSafeParseResult = { success: true; data: unknown } | { success: false; error?: unknown };

export interface MvuSchemaValueNormalization {
  value: unknown;
  changed: boolean;
  note: string;
}

const EXACT_NUMERIC_CONSTRAINTS: Record<string, NumericConstraint> = {
  '角色基础._等级': { min: 1, max: 100 },
  '角色基础.经验值': { min: 0 },
  '角色基础.声望': { min: -10000, max: 10000 },
  '核心状态.$属性点': { min: 0 },
  '核心状态.$技能点': { min: 0 },
  '核心状态.$最大耐力': { min: 1 },
  '核心状态.$耐力': { min: 0 },
  '核心状态.$最大快感': { min: 1 },
  '核心状态.$快感': { min: 0 },
  '核心状态.堕落度': { min: 0, max: 100 },
  '核心状态._潜力': { min: 5, max: 10 },
  '基础属性._魅力': { min: 0 },
  '基础属性._幸运': { min: 0 },
  '基础属性._闪避率': { min: 0 },
  '基础属性._暴击率': { min: 0, max: 100 },
  '性斗系统.胜负规则.高潮次数上限': { min: 1 },
  '物品系统.学园金币': { min: 0 },
  '位置系统.楼层': {},
  '时间系统.星期': { min: 1, max: 7 },
};

type ActiveMvuCalibrationSchemaSource = 'local' | 'cdn';

let activeRuntimeSchema: MvuSchemaLike | null = null;
let activeRuntimeSchemaSource: ActiveMvuCalibrationSchemaSource | null = null;

export function activateLocalMvuCalibrationStandard() {
  activeRuntimeSchema = null;
  activeRuntimeSchemaSource = null;
  replaceStringArray(MVU_SCHEMA_ROOT_KEYS, LOCAL_MVU_SCHEMA_ROOT_KEYS);
  replaceStringArrayRecord(MVU_SCHEMA_FIXED_CHILDREN, LOCAL_MVU_SCHEMA_FIXED_CHILDREN);
  replaceStringArray(MVU_SCHEMA_RELATIONSHIP_FIELD_NAMES, LOCAL_MVU_SCHEMA_RELATIONSHIP_FIELD_NAMES);
  replaceStringArray(MVU_SCHEMA_EQUIPMENT_SLOT_NAMES, LOCAL_MVU_SCHEMA_EQUIPMENT_SLOT_NAMES);
  replaceStringArray(MVU_SCHEMA_EQUIPMENT_FIELD_NAMES, LOCAL_MVU_SCHEMA_EQUIPMENT_FIELD_NAMES);
  replaceStringArray(MVU_SCHEMA_MAIN_TASK_FIELD_NAMES, LOCAL_MVU_SCHEMA_MAIN_TASK_FIELD_NAMES);
  replaceStringArray(MVU_SCHEMA_SIDE_TASK_FIELD_NAMES, LOCAL_MVU_SCHEMA_SIDE_TASK_FIELD_NAMES);
}

export function activateLocalMvuCalibrationSchema(schema: unknown) {
  activateRuntimeMvuCalibrationSchema(schema, 'local');
}

export function activateCdnMvuCalibrationStandard(schema: unknown) {
  activateRuntimeMvuCalibrationSchema(schema, 'cdn');
}

function activateRuntimeMvuCalibrationSchema(schema: unknown, source: ActiveMvuCalibrationSchemaSource) {
  const schemaLike = asMvuSchemaLike(schema);
  const rootShape = getMvuSchemaObjectShape(schemaLike);
  if (schemaLike === null || rootShape === null || typeof schemaLike.safeParse !== 'function') {
    throw new Error(`${source === 'cdn' ? 'CDN' : '本地'}变量结构中没有可用的 MVU Zod Schema。`);
  }

  activateLocalMvuCalibrationStandard();
  activeRuntimeSchema = schemaLike;
  activeRuntimeSchemaSource = source;
  replaceStringArray(MVU_SCHEMA_ROOT_KEYS, Object.keys(rootShape));

  const remoteFixedChildren: Record<string, string[]> = {};
  for (const [root, rootSchema] of Object.entries(rootShape)) {
    const childShape = getMvuSchemaObjectShape(rootSchema);
    remoteFixedChildren[root] = childShape === null ? [] : Object.keys(childShape);
  }
  replaceStringArrayRecord(MVU_SCHEMA_FIXED_CHILDREN, remoteFixedChildren);

  const relationshipSystem = resolveActiveRuntimeSchemaAtPath(['关系系统']);
  const relationshipSchema = getMvuSchemaCatchall(relationshipSystem);
  const relationshipShape = getMvuSchemaObjectShape(relationshipSchema);
  if (relationshipShape !== null) {
    replaceStringArray(MVU_SCHEMA_RELATIONSHIP_FIELD_NAMES, Object.keys(relationshipShape));
  }

  replaceArrayFromSchemaObject(MVU_SCHEMA_EQUIPMENT_SLOT_NAMES, ['物品系统', '_装备栏']);
  const firstEquipmentSlot = MVU_SCHEMA_EQUIPMENT_SLOT_NAMES[0];
  if (firstEquipmentSlot !== undefined) {
    replaceArrayFromSchemaObject(MVU_SCHEMA_EQUIPMENT_FIELD_NAMES, ['物品系统', '_装备栏', firstEquipmentSlot]);
  }
  replaceArrayFromSchemaObject(MVU_SCHEMA_MAIN_TASK_FIELD_NAMES, ['任务系统', '主线任务']);

  const sideTaskRecord = resolveActiveRuntimeSchemaAtPath(['任务系统', '支线任务']);
  const sideTaskValueSchema = getMvuSchemaRecordValue(sideTaskRecord);
  const sideTaskShape = getMvuSchemaObjectShape(sideTaskValueSchema);
  if (sideTaskShape !== null) {
    replaceStringArray(MVU_SCHEMA_SIDE_TASK_FIELD_NAMES, Object.keys(sideTaskShape));
  }
}

export function isUsingCdnMvuCalibrationStandard() {
  return activeRuntimeSchemaSource === 'cdn';
}

export function isMvuCalibrationSchemaPathKnown(path: string[]) {
  return activeRuntimeSchema !== null && resolveActiveRuntimeSchemaAtPath(path) !== null;
}

export function resolveMvuSchemaChildAlias(root: string, segment: string) {
  return resolveNormalizedAlias(segment, MVU_SCHEMA_CHILD_ALIASES[root] ?? {});
}

export function resolveMvuSchemaRelationshipField(segment: string) {
  const directField = findNormalizedCandidate(segment, MVU_SCHEMA_RELATIONSHIP_FIELD_NAMES);
  return directField ?? resolveNormalizedAlias(segment, MVU_SCHEMA_RELATIONSHIP_FIELD_ALIASES);
}

export function normalizeMvuSchemaScalarValue(path: string[], value: unknown): MvuSchemaValueNormalization {
  const runtimeNormalization = normalizeScalarWithActiveRuntimeSchema(path, value);
  if (runtimeNormalization !== null) {
    return runtimeNormalization;
  }

  const constraint = resolveLocalNumericConstraint(path);
  if (constraint === null) {
    return { value, changed: false, note: '' };
  }

  const numericValue = toFiniteNumber(value);
  if (numericValue === null) {
    return { value, changed: false, note: '' };
  }

  const normalizedValue = clampNumber(numericValue, constraint);
  const changed = typeof value !== 'number' || !Object.is(value, normalizedValue);

  return {
    value: normalizedValue,
    changed,
    note: changed ? `（按本地变量结构校准为 ${normalizedValue}）` : '',
  };
}

function normalizeScalarWithActiveRuntimeSchema(path: string[], value: unknown): MvuSchemaValueNormalization | null {
  const pathSchema = resolveActiveRuntimeSchemaAtPath(path);
  if (pathSchema === null || typeof pathSchema.safeParse !== 'function') {
    return null;
  }

  const directResult = pathSchema.safeParse(value);
  if (directResult.success) {
    const changed = !Object.is(value, directResult.data);
    return {
      value: directResult.data,
      changed,
      note: changed ? `（按${formatActiveRuntimeSchemaSource()}变量结构校准为 ${String(directResult.data)}）` : '',
    };
  }

  const numericValue = toFiniteNumber(value);
  const numericConstraint = resolveMvuSchemaNumericConstraint(pathSchema);
  if (numericValue === null || numericConstraint === null) {
    return { value, changed: false, note: '' };
  }

  const clampedValue = clampNumber(numericValue, numericConstraint);
  const clampedResult = pathSchema.safeParse(clampedValue);
  if (!clampedResult.success) {
    return { value, changed: false, note: '' };
  }

  const changed = !Object.is(value, clampedResult.data);
  return {
    value: clampedResult.data,
    changed,
    note: changed ? `（按${formatActiveRuntimeSchemaSource()}变量结构校准为 ${String(clampedResult.data)}）` : '',
  };
}

function resolveLocalNumericConstraint(path: string[]) {
  const formattedPath = path.join('.');
  const exactConstraint = EXACT_NUMERIC_CONSTRAINTS[formattedPath];
  if (exactConstraint !== undefined) {
    return exactConstraint;
  }

  if (path[0] === '势力声望' && path.length === 2) {
    return { min: -100, max: 100 };
  }

  if (path[0] === '关系系统' && path.length === 3) {
    if (path[2] === '好感度') {
      return { min: 0, max: 100 };
    }
    if (path[2] === '支配度') {
      return { min: -100, max: 100 };
    }
  }

  return null;
}

function resolveMvuSchemaNumericConstraint(schema: MvuSchemaLike) {
  const numericSchema = unwrapMvuSchemaToNumber(schema);
  if (numericSchema === null) {
    return null;
  }

  const minValue =
    typeof numericSchema.minValue === 'number' && Number.isFinite(numericSchema.minValue)
      ? numericSchema.minValue
      : undefined;
  const maxValue =
    typeof numericSchema.maxValue === 'number' && Number.isFinite(numericSchema.maxValue)
      ? numericSchema.maxValue
      : undefined;
  return { min: minValue, max: maxValue };
}

function resolveActiveRuntimeSchemaAtPath(path: string[]) {
  if (activeRuntimeSchema === null) {
    return null;
  }

  let currentSchema: MvuSchemaLike | null = activeRuntimeSchema;
  for (const segment of path) {
    if (currentSchema === null) {
      return null;
    }

    const unwrappedSchema = unwrapMvuSchema(currentSchema);
    const objectShape = getMvuSchemaObjectShape(unwrappedSchema);
    if (objectShape !== null) {
      currentSchema = objectShape[segment] ?? getMvuSchemaCatchall(unwrappedSchema);
      continue;
    }

    const recordValue = getMvuSchemaRecordValue(unwrappedSchema);
    if (recordValue !== null) {
      currentSchema = recordValue;
      continue;
    }

    const arrayElement = getMvuSchemaArrayElement(unwrappedSchema);
    if (arrayElement !== null && (segment === '-' || /^\d+$/.test(segment))) {
      currentSchema = arrayElement;
      continue;
    }

    return null;
  }

  return currentSchema;
}

function unwrapMvuSchema(schema: MvuSchemaLike) {
  let currentSchema = schema;
  const seen = new Set<MvuSchemaLike>();

  while (!seen.has(currentSchema)) {
    seen.add(currentSchema);
    const definition = getMvuSchemaDefinition(currentSchema);
    const type = definition?.type;
    const innerType = asMvuSchemaLike(definition?.innerType);
    if (
      innerType !== null &&
      ['prefault', 'default', 'catch', 'optional', 'nullable', 'nonoptional', 'readonly'].includes(String(type))
    ) {
      currentSchema = innerType;
      continue;
    }

    if (type === 'pipe') {
      const inputSchema = asMvuSchemaLike(definition?.in);
      if (inputSchema !== null) {
        currentSchema = inputSchema;
        continue;
      }
    }

    break;
  }

  return currentSchema;
}

function unwrapMvuSchemaToNumber(schema: MvuSchemaLike) {
  let currentSchema = schema;
  const seen = new Set<MvuSchemaLike>();

  while (!seen.has(currentSchema)) {
    seen.add(currentSchema);
    const definition = getMvuSchemaDefinition(currentSchema);
    if (definition?.type === 'number') {
      return currentSchema;
    }

    const nextSchema =
      asMvuSchemaLike(definition?.innerType) ?? (definition?.type === 'pipe' ? asMvuSchemaLike(definition.in) : null);
    if (nextSchema === null) {
      return null;
    }
    currentSchema = nextSchema;
  }

  return null;
}

function getMvuSchemaObjectShape(schema: MvuSchemaLike | null) {
  if (schema === null) {
    return null;
  }

  const unwrappedSchema = unwrapMvuSchema(schema);
  if (unwrappedSchema.shape !== undefined) {
    return unwrappedSchema.shape;
  }

  const shape = getMvuSchemaDefinition(unwrappedSchema)?.shape;
  return isMvuSchemaShape(shape) ? shape : null;
}

function getMvuSchemaCatchall(schema: MvuSchemaLike | null) {
  if (schema === null) {
    return null;
  }

  const catchall = getMvuSchemaDefinition(unwrapMvuSchema(schema))?.catchall;
  return asMvuSchemaLike(catchall);
}

function getMvuSchemaRecordValue(schema: MvuSchemaLike | null) {
  if (schema === null) {
    return null;
  }

  const definition = getMvuSchemaDefinition(unwrapMvuSchema(schema));
  if (definition?.type !== 'record') {
    return null;
  }
  return asMvuSchemaLike(definition.valueType);
}

function getMvuSchemaArrayElement(schema: MvuSchemaLike | null) {
  if (schema === null) {
    return null;
  }

  const definition = getMvuSchemaDefinition(unwrapMvuSchema(schema));
  if (definition?.type !== 'array') {
    return null;
  }
  return asMvuSchemaLike(definition.element);
}

function replaceArrayFromSchemaObject(target: string[], path: string[]) {
  const shape = getMvuSchemaObjectShape(resolveActiveRuntimeSchemaAtPath(path));
  if (shape !== null) {
    replaceStringArray(target, Object.keys(shape));
  }
}

function formatActiveRuntimeSchemaSource() {
  return activeRuntimeSchemaSource === 'cdn' ? ' CDN ' : '本地';
}

function getMvuSchemaDefinition(schema: MvuSchemaLike) {
  return schema._def ?? schema.def ?? null;
}

function asMvuSchemaLike(value: unknown): MvuSchemaLike | null {
  if (value === null || typeof value !== 'object') {
    return null;
  }
  return value as MvuSchemaLike;
}

function isMvuSchemaShape(value: unknown): value is Record<string, MvuSchemaLike> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function findNormalizedCandidate(segment: string, candidates: string[]) {
  const normalizedSegment = normalizeSchemaSegment(segment);
  return candidates.find(candidate => normalizeSchemaSegment(candidate) === normalizedSegment) ?? null;
}

function resolveNormalizedAlias(segment: string, aliases: Record<string, string>) {
  const normalizedSegment = normalizeSchemaSegment(segment);
  const match = Object.entries(aliases).find(([alias]) => normalizeSchemaSegment(alias) === normalizedSegment);
  return match?.[1] ?? null;
}

function normalizeSchemaSegment(segment: string) {
  return segment.replace(/[ _$.\-—/\\\s]/g, '').toLowerCase();
}

function clampNumber(value: number, constraint: NumericConstraint) {
  return Math.min(constraint.max ?? Infinity, Math.max(constraint.min ?? -Infinity, value));
}

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function cloneStringArrayRecord(source: Record<string, string[]>) {
  return Object.fromEntries(Object.entries(source).map(([key, values]) => [key, [...values]]));
}

function replaceStringArray(target: string[], source: string[]) {
  target.splice(0, target.length, ...source);
}

function replaceStringArrayRecord(target: Record<string, string[]>, source: Record<string, string[]>) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, cloneStringArrayRecord(source));
}
