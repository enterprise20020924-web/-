import { jsonrepair } from 'jsonrepair';
import type {
  CheckpointStatus,
  PlanStatus,
  PlanArtifactDelta,
  PlanCheckpoint,
  PlanDraft,
  PlanUpdateOperation,
  PlanUpdateProposal,
  TodoStatus,
} from '../stores/plan';
import type {
  ArtifactContentType,
  WorkshopArtifact,
  WorkshopRiskLevel,
  WorkshopWriteOperation,
  WorkshopWriteTool,
} from '../stores/workshop';

const todoStatuses = ['todo', 'doing', 'blocked', 'done', 'skipped'] as const;
const checkpointStatuses = ['ready_for_user', 'blocked', 'needs_adjustment', 'ready_to_complete'] as const;
const statusSuggestions = ['continue', 'needs_adjustment', 'ready_to_complete', 'pause', 'blocked'] as const;
const artifactContentTypes = ['yaml', 'text', 'ts', 'ejs', 'json'] as const;
const riskLevels = ['text', 'config', 'code', 'danger'] as const;
const writeTools = ['Write', 'SetAttribute', 'CreateLorebook', 'Edit'] as const;

export interface PlanProtocolDisplayBlock {
  start: number;
  end: number;
  raw: string;
  title: string;
  preview: string;
}

export interface ParsedPlanProtocol {
  draft: PlanDraft | null;
  checkpoint: PlanCheckpoint | null;
  update: PlanUpdateProposal | null;
  artifactDelta: PlanArtifactDelta | null;
}

const planProtocolSchemaRe = /"schema"\s*:\s*"mingyue\.(?:plan_(?:draft|checkpoint|update|artifact_delta)|write_plan)\.v2"/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function valueOf(record: Record<string, unknown>, ...keys: string[]) {
  return keys.map(key => record[key]).find(value => value !== undefined);
}

function stringValue(record: Record<string, unknown>, ...keys: string[]) {
  const value = valueOf(record, ...keys);
  return typeof value === 'string' ? value : null;
}

function booleanValue(record: Record<string, unknown>, ...keys: string[]) {
  const value = valueOf(record, ...keys);
  return typeof value === 'boolean' ? value : null;
}

function stringArrayValue(record: Record<string, unknown>, ...keys: string[]) {
  return stringArray(valueOf(record, ...keys));
}

function todoStatus(value: unknown): TodoStatus | null {
  return typeof value === 'string' && (todoStatuses as readonly string[]).includes(value) ? value as TodoStatus : null;
}

function checkpointStatus(value: unknown): CheckpointStatus {
  return typeof value === 'string' && (checkpointStatuses as readonly string[]).includes(value)
    ? value as CheckpointStatus
    : 'ready_for_user';
}

function contentType(value: unknown): ArtifactContentType {
  return typeof value === 'string' && (artifactContentTypes as readonly string[]).includes(value)
    ? value as ArtifactContentType
    : 'text';
}

function riskLevel(value: unknown, fallback: WorkshopRiskLevel = 'text'): WorkshopRiskLevel {
  return typeof value === 'string' && (riskLevels as readonly string[]).includes(value) ? value as WorkshopRiskLevel : fallback;
}

function writeTool(value: unknown): WorkshopWriteTool | null {
  return typeof value === 'string' && (writeTools as readonly string[]).includes(value) ? value as WorkshopWriteTool : null;
}

function extractJsonObjects(text: string): unknown[] {
  const candidates = [
    ...Array.from(text.matchAll(/```(?:json|plan)?\s*([\s\S]*?)```/gi), match => match[1]),
    ...Array.from(text.matchAll(/<pre>\s*([\s\S]*?)<\/pre>/gi), match => match[1]),
    ...Array.from(
      text.matchAll(/<mingyue_(?:plan_(?:draft|checkpoint|update|artifact_delta)|write_plan)>\s*([\s\S]*?)<\/mingyue_(?:plan_(?:draft|checkpoint|update|artifact_delta)|write_plan)>/gi),
      match => match[1],
    ),
  ];

  const schemaIndex = text.search(planProtocolSchemaRe);
  if (schemaIndex >= 0) {
    const start = text.lastIndexOf('{', schemaIndex);
    const end = text.indexOf('\n```', schemaIndex);
    candidates.push(text.slice(start >= 0 ? start : schemaIndex, end > schemaIndex ? end : undefined));
  }

  return candidates.flatMap(candidate => {
    try {
      return [JSON.parse(jsonrepair(candidate.trim()))];
    } catch {
      return [];
    }
  });
}

