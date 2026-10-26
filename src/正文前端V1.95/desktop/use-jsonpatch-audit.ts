import { ref, watch } from 'vue';
import type { ComputedRef } from 'vue';
import {
  MVU_SCHEMA_EQUIPMENT_FIELD_NAMES as EQUIPMENT_FIELD_NAMES,
  MVU_SCHEMA_EQUIPMENT_SLOT_NAMES as EQUIPMENT_SLOT_NAMES,
  MVU_SCHEMA_FIXED_CHILDREN as MVU_FIXED_CHILDREN,
  MVU_SCHEMA_MAIN_TASK_FIELD_NAMES as MAIN_TASK_FIELD_NAMES,
  MVU_SCHEMA_ROOT_ALIASES as MVU_ROOT_ALIASES,
  MVU_SCHEMA_ROOT_KEYS as MVU_ROOT_KEYS,
  MVU_SCHEMA_SIDE_TASK_FIELD_NAMES as SIDE_TASK_FIELD_NAMES,
  isMvuCalibrationSchemaPathKnown,
  normalizeMvuSchemaScalarValue,
  resolveMvuSchemaChildAlias,
  resolveMvuSchemaRelationshipField,
} from '../engine/mvu-calibration-standard';
import { ensureMvuCalibrationStandard } from '../engine/mvu-calibration-standard-loader';
import { showTavernNotice } from '../mobile/relationship-runtime';
import type { ContentRendererContext } from '../types/content-renderer';
import type {
  JsonPatchAuditItem,
  JsonPatchAuditItemStatus,
  JsonPatchAuditView,
  JsonPatchOperationView,
  JsonPatchPanelView,
} from './panel-runtime';
import { isJsonPatchDeltaOperation, resolveJsonPatchOperationTone } from './panel-runtime';
import {
  calibrateRelationshipNamesInStatData,
  resolveCanonicalRelationshipContactName,
} from './relationship-name-calibration';
import { calibrateMvuSchemaStandardInStatData } from './mvu-schema-calibration';

type MvuMessageOption = { type: 'message'; message_id: number | 'latest' };

type TavernVariableGlobal = typeof globalThis & {
  Mvu?: {
    getMvuData?: (option: MvuMessageOption) => unknown;
    replaceMvuData?: (data: unknown, option: MvuMessageOption) => unknown | Promise<unknown>;
  };
  waitGlobalInitialized?: (name: string) => unknown | Promise<unknown>;
  getVariables?: (option: MvuMessageOption) => unknown;
};

