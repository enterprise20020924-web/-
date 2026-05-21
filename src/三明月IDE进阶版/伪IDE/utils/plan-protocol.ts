import { jsonrepair } from 'jsonrepair';
import type { PlanDraft, PlanUpdateOperation, PlanUpdateProposal, TodoStatus } from '../stores/plan';

const todoStatuses = ['todo', 'doing', 'blocked', 'done', 'skipped'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function todoStatus(value: unknown): TodoStatus | null {
  return typeof value === 'string' && (todoStatuses as readonly string[]).includes(value) ? value as TodoStatus : null;
}

function extractJsonObjects(text: string): unknown[] {
  const candidates = [
    ...Array.from(text.matchAll(/```(?:json|plan)?\s*([\s\S]*?)```/gi), match => match[1]),
    ...Array.from(text.matchAll(/<mingyue_plan(?:_draft|_update)?>\s*([\s\S]*?)<\/mingyue_plan(?:_draft|_update)?>/gi), match => match[1]),
  ];

  const schemaIndex = text.search(/"schema"\s*:\s*"mingyue\.plan_(?:draft|update)\.v1"/);
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
  if (!isRecord(value) || value.schema !== 'mingyue.plan_draft.v1') return null;
  if (typeof value.title !== 'string' || typeof value.userGoal !== 'string') return null;
  if (!Array.isArray(value.todos)) return null;

  const todos = value.todos.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.title !== 'string') return [];
    return [{
      id: typeof item.id === 'string' && item.id.trim() ? item.id : `todo-${index + 1}`,
      title: item.title,
      detail: typeof item.detail === 'string' ? item.detail : '',
      required: typeof item.required === 'boolean' ? item.required : true,
    }];
  });
  if (!todos.length) return null;

  return {
    schema: 'mingyue.plan_draft.v1',
    title: value.title,
    userGoal: value.userGoal,
    successCriteria: stringArray(value.successCriteria),
    assumptions: stringArray(value.assumptions),
    todos,
    activeTodoId: typeof value.activeTodoId === 'string' ? value.activeTodoId : todos[0]?.id ?? null,
    blockers: stringArray(value.blockers),
    writeBoundary: stringArray(value.writeBoundary),
    questions: stringArray(value.questions),
    confidence: value.confidence === 'needs_input' ? 'needs_input' : 'enough',
  };
}

function parseOperation(value: unknown): PlanUpdateOperation | null {
  if (!isRecord(value) || typeof value.op !== 'string') return null;
  switch (value.op) {
    case 'set_todo_status': {
      const status = todoStatus(value.status);
      return typeof value.todoId === 'string' && status
        ? { op: 'set_todo_status', todoId: value.todoId, status, evidence: typeof value.evidence === 'string' ? value.evidence : undefined }
        : null;
    }
    case 'add_todo': {
      const todo = isRecord(value.todo) ? value.todo : null;
      return todo && typeof todo.title === 'string'
        ? { op: 'add_todo', todo: { id: typeof todo.id === 'string' ? todo.id : `todo-${Date.now()}`, title: todo.title, detail: typeof todo.detail === 'string' ? todo.detail : '', required: typeof todo.required === 'boolean' ? todo.required : true } }
        : null;
    }
    case 'update_todo':
      return typeof value.todoId === 'string'
        ? { op: 'update_todo', todoId: value.todoId, title: typeof value.title === 'string' ? value.title : undefined, detail: typeof value.detail === 'string' ? value.detail : undefined, required: typeof value.required === 'boolean' ? value.required : undefined, evidence: typeof value.evidence === 'string' ? value.evidence : undefined }
        : null;
    case 'remove_todo':
      return typeof value.todoId === 'string' ? { op: 'remove_todo', todoId: value.todoId } : null;
    case 'set_active_todo':
      return typeof value.todoId === 'string' || value.todoId === null ? { op: 'set_active_todo', todoId: value.todoId } : null;
    case 'add_blocker':
      return typeof value.blocker === 'string' ? { op: 'add_blocker', blocker: value.blocker } : null;
    case 'remove_blocker':
      return typeof value.blocker === 'string' ? { op: 'remove_blocker', blocker: value.blocker } : null;
    case 'set_prompt_notes':
      return typeof value.promptNotes === 'string' ? { op: 'set_prompt_notes', promptNotes: value.promptNotes } : null;
    default:
      return null;
  }
}

export function parsePlanUpdate(value: unknown): PlanUpdateProposal | null {
  if (!isRecord(value) || value.schema !== 'mingyue.plan_update.v1' || typeof value.planId !== 'string') return null;
  const allowed = ['continue', 'ready_to_complete', 'pause', 'blocked'];
  const statusSuggestion = typeof value.statusSuggestion === 'string' && allowed.includes(value.statusSuggestion)
    ? value.statusSuggestion as PlanUpdateProposal['statusSuggestion']
    : 'continue';
  return {
    schema: 'mingyue.plan_update.v1',
    planId: value.planId,
    statusSuggestion,
    summary: typeof value.summary === 'string' ? value.summary : 'AI 提出了计划更新建议',
    ops: Array.isArray(value.ops) ? value.ops.flatMap(item => parseOperation(item) ?? []) : [],
    questions: stringArray(value.questions),
  };
}

export function parsePlanProtocolFromText(text: string): { draft: PlanDraft | null; update: PlanUpdateProposal | null } {
  const objects = extractJsonObjects(text);
  return {
    draft: objects.map(parsePlanDraft).find(Boolean) ?? null,
    update: objects.map(parsePlanUpdate).find(Boolean) ?? null,
  };
}
