import {
  applyWorldbookPatch,
  createLorebookAction,
  isAttributeNode,
  normalizeVirtualPath,
  resolveFileNode,
  resolveWritableFileNode,
  setAttributeAction,
  writeAction,
} from './wtc-compat';
import type {
  WorkshopArtifact,
  WorkshopExecutionRecord,
  WorkshopWriteOperation,
} from '../stores/workshop';

function makeRecord(
  operation: WorkshopWriteOperation,
  status: WorkshopExecutionRecord['status'],
  title: string,
  detail: string,
  result?: unknown,
): WorkshopExecutionRecord {
  return {
    id: `${operation.id}-${status}`,
    operationId: operation.id,
    tool: operation.tool,
    targetPath: operation.targetPath,
    status,
    title,
    detail,
    riskLevel: operation.riskLevel,
    ...(result === undefined ? {} : { result }),
  };
}

function runtimeAvailable(): boolean {
  return typeof SillyTavern !== 'undefined' && typeof getWorldbookNames === 'function';
}

function findArtifact(artifacts: WorkshopArtifact[], operation: WorkshopWriteOperation): WorkshopArtifact | null {
  if (operation.artifactId) {
    return artifacts.find(artifact => artifact.id === operation.artifactId) ?? null;
  }
  return artifacts.find(artifact => artifact.targetPath === operation.targetPath) ?? null;
}

function getLorebookName(operation: WorkshopWriteOperation): string | null {
  if (operation.lorebookName) return operation.lorebookName;
  const normalized = normalizeVirtualPath(operation.targetPath);
  if (!normalized) return null;
  const segments = normalized.split('/').filter(Boolean);
  return segments[0] === 'Worldbooks' && segments[1] ? segments[1] : null;
}

function getLorebookEntryPath(operation: WorkshopWriteOperation): string | null {
  const normalized = normalizeVirtualPath(operation.targetPath);
  if (!normalized) return null;
  const segments = normalized.split('/').filter(Boolean);
  if (segments[0] !== 'Worldbooks' || !segments[1] || segments.length < 3) return null;
  return segments.slice(2).join('/');
}

function worldbookExists(name: string): boolean {
  try {
    return getWorldbookNames().includes(name);
  } catch {
    return false;
  }
}

function hasPlannedWriteBefore(operations: WorkshopWriteOperation[], operation: WorkshopWriteOperation): boolean {
  const currentIndex = operations.findIndex(item => item.id === operation.id);
  if (currentIndex <= 0) return false;
  return operations
    .slice(0, currentIndex)
    .some(item => item.tool === 'Write' && normalizeVirtualPath(item.targetPath) === normalizeVirtualPath(operation.targetPath));
}

function hasPlannedLorebookBefore(operations: WorkshopWriteOperation[], operation: WorkshopWriteOperation): boolean {
  const lorebookName = getLorebookName(operation);
  if (!lorebookName) return false;
  const currentIndex = operations.findIndex(item => item.id === operation.id);
  if (currentIndex <= 0) return false;
  return operations.slice(0, currentIndex).some(item => {
    return item.tool === 'CreateLorebook' && getLorebookName(item) === lorebookName;
  });
}

export async function dryrunWorkshopPlan(
  artifacts: WorkshopArtifact[],
  operations: WorkshopWriteOperation[],
): Promise<WorkshopExecutionRecord[]> {
  if (!operations.length) {
    return [
      {
        id: 'empty-plan',
        operationId: 'empty-plan',
        tool: 'Write',
        targetPath: '',
        status: 'blocked',
        title: '没有可执行计划',
        detail: '请先在宝宝辅食表单里生成产物预览。',
        riskLevel: 'danger',
      },
    ];
  }
  if (!runtimeAvailable()) {
    return operations.map(operation =>
      makeRecord(operation, 'blocked', '酒馆运行环境不可用', '当前页面没有检测到 Tavern Helper / SillyTavern 运行时。'),
    );
  }

  const records: WorkshopExecutionRecord[] = [];
  for (const operation of operations) {
    const normalized = normalizeVirtualPath(operation.targetPath);

    if (operation.tool === 'CreateLorebook') {
      const lorebookName = getLorebookName(operation);
      if (!lorebookName || lorebookName.includes('/')) {
        records.push(makeRecord(operation, 'blocked', '世界书名称不合法', 'CreateLorebook 需要一个不含斜杠的世界书名称。'));
        continue;
      }
      if (worldbookExists(lorebookName)) {
        records.push(makeRecord(operation, operation.skipIfExists ? 'skipped' : 'warning', '世界书已存在', `将跳过创建：${lorebookName}`));
        continue;
      }
      records.push(makeRecord(operation, 'ok', '将创建世界书', `确认后会创建空世界书：${lorebookName}`));
      continue;
    }

    if (!normalized) {
      records.push(makeRecord(operation, 'blocked', '路径不合法', '路径必须是 /Worldbooks、/Characters、/Presets 或 /Schemas 下的绝对虚拟路径。'));
      continue;
    }

    if (operation.tool === 'Write') {
      const artifact = findArtifact(artifacts, operation);
      if (!artifact) {
        records.push(makeRecord(operation, 'blocked', '缺少写入内容', '这个 Write 动作没有绑定前端生成产物。'));
        continue;
      }
      const node = await resolveWritableFileNode(normalized);
      if (!node) {
        if (hasPlannedLorebookBefore(operations, operation)) {
          records.push(makeRecord(operation, 'ok', '将在新世界书中创建条目', `内容来自前端产物：${artifact.title}`));
          continue;
        }
        records.push(makeRecord(operation, 'blocked', '目标不可写', '目标角色卡或世界书不存在，或该路径不是可写文件。'));
        continue;
      }
      records.push(
        makeRecord(
          operation,
          node.exists ? 'warning' : 'ok',
          node.exists ? '将覆盖已有条目' : '将创建新条目',
          `内容来自前端产物：${artifact.title}`,
        ),
      );
      continue;
    }

    if (operation.tool === 'SetAttribute') {
      if (!operation.attributes) {
        records.push(makeRecord(operation, 'blocked', '缺少属性补丁', 'SetAttribute 动作必须带 attributes。'));
        continue;
      }
      if (hasPlannedWriteBefore(operations, operation)) {
        records.push(makeRecord(operation, 'ok', '将在写入后设置属性', '该条目会由前置 Write 创建或覆盖，然后应用属性补丁。'));
        continue;
      }
      const node = await resolveFileNode(normalized);
      if (!node) {
        records.push(makeRecord(operation, 'blocked', '条目不存在', 'SetAttribute 只能作用于已经存在或本计划先写入的世界书条目。'));
        continue;
      }
      if (!isAttributeNode(node)) {
        records.push(makeRecord(operation, 'blocked', '目标不支持属性', '当前路径不是可设置属性的世界书条目。'));
        continue;
      }
      records.push(makeRecord(operation, 'ok', '将更新条目属性', '属性补丁会按 lossy patch 方式应用，未涉及字段保持不变。'));
      continue;
    }

    records.push(makeRecord(operation, 'blocked', '暂不支持的动作', `当前宝宝辅食执行器暂不执行 ${operation.tool}。`));
  }
  return records;
}