export function parsePlanDraft(value: unknown): PlanDraft | null {
  if (!isRecord(value) || value.schema !== 'mingyue.plan_draft.v2') return null;
  const title = stringValue(value, 'title');
  const userGoal = stringValue(value, 'userGoal', 'user_goal');
  if (!title || !userGoal || !Array.isArray(value.todos)) return null;

  const todos = value.todos.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.title !== 'string') return [];
    return [{
      id: typeof item.id === 'string' && item.id.trim() ? item.id : `todo-${index + 1}`,
      title: item.title,
      detail: typeof item.detail === 'string' ? item.detail : '',
      required: booleanValue(item, 'required') ?? true,
    }];
  });
  if (!todos.length) return null;

  return {
    schema: 'mingyue.plan_draft.v2',
    title,
    userGoal,
    successCriteria: stringArrayValue(value, 'successCriteria', 'success_criteria'),
    assumptions: stringArrayValue(value, 'assumptions'),
    todos,
    activeTodoId: stringValue(value, 'activeTodoId', 'active_todo_id') ?? todos[0]?.id ?? null,
    blockers: stringArrayValue(value, 'blockers'),
    writeBoundary: stringArrayValue(value, 'writeBoundary', 'write_boundary'),
    questions: stringArrayValue(value, 'questions'),
    confidence: value.confidence === 'needs_input' ? 'needs_input' : 'enough',
  };
}

export function parsePlanCheckpoint(value: unknown): PlanCheckpoint | null {
  if (!isRecord(value) || value.schema !== 'mingyue.plan_checkpoint.v2') return null;
  const planId = stringValue(value, 'planId', 'plan_id');
  const summary = stringValue(value, 'summary');
  if (!planId || !summary) return null;
  const rawTodoId = valueOf(value, 'todoId', 'todo_id');
  return {
    schema: 'mingyue.plan_checkpoint.v2',
    checkpointId: stringValue(value, 'checkpointId', 'checkpoint_id') ?? `checkpoint-${Date.now()}`,
    planId,
    todoId: typeof rawTodoId === 'string' || rawTodoId === null ? rawTodoId : null,
    status: checkpointStatus(valueOf(value, 'status')),
    summary,
    continueHint: stringValue(value, 'continueHint', 'continue_hint') ?? '继续下一步',
    adjustmentHint: stringValue(value, 'adjustmentHint', 'adjustment_hint') ?? '也可以直接输入调整意见',
    artifactVersionRefs: stringArrayValue(value, 'artifactVersionRefs', 'artifact_version_refs'),
    blockers: stringArrayValue(value, 'blockers'),
    questions: stringArrayValue(value, 'questions'),
  };
}

function parseOperation(value: unknown): PlanUpdateOperation | null {
  if (!isRecord(value) || typeof value.op !== 'string') return null;
  const todoId = stringValue(value, 'todoId', 'todo_id');
  switch (value.op) {
    case 'set_todo_status': {
      const status = todoStatus(value.status);
      return todoId && status ? { op: 'set_todo_status', todoId, status, evidence: stringValue(value, 'evidence') ?? undefined } : null;
    }
    case 'add_todo': {
      const todo = isRecord(value.todo) ? value.todo : null;
      const title = todo ? stringValue(todo, 'title') : stringValue(value, 'title');
      if (!title) return null;
      return {
        op: 'add_todo',
        todo: {
          id: todo ? stringValue(todo, 'id') ?? `todo-${Date.now()}` : todoId ?? `todo-${Date.now()}`,
          title,
          detail: todo ? stringValue(todo, 'detail') ?? '' : stringValue(value, 'detail') ?? '',
          required: todo ? booleanValue(todo, 'required') ?? true : booleanValue(value, 'required') ?? true,
        },
      };
    }
    case 'update_todo': {
      if (!todoId) return null;
      return {
        op: 'update_todo',
        todoId,
        title: stringValue(value, 'title') ?? undefined,
        detail: stringValue(value, 'detail') ?? undefined,
        required: booleanValue(value, 'required') ?? undefined,
        evidence: stringValue(value, 'evidence') ?? undefined,
      };
    }
    case 'remove_todo':
      return todoId ? { op: 'remove_todo', todoId } : null;
    case 'set_active_todo': {
      const rawTodoId = valueOf(value, 'todoId', 'todo_id');
      return typeof rawTodoId === 'string' || rawTodoId === null ? { op: 'set_active_todo', todoId: rawTodoId } : null;
    }
    case 'add_blocker':
      return stringValue(value, 'blocker') ? { op: 'add_blocker', blocker: stringValue(value, 'blocker') as string } : null;
    case 'remove_blocker':
      return stringValue(value, 'blocker') ? { op: 'remove_blocker', blocker: stringValue(value, 'blocker') as string } : null;
    case 'set_prompt_notes':
      return stringValue(value, 'promptNotes', 'prompt_notes') ? { op: 'set_prompt_notes', promptNotes: stringValue(value, 'promptNotes', 'prompt_notes') as string } : null;
    case 'set_plan_status': {
      const status = stringValue(value, 'status');
      return status && ['active', 'paused', 'blocked', 'ready_to_complete', 'completed'].includes(status)
        ? { op: 'set_plan_status', status: status as PlanStatus }
        : null;
    }
    default:
      return null;
  }
}