export function useJsonPatchAudit(
  context: Pick<ContentRendererContext, 'message_id' | 'variable_revision' | 'set_variable_refresh_needed'>,
  jsonPatchPanel: ComputedRef<JsonPatchPanelView | null>,
) {
  const jsonPatchAudit = ref<JsonPatchAuditView>(createIdleJsonPatchAuditView());
  const isJsonPatchPanelCollapsed = ref(false);

  watch(jsonPatchPanel, () => {
    jsonPatchAudit.value = createIdleJsonPatchAuditView();
  });
  function createIdleJsonPatchAuditView(): JsonPatchAuditView {
    return {
      status: 'idle',
      summary: '',
      items: [],
    };
  }

  const JSONPATCH_AUDIT_LABELS: Record<JsonPatchAuditItemStatus, string> = {
    ok: '已通过',
    fixed: '已修正',
    applied: '已补写',
    blocked: '已阻止',
    skipped: '未处理',
    error: '失败',
  };

  const MVU_FORBIDDEN_PATHS = [
    '角色基础.$头像URL',
    '角色基础.段位积分',
    '核心状态._魅力',
    '核心状态._幸运',
    '核心状态._闪避率',
    '核心状态._暴击率',
    '核心状态.$基础性斗力',
    '核心状态.$基础忍耐力',
    '性斗系统.当前回合',
    '性斗系统.高潮次数',
    '性斗系统.战斗摘要',
    '性斗系统.实时性斗力',
    '性斗系统.实时忍耐力',
    '性斗系统.行动日志',
    '性斗系统.战斗物品',
    '性斗系统.对手耐力',
    '性斗系统.对手最大耐力',
    '性斗系统.对手快感',
    '性斗系统.对手最大快感',
    '性斗系统.对手高潮次数',
    '性斗系统.对手性斗力',
    '性斗系统.对手忍耐力',
    '性斗系统.对手魅力',
    '性斗系统.对手幸运',
    '性斗系统.对手闪避率',
    '性斗系统.对手暴击率',
    '性斗系统.对手实时性斗力',
    '性斗系统.对手实时忍耐力',
    '性斗系统.对手临时状态',
    '性斗系统.对手技能冷却',
    '性斗系统.对手可用技能',
    '性斗系统.$可用技能',
    '性斗系统.$技能冷却',
    '临时状态.加成统计',
    '临时状态.七宗罪状态',
    '永久状态.加成统计',
    '物品系统.装备总加成',
    '物品系统.已激活作弊码',
  ];

  const MVU_PATH_MIGRATIONS: Record<string, string> = {
    '核心状态._魅力': '基础属性._魅力',
    '核心状态.魅力': '基础属性._魅力',
    '核心状态._幸运': '基础属性._幸运',
    '核心状态.幸运': '基础属性._幸运',
    '核心状态._闪避率': '基础属性._闪避率',
    '核心状态.闪避率': '基础属性._闪避率',
    '核心状态._暴击率': '基础属性._暴击率',
    '核心状态.暴击率': '基础属性._暴击率',
    '核心状态._最大耐力': '核心状态.$最大耐力',
    '核心状态.最大耐力': '核心状态.$最大耐力',
    '核心状态._耐力': '核心状态.$耐力',
    '核心状态.耐力': '核心状态.$耐力',
    '核心状态._最大快感': '核心状态.$最大快感',
    '核心状态.最大快感': '核心状态.$最大快感',
    '核心状态._快感': '核心状态.$快感',
    '核心状态.快感': '核心状态.$快感',
    '性斗系统.$可用技能': '技能系统.主动技能',
    '性斗系统.可用技能': '技能系统.主动技能',
    '位置系统.当前地点': '位置系统.地点名称',
    '位置系统.地点': '位置系统.地点名称',
    '位置系统.当前位置': '位置系统.地点名称',
    '位置系统.区域': '位置系统.地点名称',
    '位置系统.当前区域': '位置系统.地点名称',
    '物品系统.装备栏': '物品系统._装备栏',
  };

  const ARRAY_APPEND_SEGMENT = '-';

  function createJsonPatchAuditItem(
    index: number,
    status: JsonPatchAuditItemStatus,
    path: string,
    message: string,
  ): JsonPatchAuditItem {
    return {
      index,
      status,
      path,
      label: JSONPATCH_AUDIT_LABELS[status],
      message,
    };
  }

  async function handleJsonPatchAuditClick() {
    const panel = jsonPatchPanel.value;
    if (panel === null || panel.operations.length === 0 || jsonPatchAudit.value.status === 'checking') {
      return;
    }

    jsonPatchAudit.value = {
      status: 'checking',
      summary: '正在读取当前楼层 MVU，并比对上一楼变量。',
      items: [],
    };

    try {
      const auditView = await auditJsonPatchOperations(panel.operations, context.message_id);
      jsonPatchAudit.value = auditView;
      if (auditView.items.some(item => item.status === 'applied' || item.status === 'fixed')) {
        context.variable_revision += 1;
        context.set_variable_refresh_needed(false);
      }
      showTavernNotice(auditView.summary, '变量校对', auditView.status === 'error' ? 'error' : 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      jsonPatchAudit.value = {
        status: 'error',
        summary: `校对失败：${message}`,
        items: [],
      };
      showTavernNotice(`校对失败：${message}`, '变量校对', 'error');
    }
  }

  async function auditJsonPatchOperations(
    operations: JsonPatchOperationView[],
    messageId: number,
  ): Promise<JsonPatchAuditView> {
    const standardResolution = await ensureMvuCalibrationStandard();
    const target = await getWritableMvuTarget(messageId);
    const previousMvuData = readPreviousMvuData(messageId);
    const previousStatData = asRecord(asRecord(previousMvuData)?.stat_data);
    const items: JsonPatchAuditItem[] = [];
    let changed = false;
    let calibrationItemIndex = -1;

    items.push(
      createJsonPatchAuditItem(
        calibrationItemIndex,
        standardResolution.source === 'local-fallback' ? 'skipped' : 'ok',
        '变量结构标准',
        standardResolution.message,
      ),
    );
    calibrationItemIndex -= 1;

    const appendStandardCalibration = () => {
      const schemaCalibration = calibrateMvuSchemaStandardInStatData(target.statData);
      changed ||= schemaCalibration.changed;
      for (const change of schemaCalibration.changes) {
        items.push(createJsonPatchAuditItem(calibrationItemIndex, 'fixed', change.path, change.message));
        calibrationItemIndex -= 1;
      }

      const calibration = calibrateRelationshipNamesInStatData(target.statData);
      changed ||= calibration.changed;
      for (const change of calibration.changes) {
        items.push(createJsonPatchAuditItem(calibrationItemIndex, 'fixed', change.path, change.message));
        calibrationItemIndex -= 1;
      }
    };

    appendStandardCalibration();

    for (const operation of operations) {
      const result = applyJsonPatchAuditOperation(operation, target.statData, previousStatData);
      changed ||= result.changed;
      items.push(result.item);
    }

    appendStandardCalibration();

    if (changed) {
      await target.runtime.Mvu?.replaceMvuData?.(target.mvuData, target.option);
    }

    const fixedCount = items.filter(item => item.status === 'fixed').length;
    const appliedCount = items.filter(item => item.status === 'applied').length;
    const blockedCount = items.filter(item => item.status === 'blocked').length;
    const skippedCount = items.filter(item => item.status === 'skipped' || item.status === 'error').length;
    const summaryParts = [
      fixedCount > 0 ? `修正 ${fixedCount}` : '',
      appliedCount > 0 ? `补写 ${appliedCount}` : '',
      blockedCount > 0 ? `阻止 ${blockedCount}` : '',
      skippedCount > 0 ? `待人工 ${skippedCount}` : '',
    ].filter(Boolean);

    return {
      status: 'done',
      summary:
        summaryParts.length > 0 ? `校对完成：${summaryParts.join(' / ')}` : '校对完成：当前变量路径和值均已同步。',
      items,
    };
  }

  function applyJsonPatchAuditOperation(
    operation: JsonPatchOperationView,
    statData: Record<string, unknown>,
    previousStatData: Record<string, unknown> | null,
  ) {
    const resolvedPath = resolveMvuPatchPath(operation.path);
    if (resolvedPath.status === 'blocked') {
      return {
        changed: false,
        item: createJsonPatchAuditItem(
          operation.index,
          'blocked',
          operation.path,
          `${operation.path} 是运行态或废弃路径，已跳过。`,
        ),
      };
    }

    if (resolvedPath.status === 'skipped') {
      return {
        changed: false,
        item: createJsonPatchAuditItem(
          operation.index,
          'skipped',
          operation.path,
          `${operation.path} 无法安全匹配到性斗学园 v2 路径。`,
        ),
      };
    }

    const originalSegments = parseMvuPatchPath(operation.path);
    const canonicalPath = formatMvuPath(resolvedPath.segments);
    const pathWasFixed = formatMvuPath(originalSegments) !== canonicalPath;
    const opTone = resolveJsonPatchOperationTone(operation.op);
    const previousValue =
      previousStatData === null ? undefined : readRecordPath(previousStatData, resolvedPath.valueSegments);
    const diffNote = formatJsonPatchAuditDiffNote(operation, previousValue);
    let changed = false;

    if (opTone === 'remove') {
      const hadCanonicalValue = readRecordPath(statData, resolvedPath.valueSegments) !== undefined;
      if (hadCanonicalValue) {
        unsetRecordPath(statData, resolvedPath.valueSegments);
        changed = true;
      }

      changed ||= unsetOriginalWrongPath(statData, originalSegments, resolvedPath.valueSegments);
      const status: JsonPatchAuditItemStatus = changed ? (pathWasFixed ? 'fixed' : 'applied') : 'ok';
      const message = changed ? `${canonicalPath} 已移除。` : `${canonicalPath} 本来就未写入。`;
      return {
        changed,
        item: createJsonPatchAuditItem(operation.index, status, canonicalPath, message),
      };
    }

    if (!operation.hasValue) {
      return {
        changed: false,
        item: createJsonPatchAuditItem(
          operation.index,
          'skipped',
          canonicalPath,
          `${canonicalPath} 没有 value，无法补写。`,
        ),
      };
    }

    const rawWriteValue = resolveJsonPatchAuditWriteValue(operation, previousValue);
    const schemaNormalization = normalizeMvuSchemaScalarValue(resolvedPath.valueSegments, rawWriteValue);
    const writeValue = schemaNormalization.value;
    if (resolvedPath.append) {
      const appendChanged = appendRecordPathValue(statData, resolvedPath.valueSegments, writeValue);
      changed ||= appendChanged;
    } else {
      const currentValue = readRecordPath(statData, resolvedPath.valueSegments);
      if (!areMvuValuesEqual(currentValue, writeValue)) {
        setMvuRecordPath(statData, resolvedPath.valueSegments, cloneJsonPatchValue(writeValue));
        changed = true;
      }
    }

    changed ||= unsetOriginalWrongPath(statData, originalSegments, resolvedPath.valueSegments);
    const valueWasFixed = schemaNormalization.changed;
    const status: JsonPatchAuditItemStatus = changed
      ? pathWasFixed || valueWasFixed
        ? 'fixed'
        : 'applied'
      : pathWasFixed || valueWasFixed
        ? 'fixed'
        : 'ok';
    const pathMessage = pathWasFixed ? `${operation.path} -> ${canonicalPath}` : canonicalPath;
    const actionMessage = changed ? '已写回' : '已同步';

    return {
      changed,
      item: createJsonPatchAuditItem(
        operation.index,
        status,
        canonicalPath,
        `${pathMessage} ${actionMessage}${diffNote}${schemaNormalization.note}`,
      ),
    };
  }

  function resolveJsonPatchAuditWriteValue(operation: JsonPatchOperationView, previousValue: unknown) {
    const numericPrevious = toFiniteNumber(previousValue);
    const numericDelta = resolveJsonPatchNumericDelta(operation);
    const stringValue = typeof operation.rawValue === 'string' ? operation.rawValue.trim() : '';
    const deltaMatch = stringValue.match(/^([+-])\s*(\d+(?:\.\d+)?)$/);

    if (numericPrevious !== null && numericDelta !== null) {
      return numericPrevious + numericDelta;
    }

    if (numericPrevious !== null && deltaMatch !== null) {
      const delta = Number(deltaMatch[2]) * (deltaMatch[1] === '-' ? -1 : 1);
      return numericPrevious + delta;
    }

    return cloneJsonPatchValue(operation.rawValue);
  }

  function formatJsonPatchAuditDiffNote(operation: JsonPatchOperationView, previousValue: unknown) {
    const numericPrevious = toFiniteNumber(previousValue);
    const numericRawValue = toFiniteNumber(operation.rawValue);
    const numericDelta = resolveJsonPatchNumericDelta(operation);
    const stringValue = typeof operation.rawValue === 'string' ? operation.rawValue.trim() : '';
    const deltaMatch = stringValue.match(/^([+-])\s*(\d+(?:\.\d+)?)$/);

    if (numericPrevious !== null && numericDelta !== null) {
      return `（上一楼 ${numericPrevious} ${numericDelta >= 0 ? '+' : ''}${numericDelta}）`;
    }

    if (numericPrevious !== null && deltaMatch !== null) {
      const delta = Number(deltaMatch[2]) * (deltaMatch[1] === '-' ? -1 : 1);
      return `（上一楼 ${numericPrevious} ${delta >= 0 ? '+' : ''}${delta}）`;
    }

    if (numericPrevious !== null && numericRawValue !== null) {
      const delta = numericRawValue - numericPrevious;
      if (delta !== 0) {
        return `（上一楼 ${numericPrevious} -> ${numericRawValue}，差值 ${delta >= 0 ? '+' : ''}${delta}）`;
      }
    }

    return '';
  }

  function resolveJsonPatchNumericDelta(operation: JsonPatchOperationView) {
    const numericRawValue = toFiniteNumber(operation.rawValue);
    if (numericRawValue === null) {
      return null;
    }

    const op = operation.op.toLowerCase();
    if (op === 'delta' || op === 'inc' || op === 'increase') {
      return numericRawValue;
    }

    if (op === 'dec' || op === 'decrease') {
      return -numericRawValue;
    }

    return null;
  }

  function parseMvuPatchPath(path: string) {
    const trimmedPath = path.trim();
    const parts = trimmedPath.includes('/')
      ? trimmedPath.split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
      : trimmedPath.split(/[.．]/);

    return parts.map(part => part.trim()).filter(part => part.length > 0 && part !== 'stat_data');
  }

  function resolveMvuPatchPath(
    path: string,
  ):
    | { status: 'ok'; segments: string[]; valueSegments: string[]; append: boolean }
    | { status: 'blocked' }
    | { status: 'skipped' } {
    const originalSegments = parseMvuPatchPath(path);
    if (originalSegments.length === 0) {
      return { status: 'skipped' };
    }

    const migratedPath = MVU_PATH_MIGRATIONS[formatMvuPath(originalSegments)];
    const migratedSegments = migratedPath === undefined ? null : parseMvuPatchPath(migratedPath);
    const canonicalSegments = canonicalizeMvuPathSegments(migratedSegments ?? originalSegments);
    if (canonicalSegments === null || canonicalSegments.length === 0) {
      return { status: 'skipped' };
    }

    if (isForbiddenMvuPathSegments(canonicalSegments)) {
      return { status: 'blocked' };
    }

    const append = canonicalSegments.at(-1) === ARRAY_APPEND_SEGMENT;
    const valueSegments = append ? canonicalSegments.slice(0, -1) : canonicalSegments;
    if (!isWritableMvuPathSegments(canonicalSegments, valueSegments, append)) {
      return { status: 'skipped' };
    }

    return {
      status: 'ok',
      segments: canonicalSegments,
      valueSegments,
      append,
    };
  }

  function canonicalizeMvuPathSegments(segments: string[]) {
    const normalizedSegments = [...segments];
    let root = findCanonicalSegment(normalizedSegments[0], MVU_ROOT_KEYS);
    if (root === null) {
      const rootAlias = MVU_ROOT_ALIASES[normalizedSegments[0]];
      if (rootAlias === undefined) {
        return null;
      }

      root = rootAlias;
      if (rootAlias !== normalizedSegments[0]) {
        const aliasAsChild = canonicalizeMvuChildSegment(root, normalizedSegments[0]);
        normalizedSegments[0] = root;
        if (aliasAsChild !== null && aliasAsChild !== root && normalizedSegments[1] !== aliasAsChild) {
          normalizedSegments.splice(1, 0, aliasAsChild);
        }
      }
    } else {
      normalizedSegments[0] = root;
    }

    const children = MVU_FIXED_CHILDREN[root] ?? [];
    if (normalizedSegments[1] !== undefined) {
      const child =
        canonicalizeMvuChildSegment(root, normalizedSegments[1]) ??
        findCanonicalSegment(normalizedSegments[1], children);
      if (child !== null) {
        normalizedSegments[1] = child;
      }
    }

    canonicalizeNestedMvuSegments(normalizedSegments);
    return normalizedSegments;
  }

  function canonicalizeMvuChildSegment(root: string, segment: string) {
    const fixedChild = findCanonicalSegment(segment, MVU_FIXED_CHILDREN[root] ?? []);
    if (fixedChild !== null) {
      return fixedChild;
    }

    return resolveMvuSchemaChildAlias(root, segment);
  }

  function canonicalizeNestedMvuSegments(segments: string[]) {
    if (segments[0] === '性斗系统' && segments[1] === '胜负规则' && segments[2] !== undefined) {
      const field = findCanonicalSegment(segments[2], ['高潮次数上限', '允许认输']);
      if (field !== null) {
        segments[2] = field;
      }
    }

    if (segments[0] === '关系系统') {
      if (segments[1] !== undefined && segments[1] !== '在场人物') {
        const canonicalName = resolveCanonicalRelationshipContactName(segments[1]);
        if (canonicalName.length > 0) {
          segments[1] = canonicalName;
        }
      }

      if (segments[2] !== undefined) {
        const field = resolveMvuSchemaRelationshipField(segments[2]);
        if (field !== null) {
          segments[2] = field;
        }
      }
    }

    if (segments[0] === '物品系统' && segments[1] === '_装备栏' && segments[2] !== undefined) {
      const slot = findCanonicalSegment(segments[2], EQUIPMENT_SLOT_NAMES);
      if (slot !== null) {
        segments[2] = slot;
      }

      if (segments[3] !== undefined) {
        const field = findCanonicalSegment(segments[3], EQUIPMENT_FIELD_NAMES);
        if (field !== null) {
          segments[3] = field;
        }
      }
    }

    if (segments[0] === '任务系统' && segments[1] === '主线任务' && segments[2] !== undefined) {
      const field = findCanonicalSegment(segments[2], MAIN_TASK_FIELD_NAMES);
      if (field !== null) {
        segments[2] = field;
      }
    }

    if (segments[0] === '任务系统' && segments[1] === '支线任务' && segments[3] !== undefined) {
      const field = findCanonicalSegment(segments[3], SIDE_TASK_FIELD_NAMES);
      if (field !== null) {
        segments[3] = field;
      }
    }
  }

  function isWritableMvuPathSegments(segments: string[], valueSegments: string[], append: boolean) {
    const [root, second, third] = valueSegments;
    if (!MVU_ROOT_KEYS.includes(root)) {
      return false;
    }

    if (append) {
      return (
        formatMvuPath(valueSegments) === '关系系统.在场人物' || formatMvuPath(valueSegments) === '任务系统.已完成记录'
      );
    }

    if (valueSegments.length >= 2 && isMvuCalibrationSchemaPathKnown(valueSegments)) {
      return true;
    }

    if (
      formatMvuPath(valueSegments) === '关系系统.在场人物' ||
      formatMvuPath(valueSegments) === '任务系统.已完成记录'
    ) {
      return true;
    }

    if (root === '临时状态' || root === '永久状态') {
      return second === '状态列表' && valueSegments.length >= 3;
    }

    if (root === '关系系统') {
      return (
        second !== undefined &&
        (second === '在场人物' || valueSegments.length === 2 || resolveMvuSchemaRelationshipField(third ?? '') !== null)
      );
    }

    if (root === '物品系统') {
      return (
        formatMvuPath(valueSegments) === '物品系统.学园金币' ||
        (second === '背包' && valueSegments.length >= 3) ||
        (second === '_装备栏' && valueSegments.length >= 2)
      );
    }

    if (root === '技能系统') {
      return (second === '主动技能' || second === '$天赋') && valueSegments.length >= 2;
    }

    if (root === '任务系统') {
      return (
        (second === '主线任务' && valueSegments.length >= 3) || (second === '支线任务' && valueSegments.length >= 3)
      );
    }

    if (root === '性斗系统') {
      return (
        ['性斗系统.对手名称', '性斗系统.性斗类型'].includes(formatMvuPath(valueSegments)) ||
        (second === '胜负规则' && ['高潮次数上限', '允许认输'].includes(third))
      );
    }

    const fixedChildren = MVU_FIXED_CHILDREN[root] ?? [];
    return valueSegments.length === 2 && fixedChildren.includes(second);
  }

  function isForbiddenMvuPathSegments(segments: string[]) {
    const path = formatMvuPath(segments.filter(segment => segment !== ARRAY_APPEND_SEGMENT));
    return MVU_FORBIDDEN_PATHS.some(forbidden => path === forbidden || path.startsWith(`${forbidden}.`));
  }

  function findCanonicalSegment(segment: string | undefined, candidates: string[]) {
    if (segment === undefined) {
      return null;
    }

    const direct = candidates.find(candidate => candidate === segment);
    if (direct !== undefined) {
      return direct;
    }

    const normalizedSegment = normalizeMvuSegment(segment);
    return candidates.find(candidate => normalizeMvuSegment(candidate) === normalizedSegment) ?? null;
  }

  function normalizeMvuSegment(segment: string) {
    return segment.replace(/[ _$.\-—/\\\s]/g, '').toLowerCase();
  }

  function formatMvuPath(segments: string[]) {
    return segments.filter(segment => segment.length > 0).join('.');
  }

  function readPreviousMvuData(messageId: number) {
    for (
      let previousMessageId = messageId - 1;
      previousMessageId >= Math.max(0, messageId - 8);
      previousMessageId -= 1
    ) {
      const data = readMvuData(previousMessageId);
      if (asRecord(asRecord(data)?.stat_data) !== null) {
        return data;
      }
    }

    return null;
  }

  async function getWritableMvuTarget(messageId: number) {
    const options: MvuMessageOption[] = [
      { type: 'message', message_id: messageId },
      { type: 'message', message_id: 'latest' },
    ];

    for (const runtime of getTavernRuntimeCandidates()) {
      try {
        await runtime.waitGlobalInitialized?.('Mvu');
      } catch {
        // Direct MVU probing below may still work.
      }

      if (typeof runtime.Mvu?.getMvuData !== 'function' || typeof runtime.Mvu.replaceMvuData !== 'function') {
        continue;
      }

      for (const option of options) {
        const mvuData = runtime.Mvu.getMvuData(option);
        const mvuRecord = asRecord(mvuData);
        if (mvuRecord === null) {
          continue;
        }

        let statData = asRecord(mvuRecord.stat_data);
        if (statData === null) {
          mvuRecord.stat_data = {};
          statData = asRecord(mvuRecord.stat_data);
        }

        if (statData !== null) {
          return {
            runtime,
            option,
            mvuData,
            statData,
          };
        }
      }
    }

    throw Error('MVU replaceMvuData is unavailable');
  }

  function readRecordPath(source: unknown, path: string[]) {
    let current: unknown = source;
    for (const segment of path) {
      if (Array.isArray(current)) {
        if (!/^\d+$/.test(segment)) {
          return undefined;
        }

        current = current[Number(segment)];
        continue;
      }

      const record = asRecord(current);
      if (record === null || !(segment in record)) {
        return undefined;
      }

      current = record[segment];
    }

    return current;
  }

  function setMvuRecordPath(target: Record<string, unknown>, path: string[], value: unknown) {
    let current: unknown = target;
    for (let index = 0; index < path.length - 1; index += 1) {
      const segment = path[index];
      const nextSegment = path[index + 1];

      if (Array.isArray(current)) {
        const arrayIndex = Number(segment);
        if (!Number.isInteger(arrayIndex) || arrayIndex < 0) {
          return;
        }

        if (
          current[arrayIndex] === undefined ||
          typeof current[arrayIndex] !== 'object' ||
          current[arrayIndex] === null
        ) {
          current[arrayIndex] = /^\d+$/.test(nextSegment) || nextSegment === ARRAY_APPEND_SEGMENT ? [] : {};
        }

        current = current[arrayIndex];
        continue;
      }

      const record = asRecord(current);
      if (record === null) {
        return;
      }

      const next = record[segment];
      if (next === null || typeof next !== 'object') {
        record[segment] = /^\d+$/.test(nextSegment) || nextSegment === ARRAY_APPEND_SEGMENT ? [] : {};
      }

      current = record[segment];
    }

    const lastSegment = path.at(-1);
    if (lastSegment === undefined) {
      return;
    }

    if (Array.isArray(current)) {
      if (lastSegment === ARRAY_APPEND_SEGMENT) {
        current.push(value);
        return;
      }

      const arrayIndex = Number(lastSegment);
      if (Number.isInteger(arrayIndex) && arrayIndex >= 0) {
        current[arrayIndex] = value;
      }
      return;
    }

    const record = asRecord(current);
    if (record !== null) {
      record[lastSegment] = value;
    }
  }

  function appendRecordPathValue(target: Record<string, unknown>, path: string[], value: unknown) {
    const currentValue = readRecordPath(target, path);
    let arrayValue: unknown[];
    if (Array.isArray(currentValue)) {
      arrayValue = currentValue;
    } else {
      arrayValue = [];
      setMvuRecordPath(target, path, arrayValue);
    }

    if (arrayValue.some(item => areMvuValuesEqual(item, value))) {
      return false;
    }

    arrayValue.push(cloneJsonPatchValue(value));
    return true;
  }

  function unsetRecordPath(target: Record<string, unknown>, path: string[]) {
    let current: unknown = target;
    for (let index = 0; index < path.length - 1; index += 1) {
      const segment = path[index];
      current = Array.isArray(current) ? current[Number(segment)] : asRecord(current)?.[segment];
      if (current === undefined || current === null) {
        return false;
      }
    }

    const lastSegment = path.at(-1);
    if (lastSegment === undefined) {
      return false;
    }

    if (Array.isArray(current)) {
      const arrayIndex = Number(lastSegment);
      if (Number.isInteger(arrayIndex) && arrayIndex >= 0 && arrayIndex < current.length) {
        current.splice(arrayIndex, 1);
        return true;
      }
      return false;
    }

    const record = asRecord(current);
    if (record !== null && lastSegment in record) {
      delete record[lastSegment];
      return true;
    }

    return false;
  }

  function unsetOriginalWrongPath(
    statData: Record<string, unknown>,
    originalSegments: string[],
    canonicalSegments: string[],
  ) {
    if (
      originalSegments.length === 0 ||
      originalSegments.includes(ARRAY_APPEND_SEGMENT) ||
      formatMvuPath(originalSegments) === formatMvuPath(canonicalSegments)
    ) {
      return false;
    }

    return unsetRecordPath(statData, originalSegments);
  }

  function areMvuValuesEqual(left: unknown, right: unknown) {
    const leftNumber = toFiniteNumber(left);
    const rightNumber = toFiniteNumber(right);
    if (leftNumber !== null && rightNumber !== null) {
      return leftNumber === rightNumber;
    }

    return JSON.stringify(left) === JSON.stringify(right);
  }

  function toFiniteNumber(value: unknown) {
    const unwrapped = unwrapMvuValue(value);
    if (typeof unwrapped === 'number' && Number.isFinite(unwrapped)) {
      return unwrapped;
    }

    if (typeof unwrapped === 'string' && unwrapped.trim().length > 0) {
      const parsed = Number(unwrapped);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  function cloneJsonPatchValue<T>(value: T): T {
    if (value === undefined) {
      return value;
    }

    try {
      return JSON.parse(JSON.stringify(value)) as T;
    } catch {
      return value;
    }
  }

  return {
    jsonPatchAudit,
    isJsonPatchPanelCollapsed,
    handleJsonPatchAuditClick,
  };
}
function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function unwrapMvuValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function readPath(source: unknown, path: string[]) {
  let current = source;

  for (const key of path) {
    const record = asRecord(unwrapMvuValue(current));
    if (record === null || !(key in record)) {
      return undefined;
    }

    current = record[key];
  }

  return unwrapMvuValue(current);
}

function readMvuData(messageId: number | 'latest') {
  for (const runtime of getTavernRuntimeCandidates()) {
    try {
      const value = runtime.Mvu?.getMvuData?.({ type: 'message', message_id: messageId });
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // Try the next runtime candidate. Iframes may expose MVU only on the parent window.
    }
  }

  return null;
}

function readVariables(messageId: number | 'latest') {
  for (const runtime of getTavernRuntimeCandidates()) {
    try {
      const value = runtime.getVariables?.({ type: 'message', message_id: messageId });
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // Try the next runtime candidate. Iframes may expose variables only on the parent window.
    }
  }

  return null;
}

function getTavernRuntimeCandidates() {
  const candidates: TavernVariableGlobal[] = [globalThis as TavernVariableGlobal];
  try {
    if (typeof window !== 'undefined' && window.parent !== window) {
      candidates.push(window.parent as unknown as TavernVariableGlobal);
    }
  } catch {
    // Cross-frame access may be blocked in some preview containers.
  }

  return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
}