function normalizeEntryCommentPath(worldbookName: string, value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return normalizeVirtualPath(`/Worldbooks/${worldbookName}/${value.trim()}`);
}

async function setWorldbookAttributesByComment(operation: WorkshopWriteOperation) {
  if (!operation.attributes) {
    throw new Error('SetAttribute 缺少 attributes。');
  }

  const worldbookName = getLorebookName(operation);
  const entryPath = getLorebookEntryPath(operation);
  const normalizedTarget = normalizeVirtualPath(operation.targetPath);
  if (!worldbookName || !entryPath || !normalizedTarget) return null;

  let updatedEntry: WorldbookEntry | undefined;
  await updateWorldbookWith(worldbookName, worldbook => {
    const matchingEntries = worldbook.filter(entry => {
      const commentPath = normalizeEntryCommentPath(worldbookName, (entry as WorldbookEntry & { comment?: string }).comment);
      if (commentPath) return commentPath === normalizedTarget;

      const namePath = normalizeEntryCommentPath(worldbookName, entry.name);
      return namePath === normalizedTarget;
    });

    if (matchingEntries.length !== 1) {
      return worldbook;
    }

    const targetUid = matchingEntries[0].uid;
    return worldbook.map(entry => {
      if (entry.uid !== targetUid) return entry;
      updatedEntry = applyWorldbookPatch(entry, operation.attributes as Record<string, unknown>);
      return updatedEntry;
    });
  });

  if (!updatedEntry) return null;
  return {
    filePath: normalizedTarget,
    attributes: updatedEntry,
    fallback: 'worldbook-comment-match',
  };
}

async function setAttributeActionWithFallback(operation: WorkshopWriteOperation) {
  try {
    return await setAttributeAction({ file_path: operation.targetPath, attributes: operation.attributes });
  } catch (error) {
    const fallbackResult = await setWorldbookAttributesByComment(operation);
    if (fallbackResult) {
      return {
        ...fallbackResult,
        originalError: error instanceof Error ? error.message : String(error),
      };
    }
    throw error;
  }
}

export async function applyWorkshopPlan(
  artifacts: WorkshopArtifact[],
  operations: WorkshopWriteOperation[],
): Promise<WorkshopExecutionRecord[]> {
  const dryrunRecords = await dryrunWorkshopPlan(artifacts, operations);
  if (dryrunRecords.some(record => record.status === 'blocked')) {
    return dryrunRecords;
  }

  const records: WorkshopExecutionRecord[] = [];
  for (const operation of operations) {
    try {
      if (operation.tool === 'CreateLorebook') {
        const lorebookName = getLorebookName(operation);
        if (!lorebookName) {
          throw new Error('CreateLorebook 缺少 lorebookName。');
        }
        if (worldbookExists(lorebookName) && operation.skipIfExists) {
          records.push(makeRecord(operation, 'skipped', '已跳过创建世界书', `世界书已存在：${lorebookName}`));
          continue;
        }
        const result = await createLorebookAction({ lorebook_name: lorebookName });
        records.push(makeRecord(operation, 'applied', '已创建世界书', `已创建：${lorebookName}`, result));
        continue;
      }

      if (operation.tool === 'Write') {
        const artifact = findArtifact(artifacts, operation);
        if (!artifact) {
          throw new Error('Write 缺少绑定产物。');
        }
        const result = await writeAction({ file_path: operation.targetPath, content: artifact.content });
        records.push(makeRecord(operation, 'applied', '已写入条目', operation.summary, result));
        continue;
      }

      if (operation.tool === 'SetAttribute') {
        if (!operation.attributes) {
          throw new Error('SetAttribute 缺少 attributes。');
        }
        const result = await setAttributeActionWithFallback(operation);
        records.push(makeRecord(operation, 'applied', '已设置条目属性', operation.summary, result));
        continue;
      }

      records.push(makeRecord(operation, 'skipped', '已跳过', `当前执行器暂不执行 ${operation.tool}。`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      records.push(makeRecord(operation, 'failed', '执行失败', message));
      break;
    }
  }
  return records;
}