export function parsePlanUpdate(value: unknown): PlanUpdateProposal | null {
  if (!isRecord(value) || value.schema !== 'mingyue.plan_update.v2') return null;
  const planId = stringValue(value, 'planId', 'plan_id');
  const checkpointId = stringValue(value, 'checkpointId', 'checkpoint_id');
  if (!planId || !checkpointId) return null;
  const rawStatusSuggestion = stringValue(value, 'statusSuggestion', 'status_suggestion');
  const statusSuggestion = rawStatusSuggestion && (statusSuggestions as readonly string[]).includes(rawStatusSuggestion)
    ? rawStatusSuggestion as PlanUpdateProposal['statusSuggestion']
    : 'continue';
  return {
    schema: 'mingyue.plan_update.v2',
    planId,
    checkpointId,
    statusSuggestion,
    summary: stringValue(value, 'summary') ?? 'AI 提出了计划状态更新。',
    ops: Array.isArray(value.ops) ? value.ops.flatMap(item => parseOperation(item) ?? []) : [],
    questions: stringArrayValue(value, 'questions'),
  };
}

function parseArtifacts(value: unknown): WorkshopArtifact[] {
  const rawArtifacts = Array.isArray(value) ? value : [];
  return rawArtifacts.flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const targetPath = stringValue(item, 'targetPath', 'target_path');
    const content = stringValue(item, 'content');
    if (!targetPath || content === null) return [];
    return [{
      id: stringValue(item, 'id', 'artifactId', 'artifact_id') ?? `artifact-${Date.now()}-${index}`,
      title: stringValue(item, 'title') ?? `产物 ${index + 1}`,
      targetPath,
      content,
      contentType: contentType(valueOf(item, 'contentType', 'content_type')),
      riskLevel: riskLevel(valueOf(item, 'riskLevel', 'risk_level')),
    }];
  });
}

function parseOperations(value: unknown): WorkshopWriteOperation[] {
  const rawOperations = Array.isArray(value) ? value : [];
  return rawOperations.flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const tool = writeTool(valueOf(item, 'tool'));
    const targetPath = stringValue(item, 'targetPath', 'target_path', 'path');
    if (!tool || !targetPath) return [];
    return [{
      id: stringValue(item, 'id') ?? `write-${Date.now()}-${index}`,
      tool,
      targetPath,
      summary: stringValue(item, 'summary') ?? `${tool} ${targetPath}`,
      riskLevel: riskLevel(valueOf(item, 'riskLevel', 'risk_level'), tool === 'SetAttribute' ? 'config' : 'text'),
      artifactId: stringValue(item, 'artifactId', 'artifact_id') ?? undefined,
      attributes: isRecord(valueOf(item, 'attributes')) ? valueOf(item, 'attributes') as Record<string, unknown> : undefined,
      lorebookName: stringValue(item, 'lorebookName', 'lorebook_name') ?? undefined,
      optional: booleanValue(item, 'optional') ?? undefined,
      skipIfExists: booleanValue(item, 'skipIfExists', 'skip_if_exists') ?? undefined,
    }];
  });
}

export function parsePlanArtifactDelta(value: unknown): PlanArtifactDelta | null {
  if (!isRecord(value) || (value.schema !== 'mingyue.plan_artifact_delta.v2' && value.schema !== 'mingyue.write_plan.v2')) return null;
  const artifacts = parseArtifacts(value.artifacts);
  const operations = parseOperations(
    Array.isArray(value.operations)
      ? value.operations
      : Array.isArray(value.ops)
        ? value.ops
        : Array.isArray(value.writePlan)
          ? value.writePlan
          : value.write_plan,
  );
  if (!artifacts.length && !operations.length) return null;
  return {
    schema: 'mingyue.plan_artifact_delta.v2',
    planId: stringValue(value, 'planId', 'plan_id'),
    summary: stringValue(value, 'summary') ?? 'AI 更新了计划产物工作区。',
    artifacts,
    operations,
  };
}

export function parsePlanProtocolFromText(text: string): ParsedPlanProtocol {
  const objects = extractJsonObjects(text);
  return {
    draft: objects.map(parsePlanDraft).find(Boolean) ?? null,
    checkpoint: objects.map(parsePlanCheckpoint).find(Boolean) ?? null,
    update: objects.map(parsePlanUpdate).find(Boolean) ?? null,
    artifactDelta: objects.map(parsePlanArtifactDelta).find(Boolean) ?? null,
  };
}

function protocolDisplayForRaw(raw: string, start: number, end: number): PlanProtocolDisplayBlock | null {
  const protocol = parsePlanProtocolFromText(raw);
  const previews: string[] = [];
  let protocolCount = 0;
  let title = '';

  if (protocol.draft) {
    protocolCount += 1;
    title = '已识别计划草稿';
    previews.push(`PlanDraft「${protocol.draft.title}」，${protocol.draft.todos.length} 个 todo`);
  }

  if (protocol.checkpoint) {
    protocolCount += 1;
    title = '已识别计划检查点';
    previews.push(`Checkpoint：${protocol.checkpoint.status}，${protocol.checkpoint.summary}`);
  }

  if (protocol.update) {
    protocolCount += 1;
    title = '已识别计划更新';
    previews.push(`PlanUpdate：${protocol.update.ops.length} 条操作，建议 ${protocol.update.statusSuggestion}`);
  }

  if (protocol.artifactDelta) {
    protocolCount += 1;
    title = '已识别产物工作区更新';
    previews.push(`ArtifactDelta「${protocol.artifactDelta.summary}」，${protocol.artifactDelta.artifacts.length} 个产物，${protocol.artifactDelta.operations.length} 条写入动作`);
  }

  if (!protocolCount && planProtocolSchemaRe.test(raw)) {
    const schema = raw.match(/"schema"\s*:\s*"(mingyue\.[^"]+\.v2)"/i)?.[1] ?? 'mingyue.plan.v2';
    return {
      start,
      end,
      raw: raw.trim(),
      title: '已识别计划协议原文',
      preview: `${schema} 未通过完整解析，已折叠为协议原文`,
    };
  }

  if (!protocolCount) return null;

  return {
    start,
    end,
    raw: raw.trim(),
    title: protocolCount === 1 ? title : `已识别 ${protocolCount} 个计划协议`,
    preview: previews.join('；'),
  };
}

export function extractPlanProtocolDisplayBlocks(text: string): PlanProtocolDisplayBlock[] {
  const candidates: Array<{ start: number; end: number; raw: string }> = [];

  const pushMatches = (pattern: RegExp) => {
    for (const match of text.matchAll(pattern)) {
      if (match.index === undefined || !planProtocolSchemaRe.test(match[0])) continue;
      candidates.push({
        start: match.index,
        end: match.index + match[0].length,
        raw: match[0],
      });
    }
  };

  const pushFencedProtocolBlocks = () => {
    const fencedRe = /```[^\r\n`]*(?:\r?\n|$)[\s\S]*?```/g;
    for (const match of text.matchAll(fencedRe)) {
      if (match.index === undefined || !planProtocolSchemaRe.test(match[0])) continue;
      candidates.push({
        start: match.index,
        end: match.index + match[0].length,
        raw: match[0],
      });
    }
  };

  pushMatches(/<details\b[\s\S]*?<\/details>/gi);
  pushMatches(/<mingyue_(?:plan_(?:draft|checkpoint|update|artifact_delta)|write_plan)>\s*[\s\S]*?<\/mingyue_(?:plan_(?:draft|checkpoint|update|artifact_delta)|write_plan)>/gi);
  pushFencedProtocolBlocks();

  if (!candidates.length && planProtocolSchemaRe.test(text.trim())) {
    const leadingWhitespace = text.match(/^\s*/)?.[0].length ?? 0;
    const trailingWhitespace = text.match(/\s*$/)?.[0].length ?? 0;
    candidates.push({
      start: leadingWhitespace,
      end: text.length - trailingWhitespace,
      raw: text.trim(),
    });
  }

  let lastEnd = -1;
  return candidates
    .sort((left, right) => left.start - right.start || right.end - left.end)
    .flatMap(candidate => {
      if (candidate.start < lastEnd) return [];
      const display = protocolDisplayForRaw(candidate.raw, candidate.start, candidate.end);
      if (!display) return [];
      lastEnd = candidate.end;
      return [display];
    });
}
